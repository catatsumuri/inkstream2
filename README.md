# inkstream2 (draft)

Draft rewrite of the inkstream markdown engine. v1 converts Mintlify-style
JSX tags to colon-fence directives with a ~1,850-line line-based string
preprocessor; v2 builds the same structure directly on the mdast tree.

## Pipeline

1. `normalizeMintlifyBlocks(markdown)` — line-based pre-pass that surrounds
   standalone tag lines with blank lines (skipping code fences) so remark
   parses each tag as its own `html` flow node, strips the authoring
   indentation inside open tags (up to the open tag's indent + 4, mirroring
   v1) so indented tag bodies don't become indented code blocks, and
   flattens JSX array attributes (`tags={["A", "B"]}` → `tags="A,B"`), which
   would otherwise make the tag invalid HTML for remark.
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
5. `normalizeZennDirectiveShorthand(markdown)` (run before step 1, alongside
   `normalizeMintlifyBlocks`) + `remark-directive` + `remarkZennDirective` —
   support for the native `:::message` / `:::details` authoring syntax an
   author can write directly (as opposed to the Mintlify JSX tags, which v2
   never routes through colon-fences at all). The shorthand normalizer
   rewrites the friendly `:::message alert` / `:::details タイトル` forms
   into the `{.class}` / `[label]` syntax `remark-directive` requires;
   `remarkZennDirective` then reads the resulting `containerDirective` nodes
   remark-directive produces. This is the one piece of the pipeline that
   still needs a third-party directive parser, since colon-fence syntax
   itself isn't something a tag-pairing plugin over `html` nodes can parse.
   Like v1, the normalizer protects code fences *and* inline code spans, so
   literal `` `:::message alert` `` examples in prose survive; it also
   reduces Zenn's `@[card](url)` / `@[github](url)` embeds to bare URL
   lines for a linkify-style renderer to pick up.
6. `remarkGithubAlerts` — normalizes GitHub blockquote alerts (`> [!NOTE]`
   etc.) onto the same `aside.msg` contract as the Mintlify callouts and
   `:::message`.
7. `remarkTreeTags` — converts a paired JSX `<Tree><Tree.Folder>…</Tree>`
   block (captured by `remarkMintlifyTags`) into the same JSON-carrying
   `tree` node the ` ```tree ` fence produces.
8. `normalizeZennImages(markdown)` + `parseImageMetadata(url)` — Zenn's
   image sizing/caption syntax (`![](url =250x)`, a `*caption*` line under
   the image). The sizing suffix lives inside the markdown image
   destination, where remark's parser refuses spaces, so this stays a
   line-based step that encodes the metadata into query parameters; an
   image renderer reads them back with `parseImageMetadata`.

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
- Multi-line JSX open tags (an open tag with attributes spread across
  several lines; v1 joins them in `joinMultilineJsxTags`).
- A linkify-to-card renderer for the bare URL lines the embed shorthand
  produces (v2 reduces `@[card](url)` to the URL like v1, but the card
  preview component itself lives in the consumer).
- Wikilinks (`[[page]]`), which v1 resolves via `remark-wikilinks`.
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
  (`normalizeZennDirectiveShorthand` + `normalizeMintlifyBlocks` →
  `remarkDirective` → `remarkZennDirective` → `remarkMintlifyTags` →
  `remarkCodeFenceComponents`).
- `golden/diff.ts` — prettifies both HTML outputs to one tag per line, does
  a line diff, and writes full output to `golden/output/{v1,v2}/*.html`
  (gitignored) for inspection.
- Requires a sibling `../inkstream` checkout with `dist/` built
  (`@catatsumuri/inkstream` is a `file:` devDependency).

Fixtures `01`–`09` are synthetic; `10`–`14` are the five real syntax-guide
documents from thinkstream's `SyntaxSeeder` (basic markdown, extended
markdown/GFM, Zenn syntax, Mintlify syntax, thinkstream syntax) — a far
truer signal, and the corpus that surfaced the fence-state, inline-code,
indentation, and array-attribute bugs the current pipeline fixes.

Current signal (14 fixtures): 7 match byte-for-byte, including three of the
five real documents (`10` basic, `11` extended/GFM+alerts, `12` Zenn). The
7 that differ do so only for decided, documented reasons:

- `03` differs because v1 *can't* pair a single-line tag at all (v2 is
  strictly better here, not a gap).
- `04`, `05`, `08`, `13` differ in attribute/element naming (decided, see
  above) — `13` (the real Mintlify guide) additionally shows v1's
  `details`-based accordion rendering vs. v2's `accordion` element, same
  naming question.
- `06`, `13`, `14` also show v1's redundant raw-JSON `<pre><code>` dump for
  tree/quiz/chart — the parsed JSON payloads themselves are byte-identical
  to v1 in every case, including the real documents' shared-indentation and
  folder-hint tree fences.

Nothing in that list is a surprise; it's the value of running the diff for
real instead of reasoning about it.
