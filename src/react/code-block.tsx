import { Check, Copy, MoveHorizontal, WrapText } from 'lucide-react';
import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import {
    Fragment,
    lazy,
    Suspense,
    useEffect,
    useMemo,
    useState,
} from 'react';
import type { ExtraProps } from 'react-markdown';
import type { Highlighter, ThemedToken } from 'shiki';
import { getHighlighter, tokenizeLines } from './shiki.js';

type CodeBlockProps = ComponentPropsWithoutRef<'code'> &
    ExtraProps & { metastring?: string };

function MermaidLoadFallback() {
    return (
        <div className="ink-mermaid-error">
            Failed to load Mermaid. Please refresh and try again.
        </div>
    );
}

/**
 * Mermaid is an optional peer dependency and a very large bundle, so the
 * diagram module is fetched on first use; when the import fails (mermaid
 * not installed, network error) the fence degrades to an error note.
 */
const MermaidDiagram = lazy(async () => {
    try {
        const module = await import('./mermaid-diagram.js');

        return { default: module.MermaidDiagram };
    } catch {
        return { default: MermaidLoadFallback };
    }
});

/**
 * Resolves the shared Shiki highlighter after mount; returns null until it
 * is ready (or forever, when shiki is not installed) so callers can render
 * plain text as a fallback.
 */
