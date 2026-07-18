import { parseJsxAttributes } from './parse-jsx-attributes.js';
import type { TreeNode } from './parse-tree-fence.js';

function joinMultilineTreeTags(lines: string[]): string[] {
    const result: string[] = [];
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];
        const trimmed = line.trim();

        if (
            /^<Tree\.(Folder|File)(?:\s|$)/.test(trimmed) &&
            !trimmed.includes('>')
        ) {
            let accumulated = trimmed;
            index++;

            while (index < lines.length) {
                const nextTrimmed = lines[index].trim();
                index++;
                accumulated += ` ${nextTrimmed}`;

                if (
                    accumulated.trimEnd().endsWith('/>') ||
                    accumulated.trimEnd().endsWith('>')
                ) {
                    break;
                }
            }

            result.push(accumulated);
            continue;
        }

        result.push(line);
        index++;
    }

    return result;
}

function createFolderNode(attrs: Record<string, string>): TreeNode {
    const node: TreeNode = {
        type: 'folder',
        name: attrs.name ?? '',
        children: [],
    };

    if (attrs.defaultOpen !== undefined && attrs.defaultOpen !== 'false') {
        node.defaultOpen = true;
    }

    return node;
}

/**
 * Parses the body of a JSX `<Tree>` block — `<Tree.Folder>` / `<Tree.File>`
 * lines — into the same nested node structure `parseTreeFence` produces.
 * Ported from inkstream v1's `parseTreeContent`.
 */
export function parseTreeTags(lines: string[]): TreeNode[] {
    const root: TreeNode[] = [];
    const stack: TreeNode[][] = [root];

    for (const line of joinMultilineTreeTags(lines)) {
        const trimmed = line.trim();

        if (!trimmed) {
            continue;
        }

        const folderSelfClose = /^<Tree\.Folder(?<attrs>[^>]*)\/\s*>$/.exec(
            trimmed,
        );

        if (folderSelfClose) {
            const attrs = parseJsxAttributes(
                folderSelfClose.groups?.attrs ?? '',
            );
            stack[stack.length - 1].push(createFolderNode(attrs));
            continue;
        }

        const folderOpen = /^<Tree\.Folder(?<attrs>[^>]*)>$/.exec(trimmed);

        if (folderOpen) {
            const attrs = parseJsxAttributes(folderOpen.groups?.attrs ?? '');
            const node = createFolderNode(attrs);

            stack[stack.length - 1].push(node);
            stack.push(node.children!);
            continue;
        }

        const fileNode = /^<Tree\.File(?<attrs>[^>]*)\/?\s*>$/.exec(trimmed);

        if (fileNode) {
            const attrs = parseJsxAttributes(fileNode.groups?.attrs ?? '');
            stack[stack.length - 1].push({
                type: 'file',
                name: attrs.name ?? '',
            });
            continue;
        }

        if (trimmed === '</Tree.Folder>' && stack.length > 1) {
            stack.pop();
        }
    }

    return root;
}
