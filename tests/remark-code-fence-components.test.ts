import assert from 'node:assert/strict';
import test from 'node:test';
import type { Root, RootContent } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { remarkCodeFenceComponents } from '../src/remark-code-fence-components.js';
import type { MintlifyContainer } from '../src/remark-mintlify-tags.js';

const processor = unified().use(remarkParse).use(remarkCodeFenceComponents);

function parse(markdown: string): { tree: Root; messages: string[] } {
    const file = new VFile(markdown);
    const tree = processor.runSync(processor.parse(file), file) as Root;

    return { tree, messages: file.messages.map((m) => m.reason) };
}

function asComponent(node: RootContent | undefined): MintlifyContainer {
    assert.equal(node?.type, 'mintlifyContainer');

    return node as unknown as MintlifyContainer;
}

test('converts a tree fence into a Tree component with JSON payload', () => {
    const { tree, messages } = parse('```tree\nsrc/index.ts\n```');

    assert.equal(messages.length, 0);

    const node = asComponent(tree.children[0]);
    assert.equal(node.name, 'Tree');
    assert.deepEqual(node.data, {
        hName: 'tree',
        hProperties: {
            tree: JSON.stringify([
                {
                    type: 'folder',
                    name: 'src',
                    defaultOpen: true,
                    children: [{ type: 'file', name: 'index.ts' }],
                },
            ]),
        },
    });
});

test('converts a quiz fence into a Quiz component with JSON payload', () => {
    const { tree, messages } = parse(
        '```quiz\nquestion: 1 + 1 は?\nA: 1\nB: 2\ncorrect: B\n```',
    );

    assert.equal(messages.length, 0);

    const node = asComponent(tree.children[0]);
    assert.equal(node.name, 'Quiz');
    assert.equal(node.data?.hName, 'quiz');
    assert.equal(
        node.data?.hProperties?.quiz,
        JSON.stringify({
            question: '1 + 1 は?',
            correct: 'B',
            options: [
                { label: 'A', text: '1' },
                { label: 'B', text: '2' },
            ],
        }),
    );
});

test('converts a chart:bar fence into a Chart component with JSON payload', () => {
    const { tree, messages } = parse('```chart:bar\nA: 10\nB: 20\n```');

    assert.equal(messages.length, 0);

    const node = asComponent(tree.children[0]);
    assert.equal(node.name, 'Chart');
    assert.equal(
        node.data?.hProperties?.chart,
        JSON.stringify({
            type: 'bar',
            data: [
                { label: 'A', value: 10 },
                { label: 'B', value: 20 },
            ],
        }),
    );
});

test('leaves a malformed quiz fence as a plain code block and warns', () => {
    const { tree, messages } = parse('```quiz\nA: only one option\n```');

    assert.deepEqual(messages, [
        'Malformed quiz fence (needs question:, correct:, and at least two A:/B:/... options); left as a plain code block',
    ]);
    assert.equal(tree.children[0].type, 'code');
});

test('leaves unrelated code fences untouched', () => {
    const { tree, messages } = parse('```ts\nconst x = 1;\n```');

    assert.equal(messages.length, 0);
    assert.equal(tree.children[0].type, 'code');
});

test('converts a fence nested inside a blockquote', () => {
    const { tree } = parse('> ```tree\n> a.ts\n> ```');

    const blockquote = tree.children[0] as { children: RootContent[] };
    const node = asComponent(blockquote.children[0]);
    assert.equal(node.name, 'Tree');
});
