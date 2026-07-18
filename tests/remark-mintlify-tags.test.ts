import assert from 'node:assert/strict';
import test from 'node:test';
import type { Root, RootContent } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { normalizeMintlifyBlocks } from '../src/normalize-mintlify-blocks.js';
import {
    remarkMintlifyTags,
    type MintlifyContainer,
} from '../src/remark-mintlify-tags.js';

const processor = unified().use(remarkParse).use(remarkMintlifyTags);

function parse(markdown: string): { tree: Root; messages: string[] } {
    const file = new VFile(normalizeMintlifyBlocks(markdown));
    const tree = processor.runSync(processor.parse(file), file) as Root;

    return { tree, messages: file.messages.map((m) => m.reason) };
}

function asContainer(node: RootContent | undefined): MintlifyContainer {
    assert.equal(node?.type, 'mintlifyContainer');

    return node as MintlifyContainer;
}

test('pairs a callout block into an aside container', () => {
    const { tree, messages } = parse('<Note>\n\nBe careful.\n\n</Note>');

    assert.equal(messages.length, 0);
    assert.equal(tree.children.length, 1);

    const note = asContainer(tree.children[0]);
    assert.equal(note.name, 'Note');
    assert.deepEqual(note.data, {
        hName: 'aside',
        hProperties: { className: ['msg', 'note'] },
    });
    assert.equal(note.children.length, 1);
    assert.equal(note.children[0].type, 'paragraph');
});

test('parses blocks without blank lines around tags', () => {
    const { tree, messages } = parse('<Note>\nBe careful.\n</Note>');

    assert.equal(messages.length, 0);

    const note = asContainer(tree.children[0]);
    assert.equal(note.children[0].type, 'paragraph');
});

test('converts a single-line tag pair inside a paragraph', () => {
    const { tree, messages } = parse('<Note>Be **careful**.</Note>');

    assert.equal(messages.length, 0);

    const note = asContainer(tree.children[0]);
    assert.equal(note.name, 'Note');
    assert.equal(note.children.length, 1);

    const paragraph = note.children[0];
    assert.equal(paragraph.type, 'paragraph');
    assert.equal(paragraph.children[0].type, 'text');
    assert.equal(paragraph.children[1].type, 'strong');
});

test('supports self-closing tags', () => {
    const { tree, messages } = parse('<Card title="Docs" href="/docs" />');

    assert.equal(messages.length, 0);

    const card = asContainer(tree.children[0]);
    assert.equal(card.name, 'Card');
    assert.deepEqual(card.attributes, { title: 'Docs', href: '/docs' });
    assert.deepEqual(card.children, []);
});

test('nests deeper than the v1 seven-level colon limit', () => {
    const tags = [
        'Steps',
        'Step',
        'Tabs',
        'Tab',
        'CardGroup',
        'Card',
        'AccordionGroup',
        'Accordion',
        'Note',
    ];
    const markdown = [
        ...tags.map((tag) => `<${tag}>`),
        'deep',
        ...[...tags].reverse().map((tag) => `</${tag}>`),
    ].join('\n');

    const { tree, messages } = parse(markdown);

    assert.equal(messages.length, 0);

    let node = asContainer(tree.children[0]);

    for (const tag of tags.slice(1)) {
        assert.equal(node.children.length, 1);
        node = asContainer(node.children[0]);
        assert.equal(node.name, tag);
    }

    assert.equal(node.children[0].type, 'paragraph');
});

test('parses quoted, brace, and bare attributes', () => {
    const { tree } = parse(
        '<ParamField path="user" type="string" required deprecated={false}>\n\nbody\n\n</ParamField>',
    );

    const field = asContainer(tree.children[0]);
    assert.deepEqual(field.attributes, {
        path: 'user',
        type: 'string',
        required: 'true',
        deprecated: 'false',
    });
    assert.deepEqual(field.data?.hProperties, {
        path: 'user',
        type: 'string',
        required: 'true',
        deprecated: 'false',
    });
});

test('drops unlisted attributes from hProperties but keeps them on the node', () => {
    const { tree } = parse('<Card title="Docs" onClick="steal()">\n\nx\n\n</Card>');

    const card = asContainer(tree.children[0]);
    assert.deepEqual(card.attributes, {
        title: 'Docs',
        onClick: 'steal()',
    });
    assert.deepEqual(card.data?.hProperties, { title: 'Docs' });
});

test('keeps an unmatched close tag literal and warns', () => {
    const { tree, messages } = parse('before\n\n</Note>\n\nafter');

    assert.deepEqual(messages, ['Unmatched closing tag </Note>']);
    assert.equal(tree.children.length, 3);
    assert.equal(tree.children[1].type, 'html');
});

