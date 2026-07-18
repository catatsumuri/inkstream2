import { toHtml } from 'hast-util-to-html';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { normalizeInkstreamMarkdown } from '../src/normalize-inkstream-markdown.js';
import { inkstreamRemarkPlugins } from '../src/remark-plugins.js';

const processor = unified()
    .use(remarkParse)
    .use(inkstreamRemarkPlugins)
    .use(remarkRehype, { allowDangerousHtml: true });

export interface RenderV2Result {
    html: string;
    warnings: string[];
}

export function renderV2(markdown: string): RenderV2Result {
    const file = new VFile(normalizeInkstreamMarkdown(markdown));
    const mdast = processor.parse(file);
    const hast = processor.runSync(mdast, file);

    return {
        html: toHtml(hast as Parameters<typeof toHtml>[0]),
        warnings: file.messages.map((m) => m.reason),
    };
}
