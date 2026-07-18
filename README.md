# inkstream2 (draft)

Draft rewrite of the inkstream markdown engine. v1 converts Mintlify-style
JSX tags to colon-fence directives with a ~1,850-line line-based string
preprocessor; v2 builds the same structure directly on the mdast tree.

## Pipeline

1. `normalizeMintlifyBlocks(markdown)` — the only line-based step left: a
   dumb pass that surrounds standalone tag lines with blank lines (skipping
   code fences) so remark parses each tag as its own `html` flow node.
2. `remark-parse` — standard markdown parsing.
3. `remarkMintlifyTags` — pairs open/close `html` nodes with a stack (once
   for each parent's flow children, once for each paragraph's phrasing
   children) and lifts the nodes between a pair into a `mintlifyContainer`
   node carrying `name`, `attributes`, and `data.hName`/`hProperties` for
   remark-rehype. Block tag names (`Note`, `Card`, `Steps`, ...) pair at
   flow level or as a whole single-line paragraph; inline tag names
   (`Badge`, `Tooltip`) pair mid-paragraph without disturbing surrounding
   text.
4. `remarkCodeFenceComponents` — converts ` ```tree `, ` ```quiz `, and
   ` ```chart:bar `/` ```chart:radar ` fenced code blocks into
   `mintlifyContainer` nodes carrying the parsed structure as one
   JSON-string property (`tree`, `quiz`, `chart`) for a renderer component
   to read. Malformed fences emit a vfile warning and are left as plain
   code blocks.

## What the AST approach fixes structurally

- **No nesting limit** — v1 encoded depth in colon-fence length (7 levels
  max, `10 − depth` colons); v2 nesting is just tree structure.
- **Single-line tags** — `<Note>text</Note>` in one paragraph works.
- **Self-closing tags** — `<Card title="..." />`.
- **Inline tags** — `<Badge>` / `<Tooltip>` pair mid-sentence.
- **Error tolerance with diagnostics** — unmatched close tags stay literal,
  unclosed tags auto-close at end of parent, and both emit vfile warnings
  instead of failing silently. Malformed tree/quiz/chart fences fall back
  to a plain code block with a warning instead of silently dropping data.
- **No redundant raw-JSON dump** — v1's tree/quiz/chart directives leave
  the source fence's `code` child in the tree *alongside* the JSON
  attribute, so the raw JSON also renders as a visible `<pre><code>` block
  (see `golden/output/v1/06-fenced-tree-quiz-chart.html`). v2's
  `mintlifyContainer` has no children for these, so only the intended
  component renders.

## Not in this draft (planned)

- Per-component attribute schemas (draft reuses the v1 global allowlist for
  `hProperties`; the full parsed attribute map is kept on the node).
- Tags inside blockquotes/lists currently require blank lines around them
  (the normalizer only handles top-level tag lines); fixing this means
  splitting multi-line `html` nodes or normalizing per container.
- The JSX `<Tree><Tree.Folder>...</Tree>` tree syntax (only the
  ` ```tree ` fenced-ASCII-listing form is implemented).
- Attribute naming convention: v1 prefixes hProperties with
  `data-<component>-<attr>` (e.g. `data-card-href`), presumably because its
  output was raw custom HTML elements read via `dataset`. v2 intentionally
  uses raw names (`href`) since containers render through React components
  that read props directly — this is a deliberate v2 API change, not a gap
  to close. It's the sole remaining diff on 4 of the 9 golden fixtures.
- Packaging, lint/format/CI.

## Golden corpus (`golden/`)

Renders every `golden/corpus/*.md` fixture through both engines and diffs
the output, to catch v2 regressions/gaps against v1 as the rewrite grows.

```sh
npm run golden
```

- `golden/render-v1.ts` — the *full* intended v1 pipeline: every
  `remark-*-directive` plugin the package ships, not just the narrower
  zenn-directive contract-freeze subset in inkstream's own
  `tests/markdown-pipeline.ts` (kb_practice's actual `MarkdownContent.tsx`
  predates any inkstream integration, so there's no in-app v1 pipeline to
  mirror instead).
- `golden/render-v2.ts` — the current v2 pipeline
  (`normalizeMintlifyBlocks` → `remarkMintlifyTags` →
  `remarkCodeFenceComponents`).
- `golden/diff.ts` — prettifies both HTML outputs to one tag per line, does
  a line diff, and writes full output to `golden/output/{v1,v2}/*.html`
  (gitignored) for inspection.
- Requires a sibling `../inkstream` checkout with `dist/` built
  (`@catatsumuri/inkstream` is a `file:` devDependency).

The fixtures are synthetic, not real thinkstream/yomitoki documents — those
weren't available in this environment. Swap in real corpus files under
`golden/corpus/` to get a truer signal; the harness doesn't care where the
`.md` files came from.

Current signal (9 fixtures): 3 match byte-for-byte (plain GFM, a
multi-line callout, an unclosed-tag warning). The 6 that differ are exactly
the gaps already listed above:

- `03` differs because v1 *can't* pair a single-line tag at all (v2 is
  strictly better here, not a gap).
- `04`, `05`, `08` differ only in attribute naming (decided, see above).
- `06` (tree/quiz/chart) differs only in the redundant-raw-JSON-dump
  question above — the parsed JSON payload itself is byte-identical to v1
  for all three fence types.
- `07` (native `:::` directives) is the one genuine unimplemented gap left.

Nothing in that list is a surprise; it's the value of running the diff for
real instead of reasoning about it.
