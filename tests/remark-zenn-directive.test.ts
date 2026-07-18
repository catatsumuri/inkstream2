import assert from 'node:assert/strict';
import test from 'node:test';
import type { Root, RootContent } from 'mdast';
import remarkDirective from 'remark-directive';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { remarkZennDirective } from '../src/remark-zenn-directive.js';

const processor = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkZennDirective);

function parse(markdown: string): Root {
    const file = new VFile(markdown);

    return processor.runSync(processor.parse(file), file) as Root;
}

interface DirectiveLike {
    type: string;
    name?: string;
    children: RootContent[];
    data?: { hName?: string; hProperties?: Record<string, unknown> };
}

test('converts a plain :::message into an info aside', () => {
    const tree = parse(':::message\n本文です。\n:::');

    const node = tree.children[0] as unknown as DirectiveLike;
    assert.equal(node.type, 'containerDirective');
    assert.equal(node.name, 'message');
    assert.deepEqual(node.data, {
        hName: 'aside',
        hProperties: { className: ['msg', 'info'] },
    });
});

test('reads the callout variant from a class attribute', () => {
    const tree = parse(':::message{.alert}\n警告です。\n:::');

    const node = tree.children[0] as unknown as DirectiveLike;
    assert.deepEqual(node.data?.hProperties?.className, ['msg', 'alert']);
});

test('converts :::details without a label using a default summary', () => {
    const tree = parse(':::details\n折りたたみ本文です。\n:::');

    const node = tree.children[0] as unknown as DirectiveLike;
    assert.equal(node.data?.hName, 'details');
    assert.equal(node.children.length, 2);

    const summary = node.children[0] as unknown as DirectiveLike;
    assert.equal(summary.data?.hName, 'summary');
    assert.equal((summary.children[0] as { value: string }).value, 'Details');

    const body = node.children[1] as unknown as DirectiveLike;
    assert.equal(body.data?.hName, 'div');
    assert.deepEqual(body.data?.hProperties?.className, ['details-content']);
});

test('converts :::details[label] using the bracket label as the summary', () => {
    const tree = parse(':::details[開くとタイトル]\n本文です。\n:::');

    const node = tree.children[0] as unknown as DirectiveLike;
    const summary = node.children[0] as unknown as DirectiveLike;
    assert.equal(
        (summary.children[0] as { value: string }).value,
        '開くとタイトル',
    );

    const body = node.children[1] as unknown as DirectiveLike;
    assert.equal(body.children.length, 1);
    assert.equal(body.children[0].type, 'paragraph');
});

test('ignores directive names it does not recognize', () => {
    const tree = parse(':::warning\ntext\n:::');

    const node = tree.children[0] as unknown as DirectiveLike;
    assert.equal(node.type, 'containerDirective');
    assert.equal(node.data, undefined);
});