export function useShikiHighlighter(): Highlighter | null {
    const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

    useEffect(() => {
        let active = true;

        void getHighlighter().then((instance) => {
            if (active && instance) {
                setHighlighter(instance);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    return highlighter;
}

/**
 * Renders one line of Shiki tokens. Theme colors live in the tokens' CSS
 * variables and are resolved by the consumer's `.ink-code-tokens` rules, so
 * the enclosing element must carry the `ink-code-tokens` class.
 */
export function ShikiTokenSpans({ tokens }: { tokens: ThemedToken[] }) {
    return (
        <>
            {tokens.map((token, index) => (
                <span key={index} style={token.htmlStyle as CSSProperties}>
                    {token.content}
                </span>
            ))}
        </>
    );
}

function HighlightedCode({
    lines,
    fallback,
}: {
    lines: ThemedToken[][] | null;
    fallback: string;
}) {
    if (!lines) {
        return fallback;
    }

    return lines.map((line, index) => (
        <Fragment key={index}>
            {index > 0 && '\n'}
            <ShikiTokenSpans tokens={line} />
        </Fragment>
    ));
}

/**
 * Parses the fenced code block info string to extract language, filename,
 * and whether this is a diff block.
 *
 * Supported formats:
 *   php:index.php          → language=php, filename=index.php, isDiff=false
 *   diff js:app.js         → language=js,  filename=app.js,   isDiff=true
 *   diff js                → language=js,  filename=null,     isDiff=true
 */
function parseCodeMeta(
    className: string | undefined,
    metastring: string | undefined,
): { language: string; filename: string | null; isDiff: boolean } {
    const normalizeLanguage = (value: string): string => value.toLowerCase();
    const rawLang = normalizeLanguage(
        /language-([\w-]+)/.exec(className ?? '')?.[1] ?? '',
    );
    let language = rawLang;
    let filename: string | null = null;
    let isDiff = false;

    if (rawLang === 'diff') {
        isDiff = true;
        // meta holds the real language (and optional filename): "js:app.js" or "js"
        const langPart = metastring?.split(/\s+/)[0] ?? '';

        if (langPart.includes(':')) {
            const [metaLanguage, metaFilename] = langPart.split(':') as [
                string,
                string,
            ];

            language = normalizeLanguage(metaLanguage);
            filename = metaFilename;
        } else {
            language = normalizeLanguage(langPart);
        }
    } else if (className?.includes(':')) {
        // className is "language-php:index.php" — colon separates lang from filename
        const afterPrefix = (className ?? '').replace(/^.*language-/, '');
        const colonIdx = afterPrefix.indexOf(':');

        language = normalizeLanguage(afterPrefix.slice(0, colonIdx));
        filename = afterPrefix.slice(colonIdx + 1);
    } else if (metastring) {
        // Fallback: meta carries "lang[:filename]"
        // Skip key=value tokens (e.g. tab=Pest) — they are metadata, not language names.
        const langPart = metastring.split(/\s+/)[0] ?? '';

        if (langPart.includes(':')) {
            const [metaLanguage, metaFilename] = langPart.split(':') as [
                string,
                string,
            ];

            language = normalizeLanguage(metaLanguage);
            filename = metaFilename;
        } else if (langPart && !langPart.includes('=')) {
            language = normalizeLanguage(langPart);
        }
    }

    return { language, filename, isDiff };
}

async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);

        return true;
    } catch {
        return false;
    }
}

/**
 * Default renderer for markdown code: inline code stays a plain `<code>`,
 * fenced blocks get Shiki highlighting, a copy button, a line-wrap toggle,
 * an optional filename header (` ```php:index.php `), and a diff mode
 * (` ```diff js:app.js `). Pair it with `pre` unwrapped to a fragment, as
 * the block renders its own `<pre>` inside an `.ink-code-block` container.
 */
export function CodeBlock({
    className,
    children,
    node,
    metastring,
}: CodeBlockProps) {
    const [wrap, setWrap] = useState(false);
    const [copied, setCopied] = useState(false);
    const highlighter = useShikiHighlighter();

    const rawContent = String(children ?? '');
    const content = rawContent.replace(/\n$/, '');

    // react-markdown v10: fenced code blocks always have a trailing newline in children
    const isInline = !className && !rawContent.endsWith('\n');

    const codeMeta =
        metastring ?? (node?.properties?.metastring as string | undefined);
    const { language, filename, isDiff } = parseCodeMeta(className, codeMeta);

    const highlightedLines = useMemo(() => {
        if (!highlighter || isInline || isDiff || language === 'mermaid') {
            return null;
        }

        return tokenizeLines(highlighter, content, language);
    }, [highlighter, content, language, isInline, isDiff]);

    const diffRows = useMemo(() => {
        if (!isDiff) {
            return null;
        }

        return content.split('\n').map((line) => {
            let variant: 'context' | 'add' | 'remove' | 'hunk' = 'context';
            let symbol = ' ';
            let code = line;

            if (line.startsWith('@@')) {
                variant = 'hunk';
            } else if (line.startsWith('+')) {
                variant = 'add';
                symbol = '+';
                code = line.slice(1);
            } else if (line.startsWith('-')) {
                variant = 'remove';
                symbol = '-';
                code = line.slice(1);
            } else if (line.startsWith(' ')) {
                code = line.slice(1);
            }

            const tokens =
                highlighter && code.trim()
                    ? (tokenizeLines(highlighter, code, language)?.[0] ?? null)
                    : null;

            return { variant, symbol, code, tokens };
        });
    }, [highlighter, content, language, isDiff]);

    if (isInline) {
        return <code>{children}</code>;
    }

    if (language === 'mermaid') {
        return (
            <Suspense fallback={<div className="ink-mermaid-loading" />}>
                <MermaidDiagram code={content} />
            </Suspense>
        );
    }

    const handleCopy = async () => {
        let textToCopy = content;

        if (isDiff) {
            textToCopy = content
                .split('\n')
                .map((line) => {
                    if (
                        line.startsWith('+') ||
                        line.startsWith('-') ||
                        line.startsWith(' ')
                    ) {
                        return line.slice(1);
                    }

                    return line;
                })
                .join('\n');
        }

        const didCopy = await copyToClipboard(textToCopy);

        if (!didCopy) {
            return;
        }

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const actionButtons = (
        <>
            <button
                type="button"
                onClick={() => setWrap((value) => !value)}
                aria-label={
                    wrap
                        ? 'Enable horizontal scrolling'
                        : 'Enable line wrapping'
                }
                className="ink-code-button"
                title={wrap ? 'Scroll' : 'Wrap'}
            >
                {wrap ? (
                    <MoveHorizontal className="ink-code-button-icon" />
                ) : (
                    <WrapText className="ink-code-button-icon" />
                )}
            </button>
            <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? 'Copied code to clipboard' : 'Copy code'}
                className="ink-code-button"
                title="Copy"
            >
                {copied ? (
                    <Check className="ink-code-button-icon" />
                ) : (
                    <Copy className="ink-code-button-icon" />
                )}
            </button>
        </>
    );
    const preClassName = wrap ? 'ink-code-pre ink-code-pre-wrap' : 'ink-code-pre';

    if (isDiff && diffRows) {
        return (
            <div className="ink-code-block ink-code-diff">
                <div className="ink-code-header">
                    <span>{filename ?? language}</span>
                    <div className="ink-code-actions">{actionButtons}</div>
                </div>
                <pre className={preClassName} tabIndex={0}>
                    <code>
                        {diffRows.map((row, index) => (
                            <div
                                key={index}
                                className={
                                    row.variant === 'context'
                                        ? 'ink-code-diff-row'
                                        : `ink-code-diff-row ink-code-diff-${row.variant}`
                                }
                            >
                                <span
                                    className="ink-code-diff-symbol"
                                    aria-hidden="true"
                                >
                                    {row.symbol}
                                </span>
                                <span className="ink-code-tokens">
                                    {row.tokens ? (
                                        <ShikiTokenSpans tokens={row.tokens} />
                                    ) : (
                                        row.code
                                    )}
                                </span>
                            </div>
                        ))}
                    </code>
                </pre>
            </div>
        );
    }

    if (filename) {
        return (
            <div className="ink-code-block">
                <div className="ink-code-header">
                    <span>{filename}</span>
                    <div className="ink-code-actions">{actionButtons}</div>
                </div>
                <pre className={preClassName} tabIndex={0}>
                    <code
                        className={`ink-code-tokens${language ? ` language-${language}` : ''}`}
                    >
                        <HighlightedCode
                            lines={highlightedLines}
                            fallback={content}
                        />
                    </code>
                </pre>
            </div>
        );
    }

    return (
        <div className="ink-code-block">
            <div className="ink-code-actions ink-code-actions-floating">
                {actionButtons}
            </div>
            <pre className={preClassName} tabIndex={0}>
                <code
                    className={`ink-code-tokens${language ? ` language-${language}` : ''}`}
                >
                    <HighlightedCode
                        lines={highlightedLines}
                        fallback={content}
                    />
                </code>
            </pre>
        </div>
    );
}
