export const WIKILINK_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

export interface ParsedWikilink {
    path: string;
    label: string;
}

/**
 * Derives the trimmed path and display label from a `[[path]]` /
 * `[[path|label]]` match's captured groups: an explicit `|label` wins,
 * otherwise the label falls back to the path's last `/`-separated
 * segment (or the whole path if unsegmented). Shared by `remarkWikilinks`
 * (which also needs the path, to resolve a URL) and
 * `normalizeMarkdownHeadingText` (which only needs the label, to compute
 * a heading slug that matches what remarkWikilinks will render), so a
 * heading's raw-source slug and its rendered id never drift apart.
 */
export function parseWikilinkMatch(
    rawPath: string,
    rawLabel: string | undefined,
): ParsedWikilink {
    const path = rawPath.trim();
    const label = rawLabel?.trim() || path.split('/').pop() || path;

    return { path, label };
}
