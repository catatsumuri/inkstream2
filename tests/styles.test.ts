import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(
    new URL('../src/react/styles.css', import.meta.url),
    'utf8',
);

test('wraps every rule in the inkstream cascade layer', () => {
    assert.match(css, /^@layer inkstream \{/m);
    assert.equal(
        (css.match(/\{/g) ?? []).length,
        (css.match(/\}/g) ?? []).length,
        'expected balanced braces',
    );
});

test('exposes the documented --ink-* theme bridge variables with fallbacks', () => {
    const expected: Record<string, string> = {
        '--ink-border': '#e4e4e7',
        '--ink-foreground': '#18181b',
        '--ink-muted': '#f4f4f5',
        '--ink-muted-foreground': '#71717a',
        '--ink-primary': '#18181b',
        '--ink-primary-foreground': '#fafafa',
        '--ink-accent': '#f4f4f5',
        '--ink-card': '#ffffff',
    };

    for (const [name, fallback] of Object.entries(expected)) {
        assert.match(
            css,
            new RegExp(`var\\(${name}, ${fallback}\\)`),
            `expected a var(${name}, ${fallback}) reference`,
        );
    }
});

test('follows the .dark class convention used by useIsDarkMode', () => {
    assert.match(css, /\.dark \.ink-code-tokens span \{/);
    assert.match(css, /\.ink-code-block:is\(\.dark \*\) \{/);
});

test('styles every ink-* class the default components render', () => {
    const classNames = [
        'ink-markdown',
        'ink-heading',
        'ink-callout',
        'ink-card',
        'ink-steps',
        'ink-tabs',
        'ink-accordion-group',
        'ink-badge',
        'ink-tooltip',
        'ink-image',
        'ink-update',
        'ink-code-group',
        'ink-api-field',
        'ink-tree',
        'ink-quiz',
        'ink-code-block',
        'ink-mermaid',
        'ink-chart',
        'ink-wikilink-broken',
        'ink-link-card',
        'ink-youtube',
        'ink-github-embed',
    ];

    for (const className of classNames) {
        assert.match(
            css,
            new RegExp(`\\.${className}[\\s{.:]`),
            `expected a rule targeting .${className}`,
        );
    }
});
