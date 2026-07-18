import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeMintlifyBlocks } from '../src/normalize-mintlify-blocks.js';

test('surrounds standalone tag lines with blank lines', () => {
    assert.equal(
        normalizeMintlifyBlocks('<Note>\ntext\n</Note>'),
        '<Note>\n\ntext\n\n</Note>\n',
    );
});

test('dedents indented content inside an open tag', () => {
    const input = [
        '<Card title="Docs">',
        '    Four-space indented body must not become a code block.',
        '</Card>',
    ].join('\n');

    const output = normalizeMintlifyBlocks(input);
    assert.ok(
        output.includes(
            '\nFour-space indented body must not become a code block.\n',
        ),
    );
});

test('dedents nested tags relative to their parent', () => {
    const input = [
        '<CardGroup cols={2}>',
        '  <Card title="One">',
        '    Body one.',
        '  </Card>',
        '</CardGroup>',
    ].join('\n');

    const lines = normalizeMintlifyBlocks(input).split('\n');
    assert.ok(lines.includes('<Card title="One">'));
    assert.ok(lines.includes('Body one.'));
});

test('dedents fence content by the fence line indentation inside a tag', () => {
    const input = [
        '<Tab title="npm">',
        '',
        '    ```bash',
        '    npm install',
        '    ```',
        '',
        '</Tab>',
    ].join('\n');

    const lines = normalizeMintlifyBlocks(input).split('\n');
    assert.ok(lines.includes('```bash'));
    assert.ok(lines.includes('npm install'));
});

test('does not touch tag-looking lines inside code fences', () => {
    const input = '```\n<Note>\nnot a tag\n</Note>\n```';
    assert.equal(normalizeMintlifyBlocks(input), input);
});

test('a fence line with an info string does not close an open fence', () => {
    const input = ['````md', '<Note>', '```js', 'x', '```', '</Note>', '````'].join(
        '\n',
    );
    assert.equal(normalizeMintlifyBlocks(input), input);
});

test('stops dedenting after the tag closes', () => {
    const input = [
        '<Note>',
        '  body',
        '</Note>',
        '',
        '    a real indented code block',
    ].join('\n');

    const lines = normalizeMintlifyBlocks(input).split('\n');
    assert.ok(lines.includes('body'));
    assert.ok(lines.includes('    a real indented code block'));
});
