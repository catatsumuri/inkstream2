import type { Parent, Root } from 'mdast';

function transform(parent: Parent): void {
    for (const child of parent.children) {
        if (child.type === 'code' && child.meta) {
            const data = child.data ?? (child.data = {});
            const withProperties = data as {
                hProperties?: Record<string, unknown>;
            };
            const hProperties =
                withProperties.hProperties ?? (withProperties.hProperties = {});

            hProperties.metastring = child.meta;
        }

        if ('children' in child) {
            transform(child as Parent);
        }
    }
}

/**
 * Remark plugin: copies the fenced code block meta string (everything after
 * the language on the opening fence, e.g. ` ```diff js:app.js `) into
 * `hProperties.metastring` so it survives the trip to hast and reaches the
 * `code` renderer component as a `metastring` prop.
 */
export function remarkCodeMeta() {
    return (tree: Root): void => {
        transform(tree);
    };
}
