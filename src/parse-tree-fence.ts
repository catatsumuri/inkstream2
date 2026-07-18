export interface TreeNode {
    type: 'folder' | 'file';
    name: string;
    defaultOpen?: boolean;
    children?: TreeNode[];
}

function createFolderNode(name: string): TreeNode {
    return { type: 'folder', name, defaultOpen: true, children: [] };
}

function createFileNode(name: string): TreeNode {
    return { type: 'file', name };
}

function ensureFolder(node: TreeNode): TreeNode {
    if (node.type === 'folder') {
        node.children ??= [];

        return node;
    }

    node.type = 'folder';
    node.defaultOpen = true;
    node.children = [];

    return node;
}

function splitPathSegments(value: string): string[] {
    return value
        .split('/')
        .map((segment) => segment.trim())
        .filter(Boolean);
}

/**
 * Parses an indented ASCII file-tree listing (either a plain indented list
 * or `tree`-command output with `├── ` / `└── ` branches) into a nested
 * node structure. Ported from inkstream v1's `parseAsciiTreeContent`.
 */
export function parseTreeFence(content: string): TreeNode[] {
    const lines = content.split('\n');
    const root: TreeNode[] = [];
    const stack: TreeNode[] = [];
    let rootBranchDepthOffset = 0;

    const nonEmptyLines = lines.filter((line) => line.trim() !== '');
    const sharedIndent = nonEmptyLines.reduce<number>((minimum, line) => {
        const leadingSpaces = line.match(/^ */)?.[0].length ?? 0;

        return Math.min(minimum, leadingSpaces);
    }, Number.POSITIVE_INFINITY);
    const normalizedLines =
        Number.isFinite(sharedIndent) && sharedIndent > 0
            ? lines.map((line) => line.slice(sharedIndent))
            : lines;

    const appendPath = (depth: number, rawValue: string): void => {
        const isFolderHint = rawValue.endsWith('/');
        const segments = splitPathSegments(
            isFolderHint ? rawValue.slice(0, -1) : rawValue,
        );

        if (segments.length === 0) {
            return;
        }

        let children =
            depth === 0 || stack[depth - 1] === undefined
                ? root
                : ensureFolder(stack[depth - 1]).children!;
        let currentDepth = depth;

        for (const [index, segment] of segments.entries()) {
            const isLastSegment = index === segments.length - 1;
            const node =
                !isLastSegment || isFolderHint
                    ? createFolderNode(segment)
                    : createFileNode(segment);

            children.push(node);
            stack[currentDepth] = node;
            stack.length = currentDepth + 1;

            if (node.type === 'folder') {
                children = node.children!;
                currentDepth++;
            }
        }
    };

    for (const line of normalizedLines) {
        const trimmed = line.trimEnd();

        if (
            trimmed === '' ||
            /^\d+\s+director(?:y|ies)(?:,\s+\d+\s+files?)?$/.test(trimmed)
        ) {
            continue;
        }

        if (trimmed.trim() === '.') {
            rootBranchDepthOffset = -1;
            continue;
        }

        const branchMatch =
            /^(?<prefix>(?:│ {3}| {4})*)(?:├── |└── )(?<value>.+)$/.exec(
                trimmed,
            );

        if (!branchMatch?.groups?.value) {
            const rawValue = trimmed.trim();
            appendPath(0, rawValue);

            rootBranchDepthOffset = Math.max(
                0,
                splitPathSegments(
                    rawValue.endsWith('/') ? rawValue.slice(0, -1) : rawValue,
                ).length - 1,
            );
            continue;
        }

        const depth =
            Math.floor(branchMatch.groups.prefix.length / 4) +
            1 +
            rootBranchDepthOffset;
        appendPath(depth, branchMatch.groups.value.trim());
    }

    return root;
}
