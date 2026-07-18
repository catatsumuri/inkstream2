## Thinkstream Syntax

Thinkstream includes a few authoring shortcuts on top of standard Markdown, Zenn syntax, and the supported Mintlify components. This page documents the Thinkstream-specific additions.

---

## Quiz Fence

Thinkstream supports a lightweight `quiz` fenced code block for single-question multiple-choice prompts.

Live example:

```quiz
question: How does Next.js optimize fonts?
correct: D

A: It causes additional network requests which improve performance.
B: It disables all custom fonts.
C: It preloads all fonts at runtime.
D: It hosts font files with other static assets so that there are no additional network requests.

hint: Additional requests can impact performance.
incorrect: Not Quite
correctMessage: Correct
explanation: Next.js can self-host optimized font assets so the browser avoids extra third-party font requests.
```

Source:

````md
```quiz
question: How does Next.js optimize fonts?
correct: D

A: It causes additional network requests which improve performance.
B: It disables all custom fonts.
C: It preloads all fonts at runtime.
D: It hosts font files with other static assets so that there are no additional network requests.

hint: Additional requests can impact performance.
incorrect: Not Quite
correctMessage: Correct
explanation: Next.js can self-host optimized font assets so the browser avoids extra third-party font requests.
```
````

Notes:

- `question:` defines the prompt shown above the answers.
- `correct:` points to the correct choice using `A`, `B`, `C`, or `D`.
- Choices use `A:` style labels so the block stays easy to type in plain Markdown.
- `hint:` and `incorrect:` can drive the retry state shown after a wrong answer.
- `correctMessage:` and `explanation:` customize the successful result state.

---

## Tree Fence

Use a `tree` fenced code block when you want to paste a file tree directly from your terminal. Thinkstream converts it into the interactive tree renderer automatically.

Live example:

```tree
app/Ai
└── Agents
    ├── CoverImagePromptAgent.php
    ├── MarkdownStructureAgent.php
    ├── ThinkstreamStructureAgent.php
    ├── ThinkstreamTitleAgent.php
    └── TranslateSelectionAgent.php
```

Source:

````md
```tree
app/Ai
└── Agents
    ├── CoverImagePromptAgent.php
    ├── MarkdownStructureAgent.php
    ├── ThinkstreamStructureAgent.php
    ├── ThinkstreamTitleAgent.php
    └── TranslateSelectionAgent.php
```
````

Notes:

- `app/Ai` is split into nested folders.
- Child rows using `├──` and `└──` become files or folders automatically.
- Folders are expanded by default so pasted trees are readable immediately.

---

## Shared Indentation

Indented tree blocks are also supported, which is useful when the snippet itself is nested inside a list item or blockquote in your source file.

Live example:

```tree
  resources/js
  └── components
      ├── markdown-content.tsx
      ├── markdown-tree.tsx
      └── markdown-update.tsx
```

Source:

````md
```tree
  resources/js
  └── components
      ├── markdown-content.tsx
      ├── markdown-tree.tsx
      └── markdown-update.tsx
```
````

---

## Folder Hints

Add a trailing slash when you want to make a folder explicit even before children are listed.

Live example:

```tree
app/
└── Services/
    └── SyncFileParser.php
```

Source:

````md
```tree
app/
└── Services/
    └── SyncFileParser.php
```
````

---

## Ignored Summary Lines

Output copied from the `tree` command often includes summary lines at the bottom. Thinkstream ignores them automatically.

Live example:

```tree
.
├── app
│   └── Services
│       └── SyncFileParser.php
└── tests
    └── Feature
        └── SyntaxSeederTest.php

4 directories, 2 files
```

Source:

````md
```tree
.
├── app
│   └── Services
│       └── SyncFileParser.php
└── tests
    └── Feature
        └── SyntaxSeederTest.php

4 directories, 2 files
```
````

---

## Charts

Use `chart:bar` for a horizontal bar chart and `chart:radar` for a radar chart. Both use the same key-value format.

### Bar Chart

Live example:

```chart:bar
_title: Flavor Profile
_max: 10
juniper: 9
citrus: 4
spice: 6
herbal: 5
floral: 2
sweetness: 2
smoothness: 5
```

Source:

````md
```chart:bar
_title: Flavor Profile
_max: 10
juniper: 9
citrus: 4
spice: 6
herbal: 5
floral: 2
sweetness: 2
smoothness: 5
```
````

### Radar Chart

Live example:

```chart:radar
_title: Flavor Profile
_max: 10
juniper: 9
citrus: 4
spice: 6
herbal: 5
floral: 2
sweetness: 2
smoothness: 5
```

Source:

````md
```chart:radar
_title: Flavor Profile
_max: 10
juniper: 9
citrus: 4
spice: 6
herbal: 5
floral: 2
sweetness: 2
smoothness: 5
```
````

Reserved keys (prefixed with `_`): `_title`, `_max`, `_min`. All other `label: value` lines are data points.

---

## Wikilinks

Wikilinks are a Thinkstream-specific syntax for linking to other posts by their `full_path`. Unlike standard Markdown links, they are path-independent and can be detected programmatically (e.g. to find broken links after a rename).

#### Basic Wikilink

Use `[[full_path]]` to link to a post. The display text defaults to the last segment of the path.

[[syntax/wikilinks]]

Source:

```md
[[syntax/wikilinks]]
```

#### Wikilink with Label

Use `[[full_path|label]]` to set custom display text.

[[syntax/wikilinks|this page]]

Source:

```md
[[syntax/wikilinks|this page]]
```

Notes:

- `full_path` is the namespace path plus slug, e.g. `blog/my-post`.
- Wikilinks always resolve to `/{full_path}` on the public site.
- Existing `[label](/path)` Markdown links continue to work alongside wikilinks.
