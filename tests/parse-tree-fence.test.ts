import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTreeFence } from '../src/parse-tree-fence.js';

test('parses a single slash-separated path into nested folders/files', () => {
    const nodes = parseTreeFence('src/lib/a.ts');

    assert.deepEqual(nodes, [
        {
            type: 'folder',
            name: 'src',
            defaultOpen: true,
            children: [
                {
                    type: 'folder',
                    name: 'lib',
                    defaultOpen: true,
                    children: [{ type: 'file', name: 'a.ts' }],
                },
            ],
        },
    ]);
});

test('parses `tree`-command style branch output', () => {
    const nodes = parseTreeFence(
        '.\n├── src\n│   ├── index.ts\n│   └── lib\n│       └── a.ts\n└── package.json\n\n2 directories, 3 files',
    );

    assert.deepEqual(nodes, [
        {
            type: 'folder',
            name: 'src',
            defaultOpen: true,
            children: [
                { type: 'file', name: 'index.ts' },
                {
                    type: 'folder',
                    name: 'lib',
                    defaultOpen: true,
                    children: [{ type: 'file', name: 'a.ts' }],
                },
            ],
        },
        { type: 'file', name: 'package.json' },
    ]);
});

test('treats a trailing slash as a folder even with no children', () => {
    const nodes = parseTreeFence('empty-dir/');

    assert.deepEqual(nodes, [
        { type: 'folder', name: 'empty-dir', defaultOpen: true, children: [] },
    ]);
});

test('each plain path line is independent, not merged across lines', () => {
    // Faithful port of a v1 quirk: unlike the ├──/└── branch format (which
    // tracks depth via a shared stack), bare slash-path lines don't share
    // state, so a repeated leading segment produces sibling folders of the
    // same name rather than one merged folder.
    const nodes = parseTreeFence('src/a.ts\nsrc/b.ts');

    assert.equal(nodes.length, 2);
    assert.equal(nodes[0].name, 'src');
    assert.equal(nodes[1].name, 'src');
    assert.deepEqual(nodes[0].children, [{ type: 'file', name: 'a.ts' }]);
    assert.deepEqual(nodes[1].children, [{ type: 'file', name: 'b.ts' }]);
});
