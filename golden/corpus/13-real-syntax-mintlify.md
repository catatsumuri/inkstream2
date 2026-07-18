## Mintlify Syntax

> References:
> - https://starter.mintlify.com/essentials/markdown
> - https://mintlify.wiki/motleyai/docs/essentials/markdown
> - https://www.mintlify.com/docs/components/index

Mintlify ships with MDX-flavored components for docs sites. This page covers the components supported by the ThinkStream Markdown pipeline.

---

## Callouts

Mintlify provides five callout types. Each maps to a Zenn-style `:::message` directive internally.

<Note>
  This is a note callout. Use it for neutral information.
</Note>

<Tip>
  This is a tip callout. Use it for helpful advice.
</Tip>

<Info>
  This is an info callout. Use it for additional context.
</Info>

<Warning>
  This is a warning callout. Use it for cautionary information.
</Warning>

<Check>
  This is a check callout. Use it for success states or confirmations.
</Check>

Source:

```mdx
<Note>
  This is a note callout. Use it for neutral information.
</Note>

<Tip>
  This is a tip callout. Use it for helpful advice.
</Tip>

<Info>
  This is an info callout. Use it for additional context.
</Info>

<Warning>
  This is a warning callout. Use it for cautionary information.
</Warning>

<Check>
  This is a check callout. Use it for success states or confirmations.
</Check>
```

You can also use the underlying Zenn-style directive syntax directly:

```md
:::message note
Note content here.
:::

:::message tip
Tip content here.
:::

:::message
Info content here.
:::

:::message alert
Warning content here.
:::

:::message check
Check content here.
:::
```

---

## Cards

Mintlify uses `<Card>` blocks to create linked navigation tiles.

Live example:

<Card title="Tabs" icon="folder" href="/syntax/index">
  Organize related content into a switchable tab UI.
</Card>

<Card title="Callouts" icon="message-square-warning" href="/syntax/zenn-syntax">
  Highlight important information with styled alerts.
</Card>

Source:

```mdx
<Card title="Tabs" icon="folder" href="/syntax/index">
  Organize related content into a switchable tab UI.
</Card>
```

---

## Card Groups

Cards are often grouped to create documentation indexes.

Live example:

<CardGroup cols={2}>
  <Card title="Tabs" icon="folder" href="/syntax/index">
    Organize related content into a switchable tab UI.
  </Card>
  <Card title="Steps" icon="list-ordered" href="/syntax/zenn-syntax">
    Sequential steps guide the reader through a process.
  </Card>
  <Card title="Callouts" icon="message-square-warning" href="/syntax/extended-syntax">
    Highlight important information with styled alerts.
  </Card>
  <Card title="Code Blocks" icon="code" href="/syntax/index">
    Display syntax-highlighted code with optional filenames.
  </Card>
</CardGroup>

Self-closing cards (no body text):

<CardGroup cols={3}>
  <Card title="npm" icon="download" href="/syntax/index" />
  <Card title="yarn" icon="zap" href="/syntax/index" />
  <Card title="pnpm" icon="rocket" href="/syntax/index" />
</CardGroup>

Source:

```mdx
<CardGroup cols={2}>
  <Card title="Tabs" icon="folder" href="/syntax/index">
    Organize related content into a switchable tab UI.
  </Card>
  <Card title="Steps" icon="list-ordered" href="/syntax/zenn-syntax">
    Sequential steps guide the reader through a process.
  </Card>
</CardGroup>
```

Rendered result for the same source:

<CardGroup cols={2}>
  <Card title="Tabs" icon="folder" href="/syntax/index">
    Organize related content into a switchable tab UI.
  </Card>
  <Card title="Steps" icon="list-ordered" href="/syntax/zenn-syntax">
    Sequential steps guide the reader through a process.
  </Card>
</CardGroup>

---

## Tabs

Mintlify commonly uses `<Tabs>` and `<Tab>` to switch between examples.

