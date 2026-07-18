import { toHtml } from 'hast-util-to-html';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { normalizeMintlifyBlocks } from '../src/normalize-mintlify-blocks.js';
import { remarkCodeFenceComponents } from '../src/remark-code-fence-components.js';
import { remarkMintlifyTags } from '../src/remark-mintlify-tags.js';

const processor = unified()
    .use(remarkParse)
    .use(remarkGfm, { singleTilde: false })
    .use(remarkMintlifyTags)
    .use(remarkCodeFenceComponents)
    .use(remarkRehype, { allowDangerousHtml: true });

export interface RenderV2Result {
    html: string;
    warnings: string[];
}

export function renderV2(markdown: string): RenderV2Result {
    const file = new VFile(normalizeMintlifyBlocks(markdown));
    const mdast = processor.parse(file);
    const hast = processor.runSync(mdast, file);

    return {
        html: toHtml(hast as Parameters<typeof toHtml>[0]),
        warnings: file.messages.map((m) => m.reason),
    };
}
