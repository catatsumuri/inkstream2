## What is Markdown?

Markdown is a lightweight markup language for formatting plain text. You use simple symbols like `#`, `*`, and `-` to define structure, and it converts to HTML for display. The goal is to keep source text readable as-is, even before rendering.

---

## Headings

Use `#` symbols to define heading levels. The number of `#` characters sets the level.

```
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
```

The above renders as:

#### Heading 3
##### Heading 4

> Heading 1 is typically reserved for the page title and used only once per document.

---

## Paragraphs and Line Breaks

#### Paragraphs

Separate paragraphs with a **blank line**. A single newline without a blank line does not create a new paragraph — the lines are joined.

```
This is the first paragraph.

This is the second paragraph.
```

This is the first paragraph.

This is the second paragraph.

#### Line Breaks

To force a line break **within** a paragraph (without starting a new paragraph), end the line with **two or more spaces** before pressing Enter.

```
Line one
Line two (same paragraph, new line)
```

Line one
Line two (same paragraph, new line)

---

## Text Formatting

#### Bold

```
**This text is bold.**
__This also works.__
```

**This text is bold.**
__This also works.__

#### Italic

```
*This text is italic.*
_This also works._
```

*This text is italic.*
_This also works._

#### Bold and Italic

```
***This text is bold and italic.***
```

***This text is bold and italic.***

#### Strikethrough

```
~~This text is crossed out.~~
```

~~This text is crossed out.~~

#### Inline Code

Wrap code in single backticks to render it as monospace inline code. Useful for referencing variable names, commands, or short snippets.

```
Use `npm install` to install dependencies.
The `<div>` element is a block-level container.
Set `DEBUG=true` in your environment.
```

Use `npm install` to install dependencies.
The `<div>` element is a block-level container.
Set `DEBUG=true` in your environment.

---

## Lists

#### Unordered Lists

Use `-`, `*`, or `+` to create bullet points. They are interchangeable.

```
- Apples
- Oranges
- Bananas
```

- Apples
- Oranges
- Bananas

#### Nested Lists

Indent with two or four spaces to create sub-items.

```
- Fruits
  - Apples
  - Oranges
    - Navel
    - Blood
- Vegetables
  - Carrots
  - Spinach
```

- Fruits
  - Apples
  - Oranges
    - Navel
    - Blood
- Vegetables
  - Carrots
  - Spinach

#### Ordered Lists

```
1. First step
2. Second step
3. Third step
```

1. First step
2. Second step
3. Third step

> The actual numbers don't matter — Markdown will renumber them in order. You can use `1.` for every item and it still renders correctly.

#### Task Lists

Use `- [ ]` for an unchecked box and `- [x]` for a checked box.

```
- [x] Write the first draft
- [x] Add code examples
- [ ] Proofread
- [ ] Publish
```

- [x] Write the first draft
- [x] Add code examples
- [ ] Proofread
- [ ] Publish

---

## Code Blocks

#### Fenced Code Blocks

Wrap code in triple backticks. Optionally add a language identifier after the opening fence for syntax highlighting.

Plain block — no language identifier:

````
```
Plain code block, no highlighting
```
````

```
Plain code block, no highlighting
```

JavaScript — add `javascript` after the opening fence:

````
```javascript
const greet = (name) => `Hello, ${name}!`;
console.log(greet('World'));
```
````

```javascript
const greet = (name) => `Hello, ${name}!`;
console.log(greet('World'));
```

PHP:

````
```php
<?php

function greet(string $name): string
{
    return "Hello, {$name}!";
}

echo greet('World');
```
````

```php
<?php

function greet(string $name): string
{
    return "Hello, {$name}!";
}

echo greet('World');
```

Bash:

````
```bash
# Install dependencies
npm install react-markdown

# Start the dev server
npm run dev
```
````

```bash
# Install dependencies
npm install react-markdown

# Start the dev server
npm run dev
```

JSON:

````
```json
{
  "name": "thinkstream",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0"
  }
}
```
````

```json
{
  "name": "thinkstream",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0"
  }
}
```

#### Long Lines

Long lines scroll horizontally rather than wrapping, so the code block never distorts your layout.

```sql
SELECT users.id, users.name, orders.id AS order_id, orders.total, orders.status FROM users INNER JOIN orders ON orders.user_id = users.id WHERE orders.status IN ('pending', 'processing') ORDER BY orders.created_at DESC;
```

---

## Links

#### Inline Links

The basic form is `[visible text](URL)`.

```
[Visit the Markdown Guide](https://www.markdownguide.org)
```

[Visit the Markdown Guide](https://www.markdownguide.org)

#### Links with Titles

Add a quoted title after the URL. It appears as a tooltip on hover.

```
[Markdown Guide](https://www.markdownguide.org "The best Markdown reference")
```

[Markdown Guide](https://www.markdownguide.org "The best Markdown reference")

#### Bare URLs

Wrap a URL in angle brackets to turn it into a clickable link without custom text.

```
<https://www.example.com>
<hello@example.com>
```

<https://www.example.com>
<hello@example.com>

#### Reference-Style Links

Define the URL separately and reference it by label. Useful for keeping long URLs out of the prose.

```
Check out [GitHub][gh] and [MDN][mdn] for documentation.

[gh]: https://github.com
[mdn]: https://developer.mozilla.org
```

Check out [GitHub][gh] and [MDN][mdn] for documentation.

[gh]: https://github.com
[mdn]: https://developer.mozilla.org

---

## Blockquotes

Use `>` to create a blockquote. Add multiple `>` characters for nested quotes.

```
> This is a blockquote.
> It can span multiple lines.
>
> A blank `>` line creates a paragraph break inside the quote.
>
> > This is a nested blockquote.
```

> This is a blockquote.
> It can span multiple lines.
>
> A blank `>` line creates a paragraph break inside the quote.
>
> > This is a nested blockquote.

Blockquotes can contain other Markdown elements:

```
> **Note:** This is an important callout.
> Use `code` or *emphasis* freely inside quotes.
```

> **Note:** This is an important callout.
> Use `code` or *emphasis* freely inside quotes.

---

## Tables

Use `|` to separate columns and `-` for the header separator row.

```
| Name       | Role      | Active |
|------------|-----------|--------|
| Alice      | Admin     | Yes    |
| Bob        | Editor    | No     |
| Carol      | Viewer    | Yes    |
```

| Name       | Role      | Active |
|------------|-----------|--------|
| Alice      | Admin     | Yes    |
| Bob        | Editor    | No     |
| Carol      | Viewer    | Yes    |

#### Column Alignment

Add `:` to the separator row to control alignment per column.

```
| Left       | Center     | Right  |
|:-----------|:----------:|-------:|
| Apple      | Banana     | Cherry |
| 1          | 2          | 3      |
```

| Left       | Center     | Right  |
|:-----------|:----------:|-------:|
| Apple      | Banana     | Cherry |
| 1          | 2          | 3      |

