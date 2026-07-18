import assert from 'node:assert/strict';
import test from 'node:test';
import type { Root } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { remarkGithubAlerts } from '../src/remark-github-alerts.js';

const processor = unified().use(remarkParse).use(remarkGithubAlerts);

function parse(markdown: string): Root {
    return processor.runSync(processor.parse(markdown)) as Root;
}

interface DataNode {
    type: string;
    children?: DataNode[];
    value?: string;
    data?: { hName?: string; hProperties?: Record<string, unknown> };
}

const variantCases: Array<[string, string]> = [
    ['NOTE', 'note'],
    ['TIP', 'tip'],
    ['IMPORTANT', 'info'],
    ['WARNING', 'alert'],
    ['CAUTION', 'alert'],
];

for (const [marker, variant] of variantCases) {
    test(`converts > [!${marker}] into an aside with the ${variant} variant`, () => {
        const tree = parse(`> [!${marker}]\n> Body text.`);
        const node = tree.children[0] as DataNode;

        assert.equal(node.data?.hName, 'aside');
        assert.deepEqual(node.data?.hProperties, {
            className: ['msg', variant],
        });
        assert.equal(node.children?.length, 1);
        assert.equal(node.children?.[0].type, 'paragraph');
    });
}

test('leaves a blockquote whose marker shares its line with text untouched', () => {
    const tree = parse('> [!NOTE] inline text after the marker');
    const node = tree.children[0] as DataNode;

    assert.equal(node.data, undefined);
});

test('leaves a plain blockquote untouched', () => {
    const tree = parse('> Just a quote.');
    const node = tree.children[0] as DataNode;

    assert.equal(node.data, undefined);
});

test('matches markers case-insensitively', () => {
    const tree = parse('> [!note]\n> Body.');
    const node = tree.children[0] as DataNode;

    assert.deepEqual(node.data?.hProperties, { className: ['msg', 'note'] });
});
