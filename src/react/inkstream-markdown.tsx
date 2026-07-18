import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { normalizeInkstreamMarkdown } from '../normalize-inkstream-markdown.js';
import { inkstreamRemarkPlugins } from '../remark-plugins.js';
import { inkstreamDefaultComponents } from './default-components.js';

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
}: InkstreamMarkdownProps) {
    return (
        <div
            className={
                className ? `ink-markdown ${className}` : 'ink-markdown'
            }
        >
            <Markdown
                remarkPlugins={inkstreamRemarkPlugins}
                components={{ ...inkstreamDefaultComponents, ...components }}
            >
                {normalizeInkstreamMarkdown(children)}
            </Markdown>
        </div>
    );
}
