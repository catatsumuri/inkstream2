import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';
import { remarkCodeFenceComponents } from './remark-code-fence-components.js';
import { remarkCodeMeta } from './remark-code-meta.js';
import { remarkGithubAlerts } from './remark-github-alerts.js';
import { remarkMintlifyTags } from './remark-mintlify-tags.js';
import { remarkTreeTags } from './remark-tree-tags.js';
import { remarkZennDirective } from './remark-zenn-directive.js';

/**
 * The full inkstream remark plugin chain, in the order the transforms
 * depend on: GFM and directive parsing first, then Zenn directives,
 * GitHub alerts, Mintlify tag pairing, JSX Tree parsing, and finally
 * code-fence components. Pass this to react-markdown or `unified().use()`
 * instead of assembling the plugins by hand.
 */
export const inkstreamRemarkPlugins: PluggableList = [
    [remarkGfm, { singleTilde: false }],
    remarkDirective,
    remarkZennDirective,
    remarkGithubAlerts,
    remarkMintlifyTags,
    remarkTreeTags,
    remarkCodeFenceComponents,
    remarkCodeMeta,
];
