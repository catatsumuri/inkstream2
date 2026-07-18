import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeZennImages, parseImageMetadata } from '../src/zenn-images.js';

test('encodes a width suffix into a query parameter', () => {
    assert.equal(
        normalizeZennImages('![](/images/a.png =250x)'),
        '![](/images/a.png?__markdown_width=250)',
    );
});

test('encodes width and height', () => {
    assert.equal(
        normalizeZennImages('![alt](/images/a.png =250x150)'),
        '![alt](/images/a.png?__markdown_width=250&__markdown_height=150)',
    );
});

test('folds a *caption* line under an image into the URL', () => {
    assert.equal(
        normalizeZennImages('![](/images/a.png =250x)\n*Guide cover*'),
        '![](/images/a.png?__markdown_width=250&__markdown_caption=Guide+cover)',
    );
});

test('rewrites a linked image target', () => {
    assert.equal(
        normalizeZennImages('[![](/images/a.png =250x)](https://zenn.dev)'),
        '[![](/images/a.png?__markdown_width=250)](https://zenn.dev)',
    );
});

test('leaves plain images and fenced examples untouched', () => {
    const plain = '![alt](/images/a.png)';
    assert.equal(normalizeZennImages(plain), plain);

    const fenced = '```\n![](/images/a.png =250x)\n```';
    assert.equal(normalizeZennImages(fenced), fenced);
});

test('parseImageMetadata reads back and strips the encoded parameters', () => {
    assert.deepEqual(
        parseImageMetadata(
            '/images/a.png?__markdown_width=250&__markdown_caption=Guide+cover',
        ),
        { src: '/images/a.png', width: 250, height: undefined, caption: 'Guide cover' },
    );

    assert.deepEqual(parseImageMetadata('/images/a.png'), {
        src: '/images/a.png',
        width: undefined,
        height: undefined,
        caption: undefined,
    });
});