Live example:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install
    ```
  </Tab>
  <Tab title="yarn">
    ```bash
    yarn install
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm install
    ```
  </Tab>
</Tabs>

Source example:

````mdx
<Tabs>
  <Tab title="npm">
    ```bash
    npm install
    ```
  </Tab>
  <Tab title="yarn">
    ```bash
    yarn install
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm install
    ```
  </Tab>
</Tabs>
````

Possible fallback if tabs are unsupported: split content into headings such as `### npm` and `### pnpm`.

---

## Accordions

Accordion components create collapsible sections. The `title` attribute sets the visible label. An optional `icon` attribute is accepted but ignored by this renderer.

Live examples:

<Accordion title="What is Mintlify?">
  Mintlify is a documentation platform that helps you create beautiful, performant documentation sites.
</Accordion>

<Accordion title="How do I get started?" icon="rocket">
  Follow our [quickstart guide](/quickstart) to set up your documentation site in minutes.
</Accordion>

Source:

```mdx
<Accordion title="What is Mintlify?">
  Mintlify is a documentation platform that helps you create beautiful, performant documentation sites.
</Accordion>

<Accordion title="How do I get started?" icon="rocket">
  Follow our [quickstart guide](/quickstart) to set up your documentation site in minutes.
</Accordion>
```

You can also use the underlying Zenn `:::details` syntax directly:

```md
:::details What is Mintlify?
Mintlify is a documentation platform.
:::
```

### AccordionGroup

Use `<AccordionGroup>` to wrap multiple `<Accordion>` items into a single visually connected block.

Live example:

<AccordionGroup>
  <Accordion title="What is ThinkStream?">
    ThinkStream is a documentation platform built on Laravel and React.
  </Accordion>
  <Accordion title="Which syntax is supported?">
    ThinkStream supports Markdown, GFM, Zenn syntax, and Mintlify MDX components.
  </Accordion>
  <Accordion title="Can I use custom icons?">
    The `icon` attribute is accepted but currently ignored by this renderer.
  </Accordion>
</AccordionGroup>

Source:

```mdx
<AccordionGroup>
  <Accordion title="What is ThinkStream?">
    ThinkStream is a documentation platform built on Laravel and React.
  </Accordion>
  <Accordion title="Which syntax is supported?">
    ThinkStream supports Markdown, GFM, Zenn syntax, and Mintlify MDX components.
  </Accordion>
</AccordionGroup>
```

> Note: nesting other container components (e.g. `<Steps>`) inside an `<Accordion>` within an `<AccordionGroup>` is not yet supported and will render incorrectly.

---

## Steps

Step-based walkthroughs use `<Steps>` and `<Step title="...">` to produce a numbered sequential guide.

Live example:

<Steps>
  <Step title="Create a file">
    Create a new MDX file in your docs directory.
  </Step>
  <Step title="Add frontmatter">
    Add YAML frontmatter with `title` and `description`.
  </Step>
  <Step title="Write content">
    Write your documentation using MDX syntax.
  </Step>
  <Step title="Preview">
    Run `mint dev` to preview your changes.
  </Step>
</Steps>

Source:

```mdx
<Steps>
  <Step title="Create a file">
    Create a new MDX file in your docs directory.
  </Step>
  <Step title="Add frontmatter">
    Add YAML frontmatter with `title` and `description`.
  </Step>
  <Step title="Write content">
    Write your documentation using MDX syntax.
  </Step>
  <Step title="Preview">
    Run `mint dev` to preview your changes.
  </Step>
</Steps>
```

---

## Badge

Use `<Badge>` to display status indicators, labels, and metadata inline within prose or as standalone elements.

Live examples:

<Badge>Badge</Badge>
<Badge color="blue">New</Badge>
<Badge color="green" icon="circle-check">Stable</Badge>
<Badge stroke color="orange">Beta</Badge>
<Badge disabled icon="lock" color="gray">Locked</Badge>

