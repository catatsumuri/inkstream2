import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeInkstreamMarkdown } from '../src/normalize-inkstream-markdown.js';

test('normalizeInkstreamMarkdown applies all three normalizers', () => {
    const markdown = [
        '<Note>',
        'body',
        '</Note>',
        '',
        ':::message alert',
        'warning',
        ':::',
        '',
        '![diagram](/img/a.png =250x)',
    ].join('\n');

    const normalized = normalizeInkstreamMarkdown(markdown);

    assert.match(normalized, /<Note>\n\nbody\n\n<\/Note>/);
    assert.match(normalized, /:::message\{\.alert\}/);
    assert.match(normalized, /__markdown_width=250/);
});

test('normalizeInkstreamMarkdown leaves fenced code untouched', () => {
    const markdown = ['```', ':::message', 'body', ':::', '```'].join('\n');

    assert.equal(normalizeInkstreamMarkdown(markdown), markdown);
});
