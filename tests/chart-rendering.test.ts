import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');

Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    SVGElement: dom.window.SVGElement,
    customElements: dom.window.customElements,
    MutationObserver: dom.window.MutationObserver,
    requestAnimationFrame: (callback: FrameRequestCallback) =>
        setTimeout(() => callback(Date.now()), 0),
    cancelAnimationFrame: (handle: number) => clearTimeout(handle),
});
Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
});
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no layout engine or ResizeObserver; recharts' ResponsiveContainer
// needs one to avoid throwing during measurement.
class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
(dom.window as unknown as { ResizeObserver?: unknown }).ResizeObserver =
    ResizeObserverStub;

// jsdom has no layout engine, so every element measures 0x0; recharts'
// ResponsiveContainer skips rendering its children in that case.
dom.window.HTMLElement.prototype.getBoundingClientRect = () =>
    ({
        width: 400,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 400,
        x: 0,
        y: 0,
        toJSON() {},
    }) as DOMRect;

const { act } = await import('react');
const { createElement } = await import('react');
const { createRoot } = await import('react-dom/client');
const { InkstreamMarkdown } = await import('../src/react/index.js');

function chartMarkdown(type: 'bar' | 'radar'): string {
    return [
        `\`\`\`chart:${type}`,
        '_title: Flavor Profile',
        '_max: 10',
        'juniper: 9',
        'citrus: 4',
        '```',
    ].join('\n');
}

async function renderChart(type: 'bar' | 'radar'): Promise<HTMLElement> {
    const container = dom.window.document.createElement('div');
    dom.window.document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(
            createElement(InkstreamMarkdown, { children: chartMarkdown(type) }),
        );
    });

    return container;
}

test('chart:bar renders a recharts bar chart', async () => {
    const container = await renderChart('bar');

    assert.ok(container.querySelector('.ink-chart'));
    assert.ok(
        container.querySelector('.recharts-bar'),
        'expected a .recharts-bar element',
    );
    assert.equal(container.querySelectorAll('.recharts-radar').length, 0);
});

test('chart:radar renders a recharts radar chart, not a bar chart', async () => {
    const container = await renderChart('radar');

    assert.ok(container.querySelector('.ink-chart'));
    assert.ok(
        container.querySelector('.recharts-radar'),
        'expected a .recharts-radar element',
    );
    assert.equal(container.querySelectorAll('.recharts-bar').length, 0);
});
