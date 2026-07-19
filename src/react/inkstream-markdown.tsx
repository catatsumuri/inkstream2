import { useMemo } from 'react';
import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { PluggableList } from 'unified';
import { createHeadingIdDispenser } from '../heading-id-dispenser.js';
import { normalizeInkstreamMarkdown } from '../normalize-inkstream-markdown.js';
import { inkstreamRemarkPlugins } from '../remark-plugins.js';
import { remarkWikilinks, type ResolveWikilink } from '../remark-wikilinks.js';
import { inkstreamDefaultComponents } from './default-components.js';
import { OgpEndpointContext } from './embed-components.js';
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
    /**
     * Endpoint the default link-card renderer fetches OGP metadata from,
     * as `GET {ogpEndpoint}?url=...` returning `{title, description,
     * image}` JSON. When omitted, standalone-URL cards render a URL-only
     * fallback instead of rich metadata.
     */
    ogpEndpoint?: string;
    /**
     * Resolves `[[full_path]]` / `[[full_path|label]]` wikilink syntax to a
     * URL. Omit to leave `[[...]]` as literal text — resolution needs
     * app-specific routing/lookup knowledge (e.g. matching a document by
     * title), so there is no default.
     */
    resolveWikilink?: ResolveWikilink;
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
    ogpEndpoint,
    resolveWikilink,
}: InkstreamMarkdownProps) {
    // A fresh dispenser per render pass keeps duplicate-heading numbering
    // deterministic across re-renders.
    const dispenseHeadingId = createHeadingIdDispenser();

    // remarkWikilinks is only added when a resolver is supplied, appended
    // after remarkLinkifyToCard so a lone `[[path]]` paragraph is never
    // mistaken for a standalone-URL embed.
    const remarkPlugins: PluggableList = useMemo(
        () =>
            resolveWikilink
                ? [...inkstreamRemarkPlugins, [remarkWikilinks, resolveWikilink]]
                : inkstreamRemarkPlugins,
        [resolveWikilink],
    );

    return (
        <HeadingIdContext.Provider
            value={{ dispense: dispenseHeadingId, prefix: headingIdPrefix }}
        >
            <OgpEndpointContext.Provider value={ogpEndpoint}>
                <div
                    className={
                        className ? `ink-markdown ${className}` : 'ink-markdown'
                    }
                >
                    <Markdown
                        remarkPlugins={remarkPlugins}
                        components={{
                            ...inkstreamDefaultComponents,
                            ...components,
                        }}
                    >
                        {normalizeInkstreamMarkdown(children)}
                    </Markdown>
                </div>
            </OgpEndpointContext.Provider>
        </HeadingIdContext.Provider>
    );
}
