import { isTagLine, matchCloseTag, matchOpenTag } from './match-tags.js';
import { normalizeJsxArrayAttributes } from './parse-jsx-attributes.js';
import { trackFenceLine, type FenceState } from './transform-outside-code.js';

interface OpenTagFrame {
    name: string;
    leadingSpaces: number;
}

function leadingSpaceCount(line: string): number {
    return line.match(/^ */)?.[0].length ?? 0;
}

function stripIndent(line: string, width: number): string {
    return width > 0 ? line.replace(new RegExp(`^ {0,${width}}`), '') : line;
}

/**
 * Minimal line-level pre-pass: surrounds standalone Mintlify tag lines with
 * blank lines so remark parses each tag as its own `html` flow node instead
 * of swallowing tag and content into one node, and strips the authoring
 * indentation inside open tags (up to the open tag's indent + 4, mirroring
 * inkstream v1) so indented tag bodies don't turn into indented code blocks.
 * This is the only line-based step in the v2 pipeline; all structure is
 * built on the AST afterwards.
 *
 * Extra blank lines are harmless to markdown, so the pass over-inserts
 * rather than tracking paragraph context. Code fences are respected, with
 * fence content dedented by the fence line's own indentation.
 */
export function normalizeMintlifyBlocks(markdown: string): string {
    const lines = markdown.split('\n');
    const out: string[] = [];
    const fenceState: FenceState = { marker: null };
    const tagStack: OpenTagFrame[] = [];
    let fenceIndent = 0;

    for (const line of lines) {
        const tagIndentWidth =
            tagStack.length > 0
                ? (tagStack[tagStack.length - 1]?.leadingSpaces ?? 0) + 4
                : 0;
        const wasInFence = fenceState.marker !== null;
        const isFenceLine = trackFenceLine(fenceState, line);

        if (isFenceLine) {
            if (!wasInFence && fenceState.marker !== null) {
                fenceIndent = leadingSpaceCount(line);
                out.push(stripIndent(line, tagIndentWidth));
            } else {
                out.push(stripIndent(line, fenceIndent));

                if (fenceState.marker === null) {
                    fenceIndent = 0;
                }
            }

            continue;
        }

        if (fenceState.marker !== null) {
            out.push(stripIndent(line, fenceIndent));
            continue;
        }

        if (isTagLine(line)) {
            const trimmed = line.trim();
            const open = matchOpenTag(trimmed);
            const close = matchCloseTag(trimmed);

            if (open !== null && !open.selfClosing) {
                tagStack.push({
                    name: open.name,
                    leadingSpaces: leadingSpaceCount(line),
                });
            } else if (close !== null) {
                for (let i = tagStack.length - 1; i >= 0; i--) {
                    if (tagStack[i].name === close.name) {
                        tagStack.length = i;
                        break;
                    }
                }
            }

            if (out.length > 0 && out[out.length - 1].trim() !== '') {
                out.push('');
            }

            // Array attribute values contain quotes, which make the tag
            // invalid HTML for remark; flatten them so the line parses as
            // an `html` node.
            out.push(normalizeJsxArrayAttributes(trimmed));
            out.push('');
            continue;
        }

        out.push(stripIndent(line, tagIndentWidth));
    }

    return out.join('\n');
}
