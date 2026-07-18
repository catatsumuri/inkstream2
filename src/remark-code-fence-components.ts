import type { Code, Parent, Root, RootContent } from 'mdast';
import type { VFile } from 'vfile';
import type { MintlifyContainer } from './remark-mintlify-tags.js';
import { parseChartFence } from './parse-chart-fence.js';
import { parseQuizFence } from './parse-quiz-fence.js';
import { parseTreeFence } from './parse-tree-fence.js';

function createComponent(
    name: string,
    hName: string,
    json: string,
): MintlifyContainer {
    return {
        type: 'mintlifyContainer',
        name,
        attributes: {},
        children: [],
        data: { hName, hProperties: { [hName]: json } },
    };
}

function transformCode(code: Code, file: VFile): MintlifyContainer | null {
    if (code.lang === 'tree') {
        return createComponent(
            'Tree',
            'tree',
            JSON.stringify(parseTreeFence(code.value)),
        );
    }

    if (code.lang === 'quiz') {
        const quiz = parseQuizFence(code.value);

        if (quiz === null) {
            file.message(
                'Malformed quiz fence (needs question:, correct:, and at least two A:/B:/... options); left as a plain code block',
                code,
            );

            return null;
        }

        return createComponent('Quiz', 'quiz', JSON.stringify(quiz));
    }

    const chartMatch = /^chart:(bar|radar)$/.exec(code.lang ?? '');

    if (chartMatch) {
        const chart = parseChartFence(
            chartMatch[1] as 'bar' | 'radar',
            code.value,
        );

        if (chart === null) {
            file.message(
                'Malformed chart fence (needs at least one "label: value" line); left as a plain code block',
                code,
            );

            return null;
        }

        return createComponent('Chart', 'chart', JSON.stringify(chart));
    }

    return null;
}

function transform(parent: Parent, file: VFile): void {
    const children = parent.children;

    for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (child.type === 'code') {
            const replacement = transformCode(child, file);

            if (replacement) {
                children[i] = replacement as RootContent;
            }

            continue;
        }

        if ('children' in child) {
            transform(child as Parent, file);
        }
    }
}

/**
 * Remark plugin: converts ` ```tree `, ` ```quiz `, and ` ```chart:bar ` /
 * ` ```chart:radar ` fenced code blocks into `mintlifyContainer` nodes
 * carrying the parsed structure as a single JSON-string property (`tree`,
 * `quiz`, or `chart`), for a renderer component to read and build UI from.
 * Malformed fences emit a vfile warning and are left as plain code blocks
 * instead of failing the whole document.
 */
export function remarkCodeFenceComponents() {
    return (tree: Root, file: VFile): void => {
        transform(tree, file);
    };
}
