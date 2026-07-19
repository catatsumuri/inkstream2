import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Components } from 'react-markdown';
import { InkstreamMarkdown } from '../src/react/index.js';

function render(markdown: string): string {
    return renderToStaticMarkup(
        createElement(InkstreamMarkdown, null, markdown),
    );
}

test('renders plain markdown inside the ink-markdown wrapper', () => {
    const html = render('# Hello\n\nworld');

    assert.match(html, /<div class="ink-markdown">/);
    assert.match(html, /<h1 id="hello" class="ink-heading">Hello/);
    assert.match(html, /<p>world<\/p>/);
});

test('renders Mintlify callouts with variant classes', () => {
    const html = render('<Note>\nheads up\n</Note>');

    assert.match(html, /<aside class="ink-callout ink-callout-note">/);
    assert.match(html, /heads up/);
});

test('renders zenn message shorthand through the same callout renderer', () => {
    const html = render(':::message alert\ndanger\n:::');

    assert.match(html, /<aside class="ink-callout ink-callout-alert">/);
});

test('renders cards, card groups, and tree fences', () => {
    const html = render(
        [
            '<CardGroup cols={2}>',
            '  <Card title="Alpha" href="/alpha">',
            '  Body',
            '  </Card>',
            '</CardGroup>',
            '',
            '```tree',
            'src/',
            '  index.ts',
            '```',
        ].join('\n'),
    );

    assert.match(html, /<div class="ink-card-group" data-cols="2">/);
    assert.match(html, /<a href="\/alpha" class="ink-card-link">/);
    assert.match(html, /<p class="ink-card-title">Alpha<\/p>/);
    assert.match(html, /<ul class="ink-tree">/);
    assert.match(html, /<li class="ink-tree-file">index.ts<\/li>/);
});

test('renders Columns with a default renderer', () => {
    const html = render(
        ['<Columns cols={2}>', '  Left', '', '  Right', '</Columns>'].join(
            '\n',
        ),
    );

    assert.match(html, /<div class="ink-columns" data-cols="2">/);
    assert.match(html, /Left/);
    assert.match(html, /Right/);
});

test('renders zenn image size and caption metadata', () => {
    const html = render('![diagram](/img/a.png =250x)\n*a caption*');

    assert.match(html, /<img src="\/img\/a\.png" alt="diagram" width="250"/);
    assert.match(html, /<span class="ink-figure-caption">a caption<\/span>/);
});

test('component overrides replace individual default renderers', () => {
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children: '<Note>\nbody\n</Note>',
            components: {
                aside: () => createElement('p', null, 'custom'),
            } as Components,
        }),
    );

    assert.match(html, /<p>custom<\/p>/);
    assert.doesNotMatch(html, /ink-callout/);
});

test('appends extra class names to the wrapper', () => {
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children: 'hi',
            className: 'prose',
        }),
    );

    assert.match(html, /<div class="ink-markdown prose">/);
});
