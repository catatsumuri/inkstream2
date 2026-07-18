export type ChartType = 'bar' | 'radar';

export interface ChartDataPoint {
    label: string;
    value: number;
}

export interface ChartConfig {
    type: ChartType;
    title?: string;
    min?: number;
    max?: number;
    data: ChartDataPoint[];
}

/**
 * Parses `_title:` / `_min:` / `_max:` / `label: value` lines into a chart
 * config, or null if no data points were found. Ported from inkstream v1's
 * `parseChartContent`.
 */
export function parseChartFence(
    type: ChartType,
    content: string,
): ChartConfig | null {
    const config: { title?: string; min?: number; max?: number } = {};
    const data: ChartDataPoint[] = [];

    for (const line of content.split('\n')) {
        const trimmed = line.trim();

        if (!trimmed) {
            continue;
        }

        const reservedMatch = /^_(?<key>title|max|min):\s*(?<value>.+)$/.exec(
            trimmed,
        );

        if (reservedMatch?.groups?.key) {
            const { key, value } = reservedMatch.groups;

            if (key === 'title') {
                config.title = value.trim();
            } else if (key === 'max') {
                const n = Number(value);

                if (!isNaN(n)) {
                    config.max = n;
                }
            } else if (key === 'min') {
                const n = Number(value);

                if (!isNaN(n)) {
                    config.min = n;
                }
            }

            continue;
        }

        const dataMatch =
            /^(?<label>[^:]+):\s*(?<value>-?\d+(?:\.\d+)?)\s*$/.exec(trimmed);

        if (dataMatch?.groups?.label) {
            const num = Number(dataMatch.groups.value);

            if (!isNaN(num)) {
                data.push({ label: dataMatch.groups.label.trim(), value: num });
            }
        }
    }

    if (data.length === 0) {
        return null;
    }

    return { type, ...config, data };
}
