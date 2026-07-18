import assert from 'node:assert/strict';
import test from 'node:test';
import { parseChartFence } from '../src/parse-chart-fence.js';

test('parses bar chart data points', () => {
    const chart = parseChartFence('bar', 'A: 10\nB: 20\nC: -5');

    assert.deepEqual(chart, {
        type: 'bar',
        data: [
            { label: 'A', value: 10 },
            { label: 'B', value: 20 },
            { label: 'C', value: -5 },
        ],
    });
});

test('parses reserved _title/_min/_max lines', () => {
    const chart = parseChartFence(
        'radar',
        '_title: 得点分布\n_min: 0\n_max: 100\n国語: 80\n数学: 65',
    );

    assert.deepEqual(chart, {
        type: 'radar',
        title: '得点分布',
        min: 0,
        max: 100,
        data: [
            { label: '国語', value: 80 },
            { label: '数学', value: 65 },
        ],
    });
});

test('returns null when there are no data points', () => {
    assert.equal(parseChartFence('bar', '_title: 空っぽ'), null);
});
