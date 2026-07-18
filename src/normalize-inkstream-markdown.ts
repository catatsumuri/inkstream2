import { normalizeMintlifyBlocks } from './normalize-mintlify-blocks.js';
import { normalizeZennDirectiveShorthand } from './normalize-zenn-directive-shorthand.js';
import { normalizeZennImages } from './zenn-images.js';

/**
 * Runs the full string-level preprocessing chain in the order the remark
 * pipeline expects: Mintlify block normalization first (so tag bodies are
 * dedented before shorthand scanning), then Zenn directive shorthand, then
 * Zenn image size/caption encoding. Consumers should call this instead of
 * composing the individual normalizers themselves.
 */
export function normalizeInkstreamMarkdown(markdown: string): string {
    return normalizeZennImages(
        normalizeZennDirectiveShorthand(normalizeMintlifyBlocks(markdown)),
    );
}
