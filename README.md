# inkstream

Markdown engine for Mintlify-style JSX tags, Zenn directives, and GFM,
built as remark/rehype plugins over the mdast tree rather than a
line-based string preprocessor. Supersedes an earlier draft (internally
called "v1" below) that converted the same JSX tags to colon-fence
directives with a ~1,850-line line-based preprocessor; that draft is
frozen and unpublished.

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

## Using the library: two layers

inkstream is consumed at two distinct levels, and every feature belongs
to exactly one of them. The boundary is the `.ink-markdown` element:
**inside it is the library's job; outside it — and everything that needs
app-specific knowledge — is the consumer's job.**

### Layer 1 — Drop-in (zero config)

The `/react` subpath renders inkstream markdown in one line, and the core
package stays React-free:

```tsx
import { InkstreamMarkdown } from '@catatsumuri/inkstream/react';

<InkstreamMarkdown>{markdownSource}</InkstreamMarkdown>;
```

Everything below works with no props and no app-side code:

- Headings with slug ids and copy-link anchors (h1–h4)
- Callouts in all three syntaxes (Mintlify `<Note>` tags, `:::message`,
  GitHub `> [!NOTE]` alerts) normalized onto one `aside.msg` contract
- Every Mintlify component: Card/CardGroup, Steps, Tabs, Accordion,
  Badge, Tooltip, Update, ResponseField/ParamField, CodeGroup, Tree
- Code blocks: Shiki highlighting, copy button, wrap toggle, filename
  headers (` ```php:index.php `), diff mode (` ```diff js:app.js `)
- ` ```mermaid ` diagrams (lazy-loaded chunk, optional peer dependency)
- ` ```tree `, ` ```quiz `, ` ```chart:bar ` / ` ```chart:radar ` fences
- Zenn image sizing/captions (`![](url =250x)`, `*caption*` line)
- YouTube embeds from standalone URLs
- GitHub file embeds from standalone blob URLs
  (`raw.githubusercontent.com` allows CORS, so the browser fetches
  directly — no server help needed)

One deliberate non-feature: the default renderers carry stable `ink-*`
class names and **no visual opinions**. Layer 1 gives you correct
structure; making it look right is Layer 2's stylesheet.

### Layer 2 — App integration surface

These features are split "parsing in the library, knowledge in the app":
the library ships the syntax support and an injection point, and degrades
gracefully when the app doesn't provide one. kb_practice is the reference
implementation for each.

| Integration point | What the app supplies | Without it | kb_practice reference |
| --- | --- | --- | --- |
| `ink-*` stylesheet | CSS for the class hooks | Unstyled structure | `resources/css/inkstream.css` |
| `resolveWikilink` prop | `[[path]]` → URL (routing/DB lookup) | `[[...]]` stays literal text | title→id map; unresolved links route to the create form |
| `ogpEndpoint` prop | Server-side OGP proxy (CORS blocks direct fetch) | URL-only link cards | `OgpController` (validation + 24h cache) |
| `extractMarkdownHeadings` + `headingIdPrefix` | Table-of-contents UI outside `.ink-markdown` | No TOC (anchors still work) | `DocumentTableOfContents` scrollspy |
| `components` prop | Per-tag renderer overrides | Default `ink-*` renderers | — |
| Dark mode | `dark` class on the document root + CSS for the `--shiki-*` variables | Light theme only | Tailwind `.dark` convention |
| Page behaviors | Anything tied to navigation lifecycle (e.g. hash-anchor scroll restore in an SPA, where content mounts after the browser's native jump) | Browser defaults | hash restore on Inertia navigation |

Core-only consumers (no React) can use `normalizeInkstreamMarkdown` +
`inkstreamRemarkPlugins` from the root entry point in any unified
pipeline — the golden corpus renderer does exactly this. `react` and
`react-markdown` are optional peer dependencies, so this path pulls in
no React at all.

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
  attribute, so the raw JSON also renders as a visible `<pre><code>` block.
  v2's `mintlifyContainer` has no children for these, so only the intended
  component renders.

## Not yet implemented (planned)

- Per-component attribute schemas (currently reuses v1's global allowlist
  for `hProperties`; the full parsed attribute map is kept on the node).
- Tags inside blockquotes/lists currently require blank lines around them
  (the normalizer only handles top-level tag lines); fixing this means
  splitting multi-line `html` nodes or normalizing per container.
- Multi-line JSX open tags (an open tag with attributes spread across
  several lines; v1 joins them in `joinMultilineJsxTags`).
- Attribute naming convention: v1 prefixes hProperties with
  `data-<component>-<attr>` (e.g. `data-card-href`), presumably because its
  output was raw custom HTML elements read via `dataset`. v2 intentionally
  uses raw names (`href`) since containers render through React components
  that read props directly — this is a deliberate v2 API change, not a gap
  to close.
- npm packaging (built dist + bundled CSS) and a CLI. See
  `DISTRIBUTION.md` for the plan. CI (typecheck/test/golden) is already
  in place.

## Golden corpus (`golden/`)

Snapshot regression suite: renders every `golden/corpus/*.md` fixture
through the full pipeline and compares the prettified HTML against the
committed baseline in `golden/baseline/*.html`.

```sh
npm run golden             # check; exits non-zero on any diff
npm run golden -- --update # re-render and accept the current output
```

- `golden/render-v2.ts` — the pipeline under test
  (`normalizeInkstreamMarkdown` → `inkstreamRemarkPlugins` →
  `remark-rehype` → `hast-util-to-html`), the same exports consumers use.
- `golden/diff.ts` — prettifies output to one tag per line, line-diffs it
  against the baseline, and writes the current output to
  `golden/output/*.html` (gitignored) for inspection.

Fixtures `01`–`09` are synthetic; `10`–`14` are the five real syntax-guide
documents from thinkstream's `SyntaxSeeder` (basic markdown, extended
markdown/GFM, Zenn syntax, Mintlify syntax, thinkstream syntax) — a far
truer signal, and the corpus that surfaced the fence-state, inline-code,
indentation, and array-attribute bugs the current pipeline fixes.

The corpus originally drove a v1-vs-v2 comparison (rendering the same
fixtures through inkstream v1's directive pipeline); once every difference
was either fixed or decided as an intentional v2 change, the v1 renderer
and its `file:` dependency were dropped and the v2 output became the
baseline.
