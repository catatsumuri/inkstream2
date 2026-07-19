import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');

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
const { InkstreamMarkdown } = await import('../src/react/index.js');

async function render(markdown: string): Promise<HTMLElement> {
    const container = dom.window.document.createElement('div');
    dom.window.document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(createElement(InkstreamMarkdown, { children: markdown }));
    });

    return container;
}

/**
 * The highlighter loads through a dynamic import after mount, so highlighted
 * spans appear a few ticks after the initial render.
 */
async function waitFor(
    check: () => boolean,
    label: string,
    timeoutMs = 10_000,
): Promise<void> {
    const start = Date.now();

    while (!check()) {
        assert.ok(Date.now() - start < timeoutMs, `timed out waiting for ${label}`);

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 25));
        });
    }
}

test('fenced code renders an ink-code-block with shiki token spans', async () => {
    const container = await render(
        ['```js', 'const answer = 42;', '```'].join('\n'),
    );

    const block = container.querySelector('.ink-code-block');
    assert.ok(block, 'expected an .ink-code-block element');
    assert.equal(
        container.querySelectorAll('pre').length,
        1,
        'expected the CodeBlock pre to replace the default wrapper',
    );
    assert.ok(block.querySelector('.ink-code-tokens.language-js'));
    assert.ok(block.querySelector('[aria-label="Copy code"]'));
    assert.ok(block.querySelector('[aria-label="Enable line wrapping"]'));

    await waitFor(
        () =>
            container.querySelector('.ink-code-tokens span[style*="--shiki-light"]') !==
            null,
        'shiki token spans',
    );
});

test('lang:filename fences show a filename header', async () => {
    const container = await render(
        ['```php:index.php', 'echo "hi";', '```'].join('\n'),
    );

    const header = container.querySelector('.ink-code-header');
    assert.ok(header, 'expected an .ink-code-header element');
    assert.match(header.textContent ?? '', /index\.php/);
    assert.ok(container.querySelector('.ink-code-tokens.language-php'));
});

test('diff fences render classified rows with symbols', async () => {
    const container = await render(
        [
            '```diff js:app.js',
            '@@ -1,2 +1,2 @@',
            '-const a = 1;',
            '+const a = 2;',
            ' console.log(a);',
            '```',
        ].join('\n'),
    );

    const block = container.querySelector('.ink-code-block.ink-code-diff');
    assert.ok(block, 'expected an .ink-code-diff block');
    assert.match(
        block.querySelector('.ink-code-header')?.textContent ?? '',
        /app\.js/,
    );
    assert.equal(block.querySelectorAll('.ink-code-diff-row').length, 4);
    assert.equal(block.querySelectorAll('.ink-code-diff-hunk').length, 1);
    assert.equal(block.querySelectorAll('.ink-code-diff-add').length, 1);
    assert.equal(block.querySelectorAll('.ink-code-diff-remove').length, 1);
    assert.equal(
        block.querySelector('.ink-code-diff-add .ink-code-diff-symbol')
            ?.textContent,
        '+',
    );
});

test('an empty fenced code block renders no content instead of the literal "undefined"', async () => {
    const container = await render(['```js', '```'].join('\n'));

    const code = container.querySelector('.ink-code-tokens.language-js');
    assert.ok(code, 'expected an .ink-code-tokens.language-js element');
    assert.equal(code.textContent, '');
});

test('inline code stays a plain <code> element', async () => {
    const container = await render('Call `useState` to hold state.');

    const inline = container.querySelector('p > code');
    assert.ok(inline, 'expected inline code inside the paragraph');
    assert.equal(inline.className, '');
    assert.equal(container.querySelectorAll('.ink-code-block').length, 0);
});
