import type { Blockquote, Root } from 'mdast';
import type { Node, Parent } from 'unist';
import { GITHUB_ALERT_VARIANTS } from './manifest.js';

/**
 * GitHub semantics: the marker must be the only content on the first line of
 * the blockquote (`> [!NOTE] text` stays a plain blockquote). Unlike GitHub,
 * markers are matched case-insensitively and alerts may nest, for
 * consistency with `:::message`. Ported from inkstream v1.
 */
const ALERT_MARKER_PATTERN =
    /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\r?\n|$)/i;

interface AlertBlockquote extends Blockquote {
    data?: {
        hName?: string;
        hProperties?: Record<string, string | string[]>;
    };
}

function isParent(node: Node): node is Parent {
    return Array.isArray((node as Partial<Parent>).children);
}

function visitBlockquotes(
    node: Node,
    visitor: (blockquote: AlertBlockquote) => void,
): void {
    if (node.type === 'blockquote') {
        visitor(node as AlertBlockquote);
    }

    if (isParent(node)) {
        for (const child of node.children) {
            visitBlockquotes(child, visitor);
        }
    }
}

/**
 * Normalizes GitHub-style blockquote alerts (`> [!NOTE]` etc.) onto the same
 * `<aside class="msg …">` contract that the Mintlify callout tags and
 * `:::message` directives produce, so one renderer handles all three
 * syntaxes.
 */
export function remarkGithubAlerts() {
    return (tree: Root): void => {
        visitBlockquotes(tree, (blockquote) => {
            if (blockquote.data?.hName) {
                return;
            }

            const paragraph = blockquote.children[0];

            if (paragraph?.type !== 'paragraph') {
                return;
            }

            const firstChild = paragraph.children[0];

            if (firstChild?.type !== 'text') {
                return;
            }

            const match = ALERT_MARKER_PATTERN.exec(firstChild.value);

            if (!match) {
                return;
            }

            const variant =
                GITHUB_ALERT_VARIANTS[
                    match[1].toUpperCase() as keyof typeof GITHUB_ALERT_VARIANTS
                ];
            const rest = firstChild.value.slice(match[0].length);

            if (rest) {
                firstChild.value = rest;
            } else {
                paragraph.children.shift();

                if (paragraph.children[0]?.type === 'break') {
                    paragraph.children.shift();
                }

                if (paragraph.children.length === 0) {
                    blockquote.children.shift();
                }
            }

            const data = blockquote.data ?? (blockquote.data = {});
            data.hName = 'aside';
            data.hProperties = { className: ['msg', variant] };
        });
    };
}
