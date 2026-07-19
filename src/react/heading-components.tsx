import { Link as LinkIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Children,
    createContext,
    isValidElement,
    useContext,
    useRef,
} from 'react';
import type { Components } from 'react-markdown';
import type { HeadingIdDispenser } from '../heading-id-dispenser.js';
import { slugify } from '../slugify.js';

export interface HeadingIdContextValue {
    dispense: HeadingIdDispenser;
    prefix?: string;
}

/**
 * Provides the per-document id dispenser (and optional id prefix) to the
 * heading renderers. InkstreamMarkdown supplies it; without a provider the
 * renderers fall back to un-deduplicated base ids.
 */
export const HeadingIdContext = createContext<HeadingIdContextValue | null>(
    null,
);

/**
 * Collects the plain text of a rendered heading's children, descending
 * through inline elements and using image alt text, so the slug matches
 * what extractMarkdownHeadings computes from the markdown source.
 */
export function extractRenderedHeadingText(node: ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }

    if (typeof node === 'boolean' || node === null || node === undefined) {
        return '';
    }

    if (Array.isArray(node)) {
        return node.map(extractRenderedHeadingText).join('');
    }

    if (!isValidElement<{ children?: ReactNode; alt?: string }>(node)) {
        return '';
    }

    if (
        typeof node.props.alt === 'string' &&
        node.props.children === undefined
    ) {
        return node.props.alt;
    }

    return Children.toArray(node.props.children)
        .map(extractRenderedHeadingText)
        .join('');
}

function copyAnchorUrl(id: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    const url = new URL(window.location.href);
    url.hash = id;

    window.history.replaceState(window.history.state, '', url);

    void navigator.clipboard?.writeText(url.toString());
}

function makeHeadingRenderer(level: 1 | 2 | 3 | 4) {
    return function Heading({ children }: { children?: ReactNode }) {
        const context = useContext(HeadingIdContext);
        // Stable per-instance identity so Strict Mode's double-invoke
        // doesn't increment the shared counter twice for the same heading.
        const selfRef = useRef<object>({});
        const text = extractRenderedHeadingText(children);
        const slug = slugify(text);
        const baseId = context?.prefix ? `${context.prefix}-${slug}` : slug;
        const id = context
            ? context.dispense(baseId, selfRef.current)
            : baseId;
        const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4';

        return (
            <Tag id={id} className="ink-heading">
                {children}
                <a
                    href={`#${encodeURIComponent(id)}`}
                    onClick={() => copyAnchorUrl(id)}
                    aria-label={`Copy link to ${text}`}
                    title="Copy link to this section"
                    className="ink-heading-anchor"
                >
                    <LinkIcon className="ink-heading-anchor-icon" />
                </a>
            </Tag>
        );
    };
}

/**
 * Default renderers for h1–h4: each heading gets a slug-derived id (deep
 * links and tables of contents built from extractMarkdownHeadings resolve
 * to it) and a copy-link anchor. h5/h6 are left to the browser defaults —
 * extractMarkdownHeadings stops at #### too.
 */
export const headingComponents: Pick<Components, 'h1' | 'h2' | 'h3' | 'h4'> = {
    h1: makeHeadingRenderer(1),
    h2: makeHeadingRenderer(2),
    h3: makeHeadingRenderer(3),
    h4: makeHeadingRenderer(4),
};
