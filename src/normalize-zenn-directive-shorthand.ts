import { transformOutsideCode } from './transform-outside-code.js';

const ZENN_MESSAGE_VARIANTS = ['alert', 'note', 'tip', 'info', 'check'];
const MESSAGE_VARIANT_PATTERN = ZENN_MESSAGE_VARIANTS.join('|');

const MESSAGE_SHORTHAND_RE = new RegExp(
    `:::message\\s+(${MESSAGE_VARIANT_PATTERN})\\b`,
);
const DETAILS_SHORTHAND_RE = /(:{3,})details\s+(.+?)$/;

const ZENN_EMBED_DIRECTIVES = ['card', 'github'];
const EMBED_SHORTHAND_RE = new RegExp(
    `^@\\[(?:${ZENN_EMBED_DIRECTIVES.join('|')})\\]\\((https?:\\/\\/[^\\s)]+)\\)$`,
);

/**
 * Rewrites the friendly `:::message <variant>` / `:::details <title>`
 * authoring shorthand into the `{.class}` / `[label]` syntax remark-directive
 * actually expects. The only line-based step native `:::` directive support
 * needs; everything else happens on the mdast tree via remark-directive and
 * remarkZennDirective. Zenn's `@[card](url)` / `@[github](url)` embeds are
 * reduced to bare URL lines for a linkify-style renderer to pick up.
 * Ported from inkstream v1's `preprocessMarkdownSyntax`, including its
 * protection of code fences and inline code spans, so literal syntax
 * examples written as `` `:::message alert` `` prose survive.
 */
export function normalizeZennDirectiveShorthand(markdown: string): string {
    return transformOutsideCode(markdown, (segment) =>
        segment
            .replace(MESSAGE_SHORTHAND_RE, ':::message{.$1}')
            .replace(DETAILS_SHORTHAND_RE, '$1details[$2]')
            .replace(EMBED_SHORTHAND_RE, '$1'),
    );
}
