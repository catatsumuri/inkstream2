import type { Parent, Root } from 'mdast';
import { parseTreeTags } from './parse-tree-tags.js';
import type { MintlifyContainer } from './remark-mintlify-tags.js';

function collectRawLines(nodes: unknown[]): string[] {
    const lines: string[] = [];

    for (const node of nodes) {
        const candidate = node as {
            type: string;
            value?: string;
            children?: unknown[];
        };

        // A dot is not valid in an HTML tag name, so remark leaves
        // `<Tree.Folder>` lines as literal text (inside a paragraph) rather
        // than `html` nodes; collect the raw value either way.
        if (
            (candidate.type === 'html' || candidate.type === 'text') &&
            candidate.value !== undefined
        ) {
            lines.push(...candidate.value.split('\n'));
            continue;
        }

        if (Array.isArray(candidate.children)) {
            lines.push(...collectRawLines(candidate.children));
        }
    }

    return lines;
}

function transform(parent: Parent): void {
    for (const child of parent.children) {
        if (child.type === 'mintlifyContainer') {
            const container = child as MintlifyContainer;

            if (container.name === 'Tree') {
                container.data = {
                    hName: 'tree',
                    hProperties: {
                        tree: JSON.stringify(
                            parseTreeTags(collectRawLines(container.children)),
                        ),
                    },
                };
                container.children = [];
                continue;
            }
        }

        if ('children' in child) {
            transform(child as Parent);
        }
    }
}

/**
 * Remark plugin: converts a paired JSX `<Tree>` container (produced by
 * `remarkMintlifyTags`, which must run first) into the same
 * JSON-string-carrying `tree` node the ` ```tree ` fence produces, by parsing
 * the raw `<Tree.Folder>` / `<Tree.File>` lines the container captured as
 * `html` children.
 */
export function remarkTreeTags() {
    return (tree: Root): void => {
        transform(tree);
    };
}
