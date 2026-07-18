import { toHtml } from 'hast-util-to-html';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { normalizeMintlifyBlocks } from '../src/normalize-mintlify-blocks.js';
import { normalizeZennDirectiveShorthand } from '../src/normalize-zenn-directive-shorthand.js';
import { remarkCodeFenceComponents } from '../src/remark-code-fence-components.js';
import { remarkGithubAlerts } from '../src/remark-github-alerts.js';
import { remarkMintlifyTags } from '../src/remark-mintlify-tags.js';
import { remarkTreeTags } from '../src/remark-tree-tags.js';
import { remarkZennDirective } from '../src/remark-zenn-directive.js';
import { normalizeZennImages } from '../src/zenn-images.js';

const processor = unified()
    .use(remarkParse)
    .use(remarkGfm, { singleTilde: false })
    .use(remarkDirective)
    .use(remarkZennDirective)
    .use(remarkGithubAlerts)
    .use(remarkMintlifyTags)
    .use(remarkTreeTags)
    .use(remarkCodeFenceComponents)
    .use(remarkRehype, { allowDangerousHtml: true });

export interface RenderV2Result {
    html: string;
    warnings: string[];
}

export function renderV2(markdown: string): RenderV2Result {
    const file = new VFile(
        normalizeZennImages(
            normalizeZennDirectiveShorthand(normalizeMintlifyBlocks(markdown)),
        ),
    );
    const mdast = processor.parse(file);
    const hast = processor.runSync(mdast, file);

    return {
        html: toHtml(hast as Parameters<typeof toHtml>[0]),
        warnings: file.messages.map((m) => m.reason),
    };
}
