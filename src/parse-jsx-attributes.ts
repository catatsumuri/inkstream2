const JSX_ATTRIBUTE_RE = /(\w+)(?:=(?:"([^"]*)"|\{([^}]*)\}))?/g;

const BRACE_STRING_LITERAL_RE = /^(?:"([^"]*)"|'([^']*)')$/;

const JSX_ARRAY_ATTRIBUTE_RE = /(\w+)=\{(\[[^\]]*\])\}/g;

/**
 * Flattens JSX array attribute values (`tags={["A", "B"]}` → `tags="A,B"`).
 * Also used by `normalizeMintlifyBlocks` on raw tag lines: the array form
 * contains quotes, which makes the tag invalid HTML for remark, so the line
 * must be rewritten before parsing. Ported from inkstream v1.
 */
export function normalizeJsxArrayAttributes(input: string): string {
    return input.replace(
        JSX_ARRAY_ATTRIBUTE_RE,
        (_match: string, key: string, arrayJson: string) => {
            const values = [...arrayJson.matchAll(/"([^"]*)"/g)].map(
                (m) => m[1],
            );

            return `${key}="${values.join(',')}"`;
        },
    );
}

/**
 * Evaluates a JSX brace expression (`{3}`, `{true}`, `{'text'}`) to a string
 * value. Non-literal expressions are not evaluated and drop the attribute.
 */
function evaluateBraceExpression(expression: string): string | undefined {
    if (expression === 'true' || expression === 'false') {
        return expression;
    }

    if (/^-?\d+(?:\.\d+)?$/.test(expression)) {
        return expression;
    }

    const quoted = BRACE_STRING_LITERAL_RE.exec(expression);

    if (quoted) {
        return quoted[1] ?? quoted[2];
    }

    return undefined;
}

/**
 * Parses the attribute portion of a JSX-style tag (`title="x" cols={2} bare`)
 * into a string map. Bare attributes become `'true'`.
 */
export function parseJsxAttributes(input: string): Record<string, string> {
    const attributes: Record<string, string> = {};

    for (const match of normalizeJsxArrayAttributes(input).matchAll(
        JSX_ATTRIBUTE_RE,
    )) {
        const [, name, quoted, braced] = match;

        if (quoted !== undefined) {
            attributes[name] = quoted;
            continue;
        }

        if (braced !== undefined) {
            const value = evaluateBraceExpression(braced.trim());

            if (value !== undefined) {
                attributes[name] = value;
            }

            continue;
        }

        attributes[name] = 'true';
    }

    return attributes;
}
