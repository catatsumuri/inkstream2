/**
 * Strips markdown inline syntax (links, images, raw HTML) from heading
 * source text, leaving the plain text a reader sees. Used to compute
 * heading slugs from raw markdown so they match what the rendered
 * heading's text content produces.
 */
export function normalizeMarkdownHeadingText(text: string): string {
    return text
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
        .replace(/!\[([^\]]*)\]\[[^\]]*\]/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
        .replace(/<[^>]+>/g, '')
        .trim();
}
