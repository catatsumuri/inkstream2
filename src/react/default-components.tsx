import type { ReactNode } from 'react';
import type { Components } from 'react-markdown';
import type { ChartConfig } from '../parse-chart-fence.js';
import type { QuizContent } from '../parse-quiz-fence.js';
import type { TreeNode } from '../parse-tree-fence.js';
import { parseImageMetadata } from '../zenn-images.js';

/**
 * Props react-markdown passes to the custom elements emitted by the
 * inkstream remark plugins (aside, card, steps, tree, quiz, chart, ...).
 * All attribute values arrive as strings because they travel through
 * hProperties.
 */
export interface InkstreamElementProps {
    children?: ReactNode;
    className?: string;
    title?: string;
    href?: string;
    cols?: string;
    color?: string;
    tip?: string;
    tree?: string;
    quiz?: string;
    chart?: string;
    label?: string;
    description?: string;
    tags?: string;
    name?: string;
    type?: string;
    required?: string;
    deprecated?: string;
    default?: string;
    path?: string;
    query?: string;
    body?: string;
}

function classNames(...tokens: (string | false | undefined)[]): string {
    return tokens.filter(Boolean).join(' ');
}

function parseJsonProp<T>(value: string | undefined): T | null {
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
}

function TreeNodeItem({ node }: { node: TreeNode }) {
    if (node.type === 'file') {
        return <li className="ink-tree-file">{node.name}</li>;
    }

    return (
        <li className="ink-tree-folder">
            <details open={node.defaultOpen}>
                <summary className="ink-tree-folder-name">{node.name}</summary>
                <ul className="ink-tree-children">
                    {(node.children ?? []).map((child, index) => (
                        <TreeNodeItem key={index} node={child} />
                    ))}
                </ul>
            </details>
        </li>
    );
}

function ApiField({
    name,
    type,
    required,
    deprecated,
    location,
    children,
}: InkstreamElementProps & { location?: 'path' | 'query' | 'body' }) {
    return (
        <div className="ink-api-field">
            <p className="ink-api-field-head">
                <span className="ink-api-field-name">{name}</span>
                {location && (
                    <span className="ink-api-field-location">{location}</span>
                )}
                {type && <span className="ink-api-field-type">{type}</span>}
                {required === 'true' && (
                    <span className="ink-api-field-required">required</span>
                )}
                {deprecated === 'true' && (
                    <span className="ink-api-field-deprecated">deprecated</span>
                )}
            </p>
            <div className="ink-api-field-body">{children}</div>
        </div>
    );
}

/**
 * Default renderers for every custom element the inkstream remark plugins
 * emit. They carry stable `ink-*` class names and no visual opinions, so
 * consumers style them with plain CSS (or replace individual renderers via
 * the `components` prop of InkstreamMarkdown). The tag names are not part
 * of react-markdown's Components type, hence the cast at the end.
 */
