import { CircleCheck, CircleX } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { Components } from 'react-markdown';
import {
    Bar,
    BarChart,
    CartesianGrid,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
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

function QuizRenderer({ quiz }: InkstreamElementProps) {
    const content = parseJsonProp<QuizContent>(quiz);
    const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
    const [submittedLabel, setSubmittedLabel] = useState<string | null>(null);

    if (!content) {
        return null;
    }

    const selectedOption = content.options.find(
        (option) => option.label === selectedLabel,
    );
    const submittedOption = content.options.find(
        (option) => option.label === submittedLabel,
    );
    const isSubmitted = submittedLabel !== null;
    const isCorrect = submittedLabel === content.correct;
    const statusLabel = isCorrect
        ? (content.correctMessage ?? 'Correct')
        : (content.incorrect ?? 'Not Quite');

    return (
        <div className="ink-quiz">
            <p className="ink-quiz-question">{content.question}</p>

            {isSubmitted && submittedOption ? (
                <div className="ink-quiz-result">
                    <span className="ink-quiz-result-label">
                        {submittedOption.label}
                    </span>
                    <p className="ink-quiz-result-text">
                        {submittedOption.text}
                    </p>
                    <p
                        className={classNames(
                            'ink-quiz-status',
                            isCorrect
                                ? 'ink-quiz-status-correct'
                                : 'ink-quiz-status-incorrect',
                        )}
                    >
                        {isCorrect ? (
                            <CircleCheck className="ink-quiz-status-icon" />
                        ) : (
                            <CircleX className="ink-quiz-status-icon" />
                        )}
                        {statusLabel}
                    </p>
                    {!isCorrect && content.hint && (
                        <p className="ink-quiz-hint">Hint: {content.hint}</p>
                    )}
                    {isCorrect && content.explanation && (
                        <p className="ink-quiz-explanation">
                            {content.explanation}
                        </p>
                    )}
                    <button
                        type="button"
                        className="ink-quiz-retry"
                        onClick={() => {
                            setSelectedLabel(null);
                            setSubmittedLabel(null);
                        }}
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div className="ink-quiz-form">
                    <ul className="ink-quiz-options">
                        {content.options.map((option) => (
                            <li key={option.label}>
                                <button
                                    type="button"
                                    className={classNames(
                                        'ink-quiz-option',
                                        selectedLabel === option.label &&
                                            'ink-quiz-option-selected',
                                    )}
                                    onClick={() =>
                                        setSelectedLabel(option.label)
                                    }
                                >
                                    <span className="ink-quiz-option-label">
                                        {option.label}
                                    </span>
                                    <span className="ink-quiz-option-text">
                                        {option.text}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        className="ink-quiz-submit"
                        disabled={!selectedOption}
                        onClick={() =>
                            selectedOption &&
                            setSubmittedLabel(selectedOption.label)
                        }
                    >
                        Check Answer
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Tracks whether the `dark` class is present on the document root, so the
 * chart renderer can pick colors that work in both themes. recharts takes
 * its colors as props rather than CSS, so this can't be handled by the
 * `ink-*` stylesheet alone.
 */
function useIsDarkMode(): boolean {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const update = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };

        update();

        const observer = new MutationObserver(update);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    return isDark;
}

function getChartDomain(config: ChartConfig): [number, number] {
    const min = config.min ?? 0;
    const max =
        config.max ?? Math.max(...config.data.map((point) => point.value));

    if (max <= min) {
        return [min, min + 1];
    }

    return [min, max];
}

function ChartRenderer({ chart }: InkstreamElementProps) {
    const config = parseJsonProp<ChartConfig>(chart);
    const isDark = useIsDarkMode();

    if (!config) {
        return null;
    }

    const gridColor = isDark ? '#374151' : '#e5e7eb';
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const fillColor = isDark ? '#818cf8' : '#4f46e5';
    const strokeColor = isDark ? '#6366f1' : '#4338ca';
    const tooltipStyle = {
        background: isDark ? '#111827' : '#ffffff',
        border: `1px solid ${gridColor}`,
        borderRadius: '8px',
        fontSize: '12px',
        color: textColor,
    };
    const [domainMin, domainMax] = getChartDomain(config);

    return (
        <div className="ink-chart">
            {config.title && (
                <p className="ink-chart-title">{config.title}</p>
            )}
            {config.type === 'bar' ? (
                <ResponsiveContainer
                    width="100%"
                    height={config.data.length * 44 + 60}
                >
                    <BarChart
                        layout="vertical"
                        data={config.data}
                        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            stroke={gridColor}
                        />
                        <XAxis
                            type="number"
                            domain={[domainMin, domainMax]}
                            tick={{ fill: textColor, fontSize: 12 }}
                            axisLine={{ stroke: gridColor }}
                            tickLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            width={96}
                            tick={{ fill: textColor, fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: isDark ? '#1f2937' : '#f3f4f6' }}
                            contentStyle={tooltipStyle}
                        />
                        <Bar
                            dataKey="value"
                            fill={fillColor}
                            radius={[0, 4, 4, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <ResponsiveContainer width="100%" height={340}>
                    <RadarChart data={config.data}>
                        <PolarGrid stroke={gridColor} />
                        <PolarAngleAxis
                            dataKey="label"
                            tick={{ fill: textColor, fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                            domain={[domainMin, domainMax]}
                            tick={{ fill: textColor, fontSize: 10 }}
                            axisLine={false}
                        />
                        <Radar
                            dataKey="value"
                            stroke={strokeColor}
                            fill={fillColor}
                            fillOpacity={0.35}
                        />
                        <Tooltip contentStyle={tooltipStyle} />
                    </RadarChart>
                </ResponsiveContainer>
            )}
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
    quiz: QuizRenderer,
    chart: ChartRenderer,
} as unknown as Components;