Inline usage:

This feature requires a <Badge color="orange" size="sm">Premium</Badge> subscription, and this endpoint returns <Badge color="blue" shape="pill">JSON</Badge> format.

Source:

```mdx
<Badge>Badge</Badge>
<Badge color="blue">New</Badge>
<Badge color="green" icon="circle-check">Stable</Badge>
<Badge stroke color="orange">Beta</Badge>
<Badge disabled icon="lock" color="gray">Locked</Badge>

This feature requires a <Badge color="orange" size="sm">Premium</Badge> subscription.
```

---

## API Fields

#### ResponseField

Use `<ResponseField>` to describe the fields of an API response. Supports `name`, `type`, `required`, `default`, and `deprecated`.

Live example:

<ResponseField name="id" type="string" required>
  Unique identifier for the resource.
</ResponseField>

<ResponseField name="title" type="string" required>
  The post title.
</ResponseField>

<ResponseField name="published_at" type="string | null">
  ISO 8601 timestamp, or `null` if the post is unpublished.
</ResponseField>

<ResponseField name="slug" type="string" required deprecated>
  URL slug. Use `handle` instead.
</ResponseField>

Source:

```mdx
<ResponseField name="id" type="string" required>
  Unique identifier for the resource.
</ResponseField>

<ResponseField name="published_at" type="string | null">
  ISO 8601 timestamp, or `null` if the post is unpublished.
</ResponseField>

<ResponseField name="slug" type="string" required deprecated>
  URL slug. Use `handle` instead.
</ResponseField>
```

#### ParamField

Use `<ParamField>` to describe request parameters. The attribute key (`path`, `query`, or `body`) indicates where the parameter appears, and its value is the parameter name.

Live example:

<ParamField path="slug" type="string" required>
  Slug used to resolve the page.
</ParamField>

<ParamField query="include" type="string">
  Comma-separated list of relations to include in the response.
</ParamField>

<ParamField body="title" type="string" required>
  The post title.
</ParamField>

Source:

```mdx
<ParamField path="slug" type="string" required>
  Slug used to resolve the page.
</ParamField>

<ParamField query="include" type="string">
  Comma-separated list of relations to include in the response.
</ParamField>

<ParamField body="title" type="string" required>
  The post title.
</ParamField>
```

---

## CodeGroup

`<CodeGroup>` displays multiple code blocks as a tabbed interface. The tab title comes from the meta string after the language identifier. Add `icon="..."` to the meta string when you want an icon in the tab label. Selecting a tab persists the choice across all CodeGroup instances on the page.

Live example:

<CodeGroup>

```javascript JavaScript icon="javascript"
const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice', email: 'alice@example.com' }),
});
const data = await response.json();
```

```python Python icon="python"
import requests

response = requests.post(
    'https://api.example.com/users',
    json={'name': 'Alice', 'email': 'alice@example.com'},
)
data = response.json()
```

```php PHP icon="php"
$response = Http::post('https://api.example.com/users', [
    'name' => 'Alice',
    'email' => 'alice@example.com',
]);
$data = $response->json();
```

</CodeGroup>

A second CodeGroup syncs with the first — selecting Python above will also activate Python here:

<CodeGroup>

```javascript JavaScript icon="javascript"
console.log('Hello from JavaScript');
```

```python Python icon="python"
print('Hello from Python')
```

```php PHP icon="php"
echo 'Hello from PHP';
```

</CodeGroup>

Source:

````mdx
<CodeGroup>

```javascript JavaScript icon="javascript"
const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice', email: 'alice@example.com' }),
});
const data = await response.json();
```

```python Python icon="python"
import requests

response = requests.post(
    'https://api.example.com/users',
    json={'name': 'Alice', 'email': 'alice@example.com'},
)
data = response.json()
```

