import assert from 'node:assert/strict';
import test from 'node:test';
import type { Root } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { normalizeMintlifyBlocks } from '../src/normalize-mintlify-blocks.js';
import { parseTreeTags } from '../src/parse-tree-tags.js';
import {
    remarkMintlifyTags,
    type MintlifyContainer,
} from '../src/remark-mintlify-tags.js';
import { remarkTreeTags } from '../src/remark-tree-tags.js';

const processor = unified()
    .use(remarkParse)
    .use(remarkMintlifyTags)
    .use(remarkTreeTags);

function parse(markdown: string): { tree: Root; messages: string[] } {
    const file = new VFile(normalizeMintlifyBlocks(markdown));
    const tree = processor.runSync(processor.parse(file), file) as Root;

    return { tree, messages: file.messages.map((m) => m.reason) };
}

test('parseTreeTags builds nested folders and files', () => {
    const nodes = parseTreeTags([
        '<Tree.Folder name="app" defaultOpen>',
        '  <Tree.File name="layout.tsx" />',
        '  <Tree.Folder name="pages">',
        '    <Tree.File name="index.tsx" />',
        '  </Tree.Folder>',
        '</Tree.Folder>',
        '<Tree.File name="package.json" />',
    ]);

    assert.deepEqual(nodes, [
        {
            type: 'folder',
            name: 'app',
            defaultOpen: true,
            children: [
                { type: 'file', name: 'layout.tsx' },
                {
                    type: 'folder',
                    name: 'pages',
                    children: [{ type: 'file', name: 'index.tsx' }],
                },
            ],
        },
        { type: 'file', name: 'package.json' },
    ]);
});

test('converts a <Tree> block into a tree node carrying JSON', () => {
    const { tree, messages } = parse(
        [
            '<Tree>',
            '  <Tree.Folder name="src" defaultOpen>',
            '    <Tree.File name="index.ts" />',
            '  </Tree.Folder>',
            '</Tree>',
        ].join('\n'),
    );

    assert.equal(messages.length, 0);
    assert.equal(tree.children.length, 1);

    const container = tree.children[0] as MintlifyContainer;
    assert.equal(container.type, 'mintlifyContainer');
    assert.equal(container.name, 'Tree');
    assert.equal(container.data?.hName, 'tree');
    assert.deepEqual(container.children, []);

    const json = container.data?.hProperties?.tree;
    assert.equal(typeof json, 'string');
    assert.deepEqual(JSON.parse(json as string), [
        {
            type: 'folder',
            name: 'src',
            defaultOpen: true,
            children: [{ type: 'file', name: 'index.ts' }],
        },
    ]);
});
