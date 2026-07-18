const CODE_FENCE_RE = /^(`{3,}|~{3,})/;

export interface FenceState {
    marker: string | null;
}

/**
 * Feeds one line into the fence-tracking state and reports whether the line
 * itself is a fence marker line. A fence closes only on a marker of the same
 * character, at least as long, with nothing after it — matching CommonMark
 * (and inkstream v1), where ```js inside an open ``` fence is content, not a
 * closing fence.
 */
export function trackFenceLine(state: FenceState, line: string): boolean {
    const trimmed = line.trim();
    const match = CODE_FENCE_RE.exec(trimmed);

    if (!match) {
        return false;
    }

    const fence = match[1];
    const remainder = trimmed.slice(fence.length);

    if (state.marker === null) {
        state.marker = fence;
    } else if (
        fence[0] === state.marker[0] &&
        fence.length >= state.marker.length &&
        remainder.trim() === ''
    ) {
        state.marker = null;
    }

    return true;
}

/**
 * Applies `transform` to the parts of a line outside inline code spans,
 * leaving the spans themselves untouched. Ported from inkstream v1's
 * `transformOutsideInlineCode`.
 */
export function transformOutsideInlineCode(
    line: string,
    transform: (segment: string) => string,
): string {
    let result = '';
    let lastIndex = 0;

    for (const match of line.matchAll(/`+[^`]*`+/g)) {
        result += transform(line.slice(lastIndex, match.index));
        result += match[0];
        lastIndex = match.index + match[0].length;
    }

    result += transform(line.slice(lastIndex));

    return result;
}

/**
 * Applies `transform` to every line that is outside code fences and, within
 * those lines, outside inline code spans. Ported from inkstream v1's
 * `transformOutsideFences`.
 */
export function transformOutsideCode(
    markdown: string,
    transform: (segment: string) => string,
): string {
    const state: FenceState = { marker: null };

    return markdown
        .split('\n')
        .map((line) => {
            if (trackFenceLine(state, line) || state.marker !== null) {
                return line;
            }

            return transformOutsideInlineCode(line, transform);
        })
        .join('\n');
}