```php PHP icon="php"
$response = Http::post('https://api.example.com/users', [
    'name' => 'Alice',
    'email' => 'alice@example.com',
]);
$data = $response->json();
```

</CodeGroup>
````

---

## Tooltip

`<Tooltip>` wraps inline text and shows a popover on hover. Use `tip` for the tooltip body, `headline` for a bold title, and `cta` + `href` for an optional call-to-action link.

Live example:

Hover over <Tooltip tip="Application Programming Interface: a set of protocols that lets software components communicate." headline="API" cta="Read more" href="/syntax/index">API</Tooltip> for a definition.

Simple tooltip: hover over <Tooltip tip="Hypertext Markup Language — the standard language for web pages.">HTML</Tooltip>.

Source:

```mdx
Hover over <Tooltip tip="Application Programming Interface: a set of protocols that lets software components communicate." headline="API" cta="Read more" href="/syntax/index">API</Tooltip> for a definition.

Simple tooltip: hover over <Tooltip tip="Hypertext Markup Language — the standard language for web pages.">HTML</Tooltip>.
```

---

## Tree

`<Tree>` displays a file-system hierarchy with collapsible folders. Use `<Tree.Folder>` for directories and `<Tree.File>` for files. Add `defaultOpen` to a folder to expand it on load.

Live example:

<Tree>
  <Tree.Folder name="app" defaultOpen>
    <Tree.Folder name="components" defaultOpen>
      <Tree.File name="Button.tsx" />
      <Tree.File name="Card.tsx" />
    </Tree.Folder>
    <Tree.Folder name="pages">
      <Tree.File name="index.tsx" />
      <Tree.File name="about.tsx" />
    </Tree.Folder>
    <Tree.File name="layout.tsx" />
  </Tree.Folder>
  <Tree.Folder name="public">
    <Tree.File name="favicon.ico" />
  </Tree.Folder>
  <Tree.File name="package.json" />
  <Tree.File name="tsconfig.json" />
</Tree>

Source:

```mdx
<Tree>
  <Tree.Folder name="app" defaultOpen>
    <Tree.Folder name="components" defaultOpen>
      <Tree.File name="Button.tsx" />
      <Tree.File name="Card.tsx" />
    </Tree.Folder>
    <Tree.Folder name="pages">
      <Tree.File name="index.tsx" />
      <Tree.File name="about.tsx" />
    </Tree.Folder>
    <Tree.File name="layout.tsx" />
  </Tree.Folder>
  <Tree.Folder name="public">
    <Tree.File name="favicon.ico" />
  </Tree.Folder>
  <Tree.File name="package.json" />
  <Tree.File name="tsconfig.json" />
</Tree>
```

---

## Update

`<Update>` displays a changelog entry in a timeline layout. Use `label` for the date or version (it also becomes an anchor link), `description` for a subtitle, and `tags` for filter labels.

Live example:

<Update label="2024-10-11" description="v0.2.0" tags={["Feature", "Improvement"]}>

#### Improved card icon support

Cards now support brand icons from the `simple-icons` library in addition to Lucide icons. Pass any brand name as the `icon` prop on `<Card>`.

</Update>

<Update label="2024-09-01" description="v0.1.0" tags={["Initial release"]}>

#### First release

Initial launch of Thinkstream with support for Markdown, GFM, Zenn syntax, and core Mintlify components including callouts, cards, tabs, steps, and code groups.

</Update>

Source:

```mdx
<Update label="2024-10-11" description="v0.2.0" tags={["Feature", "Improvement"]}>

### Improved card icon support

Cards now support brand icons from the `simple-icons` library in addition to Lucide icons. Pass any brand name as the `icon` prop on `<Card>`.

</Update>

<Update label="2024-09-01" description="v0.1.0" tags={["Initial release"]}>

### First release

Initial launch of Thinkstream with support for Markdown, GFM, Zenn syntax, and core Mintlify components including callouts, cards, tabs, steps, and code groups.

</Update>
```
