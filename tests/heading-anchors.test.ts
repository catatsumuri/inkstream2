import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://example.com/docs/1',
});

Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    customElements: dom.window.customElements,
});
Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
});
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { act } = await import('react');
const { createElement } = await import('react');
const { createRoot } = await import('react-dom/client');
const { extractMarkdownHeadings } = await import('../src/index.js');
const { InkstreamMarkdown } = await import('../src/react/index.js');

async function render(
    markdown: string,
    headingIdPrefix?: string,
): Promise<HTMLElement> {
    const container = dom.window.document.createElement('div');
    dom.window.document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(
            createElement(InkstreamMarkdown, {
                children: markdown,
                headingIdPrefix,
            }),
        );
    });

    return container;
}

const guideMarkdown = [
    '## Mermaid 図',
    'Intro paragraph.',
    '#### フローチャート',
    'Body.',
    '## Setup',
    '## Setup',
    '```',
    '## Inside a fence',
    '```',
].join('\n\n');

test('rendered heading ids match extractMarkdownHeadings for the same source', async () => {
    const container = await render(guideMarkdown);

    const renderedIds = [...container.querySelectorAll('h1, h2, h3, h4')].map(
        (heading) => heading.id,
    );
    const extractedIds = extractMarkdownHeadings(guideMarkdown).map(
        (heading) => heading.id,
    );

    assert.deepEqual(renderedIds, extractedIds);
    assert.deepEqual(renderedIds, [
        'mermaid-図',
        'フローチャート',
        'setup',
        'setup-2',
    ]);
});

test('headings carry a copy-link anchor pointing at their own id', async () => {
    const container = await render('## Getting Started');

    const heading = container.querySelector('h2.ink-heading');
    assert.ok(heading, 'expected an .ink-heading h2');
    assert.equal(heading.id, 'getting-started');

    const anchor = heading.querySelector('a.ink-heading-anchor');
    assert.ok(anchor, 'expected an .ink-heading-anchor link');
    assert.equal(anchor.getAttribute('href'), '#getting-started');
    assert.equal(
        anchor.getAttribute('aria-label'),
        'Copy link to Getting Started',
    );
});

test('headingIdPrefix flows into both renderer and extractor identically', async () => {
    const container = await render('## Setup', 'guide');

    assert.equal(container.querySelector('h2')?.id, 'guide-setup');
    assert.equal(
        extractMarkdownHeadings('## Setup', 'guide')[0].id,
        'guide-setup',
    );
});
