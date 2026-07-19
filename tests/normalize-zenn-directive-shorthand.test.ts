import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeZennDirectiveShorthand } from '../src/normalize-zenn-directive-shorthand.js';

test('rewrites :::message <variant> to the {.class} form', () => {
    assert.equal(
        normalizeZennDirectiveShorthand(':::message alert\ntext\n:::'),
        ':::message{.alert}\ntext\n:::',
    );
});

test('rewrites :::details <title> to the [label] form', () => {
    assert.equal(
        normalizeZennDirectiveShorthand(':::details タイトル\ntext\n:::'),
        ':::details[タイトル]\ntext\n:::',
    );
});

test('leaves a bare :::message / :::details untouched', () => {
    const input = ':::message\ntext\n:::\n\n:::details\nbody\n:::';
    assert.equal(normalizeZennDirectiveShorthand(input), input);
});

test('does not rewrite shorthand-looking text inside a code fence', () => {
    const input = '```\n:::message alert\n:::details タイトル\n```';
    assert.equal(normalizeZennDirectiveShorthand(input), input);
});

test('matches details shorthand regardless of colon-fence depth', () => {
    assert.equal(
        normalizeZennDirectiveShorthand('::::details 外側\n:::details 内側\n:::\n::::'),
        '::::details[外側]\n:::details[内側]\n:::\n::::',
    );
});

test('reduces @[card]/@[github] embeds to bare URL lines', () => {
    assert.equal(
        normalizeZennDirectiveShorthand('@[card](https://zenn.dev/a)'),
        'https://zenn.dev/a',
    );
    assert.equal(
        normalizeZennDirectiveShorthand('@[github](https://github.com/a/b)'),
        'https://github.com/a/b',
    );
    assert.equal(
        normalizeZennDirectiveShorthand('@[youtube](https://example.com)'),
        '@[youtube](https://example.com)',
    );
});

test('does not rewrite shorthand mentioned mid-sentence without backticks', () => {
    const input =
        'You can also write :::message alert for a colon-style warning, or ::::details 外側 for a nested one.';
    assert.equal(normalizeZennDirectiveShorthand(input), input);
});

test('does not rewrite shorthand written as inline code', () => {
    const input =
        'Use `:::message alert` for warnings and `:::details タイトル` to collapse.';
    assert.equal(normalizeZennDirectiveShorthand(input), input);
});

test('a fence line with an info string does not close an open fence', () => {
    const input = '````md\n:::details Show code\n```js\nx\n```\n:::\n````';
    assert.equal(normalizeZennDirectiveShorthand(input), input);
});

test('resumes rewriting after a fence properly closes', () => {
    const input = [
        '```md',
        ':::message alert',
        '```',
        ':::message alert',
        'rendered',
        ':::',
    ].join('\n');
    const expected = [
        '```md',
        ':::message alert',
        '```',
        ':::message{.alert}',
        'rendered',
        ':::',
    ].join('\n');
    assert.equal(normalizeZennDirectiveShorthand(input), expected);
});
