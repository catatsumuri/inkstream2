/**
 * Turns heading text into a URL-safe id slug. Unicode letters and numbers
 * are kept (Japanese headings stay readable), everything else is dropped
 * and whitespace collapses to single hyphens.
 *
 * This is the single source of truth for the "heading text → id" mapping:
 * the heading renderers and extractMarkdownHeadings both derive ids from
 * it, so anchors and tables of contents always agree.
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s_-]/gu, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
