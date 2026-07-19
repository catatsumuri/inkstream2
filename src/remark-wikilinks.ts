import type { Link, Root, Text } from 'mdast';
import type { Node, Parent } from 'unist';

const WIKILINK_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

/**
 * A resolver's return value: either a plain URL string (always treated as
 * resolved, matching inkstream v1's simple contract) or an object flagging
 * whether the path matched anything, so the renderer can style unresolved
 * links (e.g. a "red link") differently from resolved ones.
 */
export type WikilinkResolution = string | { url: string; exists?: boolean };

/**
 * Resolves a wikilink's `full_path` (the text between `[[` and `]]`, before
 * any `|label`) to a URL. Path-to-URL resolution needs app-specific
 * knowledge this package doesn't have (routing, a document lookup, ...),
 * so it's supplied by the caller.
 */
export type ResolveWikilink = (path: string) => WikilinkResolution;

function isParent(node: Node): node is Parent {
    return Array.isArray((node as Partial<Parent>).children);
}

/**
 * Splits a text node's value on `[[path]]` / `[[path|label]]` matches,
 * returning the replacement node list, or null when the text has no
 * wikilinks.
 */
function splitWikilinksInText(
    node: Text,
    resolveWikilink: ResolveWikilink,
): (Text | Link)[] | null {
    const parts: (Text | Link)[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    WIKILINK_RE.lastIndex = 0;

    while ((match = WIKILINK_RE.exec(node.value)) !== null) {
        const [full, rawPath, rawLabel] = match;
        const path = rawPath.trim();
        const label = rawLabel?.trim() || path.split('/').pop() || path;

        if (match.index > lastIndex) {
            parts.push({
                type: 'text',
                value: node.value.slice(lastIndex, match.index),
            });
        }

        const resolution = resolveWikilink(path);
        const url = typeof resolution === 'string' ? resolution : resolution.url;
        const exists =
            typeof resolution === 'string' ? true : (resolution.exists ?? true);

        const link: Link = {
            type: 'link',
            url,
            children: [{ type: 'text', value: label }],
        };

        if (!exists) {
            link.data = { hProperties: { className: ['ink-wikilink-broken'] } };
        }

        parts.push(link);
        lastIndex = match.index + full.length;
    }

    if (parts.length === 0) {
        return null;
    }

    if (lastIndex < node.value.length) {
        parts.push({ type: 'text', value: node.value.slice(lastIndex) });
    }

    return parts;
}

/**
 * Walks the tree depth-first, splitting every text node's wikilinks in
 * place. Iterates children back-to-front so splicing a match's
 * replacement nodes into a parent doesn't disturb indices still queued
 * for processing.
 */
function visitTextNodes(node: Node, resolveWikilink: ResolveWikilink): void {
    if (!isParent(node)) {
        return;
    }

    const children = node.children;

    for (let index = children.length - 1; index >= 0; index -= 1) {
        const child = children[index] as Node;

        if (child.type === 'text') {
            const parts = splitWikilinksInText(child as Text, resolveWikilink);

            if (parts) {
                children.splice(index, 1, ...(parts as unknown as Node[]));
            }

            continue;
        }

        visitTextNodes(child, resolveWikilink);
    }
}

/**
 * Converts `[[full_path]]` / `[[full_path|label]]` wikilink syntax into
 * link nodes. Label defaults to the path's last `/`-separated segment.
 * Ported from inkstream v1's `remark-wikilinks`; unlike v1's plain
 * `(path: string) => string` contract, the resolver here may also return
 * `{ url, exists: false }` for an unmatched path, which tags the emitted
 * link with the `ink-wikilink-broken` class hook.
 */
export function remarkWikilinks(resolveWikilink: ResolveWikilink) {
    return (tree: Root): void => {
        visitTextNodes(tree, resolveWikilink);
    };
}
