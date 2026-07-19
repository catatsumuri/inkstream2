import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InkstreamMarkdown } from '../src/react/index.js';
import type { ResolveWikilink } from '../src/remark-wikilinks.js';

function render(markdown: string, resolveWikilink?: ResolveWikilink): string {
    return renderToStaticMarkup(
        createElement(
            InkstreamMarkdown,
            { children: markdown, resolveWikilink },
        ),
    );
}

const resolveKnownOnly: ResolveWikilink = (path) =>
    path === 'known'
        ? { url: '/documents/1', exists: true }
        : { url: `/documents/create?title=${encodeURIComponent(path)}`, exists: false };

test('leaves [[...]] as literal text when no resolver is supplied', () => {
    const html = render('See [[known]] for details.');

    assert.match(html, /See \[\[known\]\] for details\./);
});

test('resolves a basic wikilink using the last path segment as the label', () => {
    const html = render('[[ns/known]]', (path) =>
        path === 'ns/known' ? '/documents/1' : { url: '#', exists: false },
    );

    assert.match(html, /<a href="\/documents\/1">known<\/a>/);
});

test('resolves a labeled wikilink using the custom label', () => {
    const html = render('[[known|Custom Label]]', resolveKnownOnly);

    assert.match(html, /<a href="\/documents\/1">Custom Label<\/a>/);
});

test('tags an unresolved wikilink with the broken class hook', () => {
    const html = render('[[missing]]', resolveKnownOnly);

    assert.match(
        html,
        /<a href="\/documents\/create\?title=missing" class="ink-wikilink-broken">missing<\/a>/,
    );
});

test('splits multiple wikilinks and surrounding text within one paragraph', () => {
    const html = render('before [[known]] middle [[missing]] after', resolveKnownOnly);

    assert.match(html, /<p>before <a href="\/documents\/1">known<\/a> middle/);
    assert.match(html, /middle <a href="[^"]*" class="ink-wikilink-broken">missing<\/a> after<\/p>/);
});

test('does not treat a standalone wikilink paragraph as a link-card embed', () => {
    const html = render('[[known]]', resolveKnownOnly);

    assert.doesNotMatch(html, /ink-link-card/);
    assert.match(html, /<p><a href="\/documents\/1">known<\/a><\/p>/);
});

test('leaves wikilink-looking text inside a code fence untouched', () => {
    const html = render('```md\n[[known]]\n```', resolveKnownOnly);

    assert.doesNotMatch(html, /<a /);
    assert.match(html, /\[\[known\]\]/);
});

test('resolves a wikilink inside a heading without breaking its id', () => {
    const html = render('# See [[known]]', resolveKnownOnly);

    assert.match(html, /<h1 id="see-known" class="ink-heading">/);
    assert.match(html, /<a href="\/documents\/1">known<\/a>/);
});
