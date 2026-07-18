import type { Paragraph, Root, Text } from 'mdast';
import type { Node, Parent } from 'unist';

interface ContainerDirectiveNode extends Node {
    type: 'containerDirective';
    name: string;
    attributes?: Record<string, string | undefined>;
    children: Node[];
    data?: {
        hName?: string;
        hProperties?: Record<string, unknown>;
    };
}

function isParent(node: Node): node is Parent {
    return Array.isArray((node as Partial<Parent>).children);
}

function visitContainerDirectives(
    node: Node,
    visitor: (directive: ContainerDirectiveNode) => void,
): void {
    if (node.type === 'containerDirective') {
        visitor(node as ContainerDirectiveNode);
    }

    if (isParent(node)) {
        for (const child of node.children) {
            visitContainerDirectives(child, visitor);
        }
    }
}

/**
 * Handles the native `:::message` / `:::details` container-directive
 * syntax (parsed by `remark-directive`, which must run before this plugin).
 * Ported from inkstream v1's `remark-zenn-directive` -- this is the one
 * mdast shape inkstream2's own tag-pairing engine doesn't produce, since
 * v2 builds Mintlify callouts as `mintlifyContainer` nodes directly rather
 * than routing them through colon-fence directives.
 */
export function remarkZennDirective() {
    return (tree: Root): void => {
        visitContainerDirectives(tree, (directiveNode) => {
            if (directiveNode.name === 'message') {
                const attributes = directiveNode.attributes ?? {};
                const className =
                    attributes.className ?? attributes.class ?? '';
                const classes = className.split(/\s+/).filter(Boolean);
                const typeClass =
                    (['alert', 'note', 'tip', 'check'] as const).find((c) =>
                        classes.includes(c),
                    ) ?? (attributes.alert !== undefined ? 'alert' : 'info');

                const data = directiveNode.data ?? (directiveNode.data = {});
                data.hName = 'aside';
                data.hProperties = {
                    className: ['msg', typeClass],
                };
            }

            if (directiveNode.name === 'details') {
                const bodyChildren = [...directiveNode.children];
                let summaryChildren: Paragraph['children'] = [
                    { type: 'text', value: 'Details' } as Text,
                ];

                // Only the directive label (`:::details[title]`) becomes the
                // summary; a plain first paragraph is body content.
                const first = bodyChildren[0] as
                    | (Paragraph & { data?: { directiveLabel?: boolean } })
                    | undefined;

                if (
                    first?.type === 'paragraph' &&
                    first.data?.directiveLabel === true
                ) {
                    bodyChildren.shift();

                    if (first.children.length > 0) {
                        summaryChildren = first.children;
                    }
                }

                const data = directiveNode.data ?? (directiveNode.data = {});
                data.hName = 'details';
                data.hProperties = {};

                directiveNode.children = [
                    {
                        type: 'paragraph',
                        data: { hName: 'summary' },
                        children: summaryChildren,
                    } as Paragraph,
                    {
                        type: 'paragraph',
                        data: {
                            hName: 'div',
                            hProperties: { className: ['details-content'] },
                        },
                        children: bodyChildren,
                    } as Paragraph,
                ];
            }
        });
    };
}
