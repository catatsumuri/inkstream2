## Extended Markdown Syntax

Extended syntax adds features beyond the core Markdown spec. This page covers GitHub Flavored Markdown (GFM) extensions, which are supported by this renderer.

> Features marked **✓ Renders here** are active in this app. Others may require additional plugins or a different renderer.

---

## Strikethrough ✓ Renders here

Wrap text in `~~double tildes~~`.

```
The price was ~~$99~~ now **$49**.
```

The price was ~~$99~~ now **$49**.

---

## Task Lists ✓ Renders here

Use `- [ ]` for unchecked and `- [x]` for checked items.

```
- [x] Design the schema
- [x] Write the migration
- [ ] Add validation
- [ ] Write tests
```

- [x] Design the schema
- [x] Write the migration
- [ ] Add validation
- [ ] Write tests

---

## Tables ✓ Renders here

Tables use `|` for column separators and `:` in the divider row for alignment.

```
| Syntax    | Description | Renders? |
|:----------|:-----------:|:--------:|
| **bold**  | Bold text   | ✓        |
| *italic*  | Italic text | ✓        |
| ~~strike~~| Strikethrough| ✓       |
| `code`    | Inline code | ✓        |
```

| Syntax    | Description  | Renders? |
|:----------|:------------:|:--------:|
| **bold**  | Bold text    | ✓        |
| *italic*  | Italic text  | ✓        |
| ~~strike~~| Strikethrough| ✓        |
| `code`    | Inline code  | ✓        |

---

## Autolinks ✓ Renders here

Angle-bracket autolinks turn a raw URL or email into a clickable link.

```
Visit <https://github.com> for source hosting.
Contact us at <hello@example.com>.
```

Visit <https://github.com> for source hosting.
Contact us at <hello@example.com>.

---

## Footnotes ✓ Renders here

Add `[^label]` inline, then define the footnote anywhere in the document. The renderer collects them at the bottom.

```
Markdown was created by John Gruber[^gruber] in 2004.

[^gruber]: John Gruber is a writer and web developer who created Markdown
           together with Aaron Swartz.
```

Markdown was created by John Gruber[^gruber] in 2004.

[^gruber]: John Gruber is a writer and web developer who created Markdown together with Aaron Swartz.

Multiple footnotes work independently:

```
The spec[^spec] describes the syntax. There are many implementations[^impl].

[^spec]: https://spec.commonmark.org
[^impl]: Including Pandoc, kramdown, and remark.
```

The spec[^spec] describes the syntax. There are many implementations[^impl].

[^spec]: https://spec.commonmark.org
[^impl]: Including Pandoc, kramdown, and remark.

---

## Alerts ✓ Renders here

GitHub-style alerts turn a blockquote into a colored callout when its first line is a `[!TYPE]` marker on its own. Five types are supported.

```
> [!NOTE]
> Useful information that users should know.

> [!TIP]
> Helpful advice for doing things better.

> [!IMPORTANT]
> Key information users need to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate attention.

> [!CAUTION]
> Advises about risks or negative outcomes.
```

> [!NOTE]
> Useful information that users should know.

> [!TIP]
> Helpful advice for doing things better.

> [!IMPORTANT]
> Key information users need to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate attention.

> [!CAUTION]
> Advises about risks or negative outcomes.

The marker must be alone on the first line — `> [!NOTE] text on the same line` stays a regular blockquote. Alerts share their styling with the `:::message` callouts described in [Zenn Syntax](/syntax/zenn-syntax).

---

## Highlight ✗ Requires plugin

The `==highlight==` syntax is **not** part of GFM. It requires a plugin such as `remark-mark-and-unmark`. Without it, the `==` delimiters are rendered as plain text.

```
==This text should be highlighted.==
```

With the plugin active it renders as a `<mark>` element (yellow background by default).

---

## Subscript and Superscript ✗ Requires plugin

`~sub~` and `^sup^` are not standard GFM. They need `remark-sub` / `remark-sup` or similar.

```
H~2~O        → H₂O
E = mc^2^    → E = mc²
```

Without the plugins the delimiters appear literally.

---

## Definition Lists ✗ Requires plugin

Definition lists use a term followed by `:` definitions. Not supported in GFM — requires `remark-definition-list` or Pandoc.

```
Markdown
:   A lightweight markup language.

HTML
:   The standard markup language for web pages.
```

---

## Heading IDs ✗ Renderer-dependent

Some renderers accept `{#custom-id}` after a heading to set an explicit `id` attribute for deep linking.

```
## Installation {#installation}
```

GFM renderers (like GitHub) auto-generate IDs from heading text. Explicit IDs are supported by Pandoc and some static site generators, but not by `remark-gfm` out of the box.

---

## Emoji Shortcodes ✗ Requires plugin

`:shortcode:` syntax is popular on GitHub but requires `remark-emoji` or similar to convert to actual emoji characters.

```
:rocket: :white_check_mark: :warning: :tada:
```

Without the plugin these render as literal text. You can always paste the emoji character directly instead: 🚀 ✅ ⚠️ 🎉