export const inkstreamDefaultComponents = {
    aside: ({ className, children }: InkstreamElementProps) => {
        const variant =
            className?.split(' ').find((token) => token !== 'msg') ?? 'info';

        return (
            <aside
                className={classNames('ink-callout', `ink-callout-${variant}`)}
            >
                {children}
            </aside>
        );
    },
    card: ({ title, href, children }: InkstreamElementProps) => {
        const body = (
            <div className="ink-card">
                {title && <p className="ink-card-title">{title}</p>}
                {children}
            </div>
        );

        return href ? (
            <a href={href} className="ink-card-link">
                {body}
            </a>
        ) : (
            body
        );
    },
    cardgroup: ({ cols, children }: InkstreamElementProps) => (
        <div className="ink-card-group" data-cols={cols}>
            {children}
        </div>
    ),
    steps: ({ children }: InkstreamElementProps) => (
        <ol className="ink-steps">{children}</ol>
    ),
    step: ({ title, children }: InkstreamElementProps) => (
        <li className="ink-step">
            {title && <p className="ink-step-title">{title}</p>}
            {children}
        </li>
    ),
    tabs: ({ children }: InkstreamElementProps) => (
        <div className="ink-tabs">{children}</div>
    ),
    tab: ({ title, children }: InkstreamElementProps) => (
        <section className="ink-tab">
            {title && <p className="ink-tab-title">{title}</p>}
            {children}
        </section>
    ),
    accordiongroup: ({ children }: InkstreamElementProps) => (
        <div className="ink-accordion-group">{children}</div>
    ),
    accordion: ({ title, children }: InkstreamElementProps) => (
        <details className="ink-accordion">
            <summary className="ink-accordion-title">
                {title ?? 'Details'}
            </summary>
            <div className="ink-accordion-body">{children}</div>
        </details>
    ),
    badge: ({ color, children }: InkstreamElementProps) => (
        <span
            className={classNames(
                'ink-badge',
                Boolean(color) && `ink-badge-${color}`,
            )}
        >
            {children}
        </span>
    ),
    tooltip: ({ tip, children }: InkstreamElementProps) => (
        <span className="ink-tooltip" title={tip}>
            {children}
        </span>
    ),
    img: ({ src, alt }: { src?: string; alt?: string }) => {
        const {
            src: cleanSrc,
            width,
            height,
            caption,
        } = parseImageMetadata(src);

        const image = (
            <img
                src={cleanSrc}
                alt={alt ?? ''}
                width={width}
                height={height}
                className="ink-image"
            />
        );

        if (!caption) {
            return image;
        }

        return (
            <span className="ink-figure">
                {image}
                <span className="ink-figure-caption">{caption}</span>
            </span>
        );
    },
    update: ({ label, description, tags, children }: InkstreamElementProps) => (
        <section className="ink-update">
            <div className="ink-update-meta">
                {label && <p className="ink-update-label">{label}</p>}
                {description && (
                    <p className="ink-update-description">{description}</p>
                )}
                {tags && (
                    <p className="ink-update-tags">
                        {tags.split(',').map((tag) => (
                            <span key={tag} className="ink-update-tag">
                                {tag}
                            </span>
                        ))}
                    </p>
                )}
            </div>
            <div className="ink-update-body">{children}</div>
        </section>
    ),
    codegroup: ({ children }: InkstreamElementProps) => (
        <div className="ink-code-group">{children}</div>
    ),
    responsefield: (props: InkstreamElementProps) => <ApiField {...props} />,
    paramfield: (props: InkstreamElementProps) => {
        const location = props.path
            ? (['path', props.path] as const)
            : props.query
              ? (['query', props.query] as const)
              : props.body
                ? (['body', props.body] as const)
                : undefined;

        return (
            <ApiField
                {...props}
                name={location ? location[1] : props.name}
                location={location?.[0]}
            />
        );
    },
    tree: ({ tree }: InkstreamElementProps) => {
        const nodes = parseJsonProp<TreeNode[]>(tree);

        if (!nodes) {
            return null;
        }

        return (
            <ul className="ink-tree">
                {nodes.map((node, index) => (
                    <TreeNodeItem key={index} node={node} />
                ))}
            </ul>
        );
    },
    quiz: ({ quiz }: InkstreamElementProps) => {
        const content = parseJsonProp<QuizContent>(quiz);

        if (!content) {
            return null;
        }

        return (
            <div className="ink-quiz">
                <p className="ink-quiz-question">{content.question}</p>
                <ul className="ink-quiz-options">
                    {content.options.map((option) => (
                        <li
                            key={option.label}
                            className={classNames(
                                'ink-quiz-option',
                                option.label === content.correct &&
                                    'ink-quiz-option-correct',
                            )}
                        >
                            <span className="ink-quiz-option-label">
                                {option.label}.
                            </span>{' '}
                            {option.text}
                        </li>
                    ))}
                </ul>
                {content.explanation && (
                    <p className="ink-quiz-explanation">
                        {content.explanation}
                    </p>
                )}
            </div>
        );
    },
    chart: ({ chart }: InkstreamElementProps) => {
        const config = parseJsonProp<ChartConfig>(chart);

        if (!config) {
            return null;
        }

        const min = config.min ?? 0;
        const max =
            config.max ?? Math.max(...config.data.map((point) => point.value));
        const domain = Math.max(max - min, 1);

        return (
            <div className="ink-chart">
                {config.title && (
                    <p className="ink-chart-title">{config.title}</p>
                )}
                <div className="ink-chart-rows">
                    {config.data.map((point) => (
                        <div key={point.label} className="ink-chart-row">
                            <span className="ink-chart-label">
                                {point.label}
                            </span>
                            <span className="ink-chart-track">
                                <span
                                    className="ink-chart-bar"
                                    style={{
                                        width: `${((point.value - min) / domain) * 100}%`,
                                    }}
                                />
                            </span>
                            <span className="ink-chart-value">
                                {point.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    },
} as unknown as Components;
