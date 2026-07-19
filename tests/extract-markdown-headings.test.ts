import assert from 'node:assert/strict';
import test from 'node:test';
import { extractMarkdownHeadings, slugify } from '../src/index.js';

test('slugify keeps unicode letters and collapses separators', () => {
    assert.equal(slugify('Mermaid 図'), 'mermaid-図');
    assert.equal(slugify('  Hello,  World!  '), 'hello-world');
    assert.equal(slugify('foo_bar --- baz'), 'foo-bar-baz');
});

test('extracts h1 through h4 with slug ids', () => {
    const headings = extractMarkdownHeadings(
        ['# Title', '## Section', '### Sub', '#### Detail', '##### Deep'].join(
            '\n\n',
        ),
    );

    assert.deepEqual(headings, [
        { level: 1, text: 'Title', id: 'title' },
        { level: 2, text: 'Section', id: 'section' },
        { level: 3, text: 'Sub', id: 'sub' },
        { level: 4, text: 'Detail', id: 'detail' },
    ]);
});

test('skips headings inside fenced code blocks, including nested fences', () => {
    const headings = extractMarkdownHeadings(
        [
            '## Real',
            '````',
            '```markdown',
            '## Inside example',
            '```',
            '````',
            '```',
            '## Inside plain fence',
            '```',
            '## Also Real',
        ].join('\n'),
    );

    assert.deepEqual(
        headings.map((heading) => heading.text),
        ['Real', 'Also Real'],
    );
});

test('numbers duplicate headings and applies the prefix', () => {
    const headings = extractMarkdownHeadings(
        ['## Setup', '## Setup', '## Setup'].join('\n\n'),
        'guide',
    );

    assert.deepEqual(
        headings.map((heading) => heading.id),
        ['guide-setup', 'guide-setup-2', 'guide-setup-3'],
    );
});

test('strips links and images from heading text', () => {
    const headings = extractMarkdownHeadings(
        '## See [the docs](https://example.com) and ![alt text](img.png)',
    );

    assert.equal(headings[0].text, 'See the docs and alt text');
});

test('resolves wikilinks in heading text the same way remarkWikilinks renders them', () => {
    const headings = extractMarkdownHeadings(
        ['# See [[known]]', '## And [[ns/known|Custom Label]] too'].join(
            '\n\n',
        ),
    );

    assert.deepEqual(
        headings.map((heading) => ({ text: heading.text, id: heading.id })),
        [
            { text: 'See known', id: 'see-known' },
            { text: 'And Custom Label too', id: 'and-custom-label-too' },
        ],
    );
});
