import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { createHeadingIdDispenser } from '../heading-id-dispenser.js';
import { normalizeInkstreamMarkdown } from '../normalize-inkstream-markdown.js';
import { inkstreamRemarkPlugins } from '../remark-plugins.js';
import { inkstreamDefaultComponents } from './default-components.js';
import { HeadingIdContext } from './heading-components.js';

export interface InkstreamMarkdownProps {
    /** Raw markdown source (Zenn + Mintlify + GFM syntax). */
    children: string;
    /** Extra class names for the `.ink-markdown` wrapper element. */
    className?: string;
    /**
     * Per-tag renderer overrides, merged over the defaults. Accepts the
     * same shape as react-markdown's `components` prop, including the
     * custom inkstream tags (aside, card, tree, quiz, chart, ...).
     */
    components?: Components;
    /**
     * Prefix for heading ids, for pages that render several documents and
     * need their anchors disambiguated. Pass the same value to
     * extractMarkdownHeadings so a table of contents stays in sync.
     */
    headingIdPrefix?: string;
}

/**
 * Drop-in renderer for inkstream-flavoured markdown: runs the string-level
 * normalizers and the full remark plugin chain, and renders every custom
 * element with unstyled defaults that carry stable `ink-*` class names.
 */
export function InkstreamMarkdown({
    children,
    className,
    components,
    headingIdPrefix,
}: InkstreamMarkdownProps) {
    // A fresh dispenser per render pass keeps duplicate-heading numbering
    // deterministic across re-renders.
    const dispenseHeadingId = createHeadingIdDispenser();

    return (
        <HeadingIdContext.Provider
            value={{ dispense: dispenseHeadingId, prefix: headingIdPrefix }}
        >
            <div
                className={
                    className ? `ink-markdown ${className}` : 'ink-markdown'
                }
            >
                <Markdown
                    remarkPlugins={inkstreamRemarkPlugins}
                    components={{
                        ...inkstreamDefaultComponents,
                        ...components,
                    }}
                >
                    {normalizeInkstreamMarkdown(children)}
                </Markdown>
            </div>
        </HeadingIdContext.Provider>
    );
}