test('auto-closes an unclosed tag at the end of input and warns', () => {
    const { tree, messages } = parse('<Note>\n\nstill open');

    assert.deepEqual(messages, ['<Note> was never closed']);

    const note = asContainer(tree.children[0]);
    assert.equal(note.name, 'Note');
    assert.equal(note.children.length, 1);
});

test('auto-closes children when an ancestor closes and warns', () => {
    const { tree, messages } = parse(
        '<Tabs>\n<Tab title="One">\ncontent\n</Tabs>',
    );

    assert.deepEqual(messages, ['<Tab> auto-closed by </Tabs>']);

    const tabs = asContainer(tree.children[0]);
    assert.equal(tabs.name, 'Tabs');

    const tab = asContainer(tabs.children[0]);
    assert.equal(tab.name, 'Tab');
    assert.equal(tab.children[0].type, 'paragraph');
});

test('pairs tags inside blockquotes', () => {
    const { tree, messages } = parse('> <Note>\n>\n> text\n>\n> </Note>');

    assert.equal(messages.length, 0);

    const blockquote = tree.children[0];
    assert.equal(blockquote.type, 'blockquote');

    const note = asContainer(
        (blockquote as { children: RootContent[] }).children[0],
    );
    assert.equal(note.name, 'Note');
});

test('leaves unknown tags and code fences untouched', () => {
    const { tree, messages } = parse(
        '<Foo>\n\ntext\n\n</Foo>\n\n```\n<Note>\nnot a tag\n</Note>\n```',
    );

    assert.equal(messages.length, 0);

    const types = tree.children.map((child) => child.type);
    assert.deepEqual(types, ['html', 'paragraph', 'html', 'code']);
});

test('pairs an inline tag mid-sentence without disturbing surrounding text', () => {
    const { tree, messages } = parse(
        'これは <Badge color="green">New</Badge> なバッジです。',
    );

    assert.equal(messages.length, 0);
    assert.equal(tree.children.length, 1);

    const paragraph = tree.children[0];
    assert.equal(paragraph.type, 'paragraph');

    const inline = (paragraph as { children: RootContent[] }).children;
    assert.equal(inline.length, 3);
    assert.equal(inline[0].type, 'text');

    const badge = asContainer(inline[1]);
    assert.equal(badge.name, 'Badge');
    assert.deepEqual(badge.attributes, { color: 'green' });
    assert.deepEqual(badge.data, {
        hName: 'badge',
        hProperties: { color: 'green' },
    });
    assert.equal(badge.children.length, 1);
    assert.equal(badge.children[0].type, 'text');

    assert.equal(inline[2].type, 'text');
});

test('pairs two inline tags in the same paragraph', () => {
    const { tree } = parse(
        '<Badge>New</Badge> と <Tooltip tip="説明">用語</Tooltip> です。',
    );

    const inline = (tree.children[0] as { children: RootContent[] })
        .children;
    const badge = asContainer(inline[0]);
    const tooltip = asContainer(inline[2]);

    assert.equal(badge.name, 'Badge');
    assert.equal(tooltip.name, 'Tooltip');
    assert.deepEqual(tooltip.attributes, { tip: '説明' });
});

test('leaves a block tag literal when it appears mid-sentence', () => {
    const { tree, messages } = parse('text <Note>x</Note> more text');

    assert.equal(messages.length, 0);

    const inline = (tree.children[0] as { children: RootContent[] })
        .children;
    const types = inline.map((node) => node.type);
    assert.deepEqual(types, ['text', 'html', 'text', 'html', 'text']);
});

test('an inline tag alone in a paragraph stays nested inside it', () => {
    const { tree, messages } = parse('<Badge>New</Badge>');

    assert.equal(messages.length, 0);

    const paragraph = tree.children[0];
    assert.equal(paragraph.type, 'paragraph');

    const badge = asContainer(
        (paragraph as { children: RootContent[] }).children[0],
    );
    assert.equal(badge.name, 'Badge');
});

test('a block tag pair still consumes the whole paragraph when inline tags are also present', () => {
    const { tree } = parse('<Note>outer <Badge>x</Badge> more</Note>');

    const note = asContainer(tree.children[0]);
    assert.equal(note.name, 'Note');
    assert.equal(note.children.length, 1);

    const paragraph = note.children[0];
    assert.equal(paragraph.type, 'paragraph');

    const badge = asContainer(
        (paragraph as { children: RootContent[] }).children[1],
    );
    assert.equal(badge.name, 'Badge');
});
