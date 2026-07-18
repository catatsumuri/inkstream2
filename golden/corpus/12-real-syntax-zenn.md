## Zenn Syntax

> Reference: https://zenn.dev/zenn/articles/markdown-guide

Zenn supports a few convenient image patterns on top of regular Markdown.

#### Basic Image

```md
![](/storage/namespaces/guide.png)
```

![](/storage/namespaces/guide.png)

#### Sized Image

Use `=250x` after the image URL to set the width in pixels.

```md
![](/storage/namespaces/guide.png =250x)
```

![](/storage/namespaces/guide.png =250x)

#### Alt Text

```md
![Guide cover](/storage/namespaces/guide.png =250x)
```

![Guide cover](/storage/namespaces/guide.png =250x)

#### Caption

Place italic text on the next line to display it like a caption.

```md
![](/storage/namespaces/guide.png =250x)
*Guide cover image*
```

![](/storage/namespaces/guide.png =250x)
*Guide cover image*

#### Linked Image

```md
[![](/storage/namespaces/guide.png =250x)](https://zenn.dev)
```

[![](/storage/namespaces/guide.png =250x)](https://zenn.dev)

#### Message

Wrap content in `:::message` to display an info callout.

```md
:::message
Your message here
:::
```

:::message
Your message here
:::

Use `:::message alert` for warnings.

```md
:::message alert
Your warning here
:::
```

:::message alert
Your warning here
:::

This system also supports extended variants as a non-standard extension. These are not part of the Zenn spec but work here.

```md
:::message note
Neutral note.
:::

:::message tip
Helpful tip.
:::

:::message check
Success or confirmation.
:::
```

:::message note
Neutral note.
:::

:::message tip
Helpful tip.
:::

:::message check
Success or confirmation.
:::

#### Details (Collapsible)

Wrap content in `:::details` followed by a title to create a collapsible block. The content is hidden until the reader clicks to expand it.

```md
:::details Click to expand
This content is hidden by default.
:::
```

:::details Click to expand
This content is hidden by default.
:::

Any block content can go inside — paragraphs, code, lists, and even other directives.

```md
:::details Show code example
Here is some hidden code:

```ts
function add(a: number, b: number): number {
    return a + b;
}
` ``

And a list:

- Item one
- Item two
:::
```

:::details Show code example
Here is some hidden code:

```ts
function add(a: number, b: number): number {
    return a + b;
}
```

And a list:

- Item one
- Item two
:::

To nest directives, use more colons on the outer block.

```md
::::details Details with a nested callout
:::message
This note is inside a collapsible section.
:::
::::
```

::::details Details with a nested callout
:::message
This note is inside a collapsible section.
:::
::::

#### Link Card

A URL placed alone on its own line is automatically displayed as a card.

```md
https://zenn.dev
```

https://zenn.dev

Use the `@[card](URL)` form for URLs that contain underscores.

```md
@[card](https://zenn.dev/zenn/articles/markdown-guide)
```

@[card](https://zenn.dev/zenn/articles/markdown-guide)

YouTube URLs are automatically embedded as a video player.

```md
https://www.youtube.com/watch?v=WRVsOCh907o
```

https://www.youtube.com/watch?v=WRVsOCh907o

#### Code Block with Filename

Add `:filename` after the language name to display a filename label above the code block.

Use `` ```php:index.php `` to attach a filename:

```php:index.php
<?php

echo 'Hello, world!';
```

Use `` ```ts:src/utils.ts `` to attach a path:

```ts:src/utils.ts
export function greet(name: string): string {
    return `Hello, ${name}!`;
}
```

#### Diff Highlighting

Start the fence with `diff` followed by the language name to enable diff highlighting. Lines beginning with `+` are shown in green and lines beginning with `-` in red.

Use `` ```diff js `` for diff highlighting:

```diff js
@@ -4,6 +4,5 @@
+    const foo = bar.baz([1, 2, 3]) + 1;
-    let foo = bar.baz([1, 2, 3]);
     return foo;
```

You can combine `diff` with a filename using `` ```diff ts:src/utils.ts ``:

```diff ts:src/utils.ts
@@ -1,5 +1,5 @@
-export function greet(name: string) {
+export function greet(name: string): string {
     return `Hello, ${name}!`;
 }
```

#### GitHub Embed

A GitHub file URL placed alone on its own line is automatically embedded as a code block.

```md
https://github.com/zenn-dev/zenn-editor/blob/canary/lerna.json
```

https://github.com/zenn-dev/zenn-editor/blob/canary/lerna.json

Use a line range with `#L{start}-L{end}` to show a specific section.

```md
https://github.com/zenn-dev/zenn-editor/blob/canary/lerna.json#L1-L3
```

https://github.com/zenn-dev/zenn-editor/blob/canary/lerna.json#L1-L3

The `@[github](URL)` form also works.

```md
@[github](https://github.com/zenn-dev/zenn-editor/blob/canary/lerna.json)
```

@[github](https://github.com/zenn-dev/zenn-editor/blob/canary/lerna.json)
