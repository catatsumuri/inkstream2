/**
 * Syntax surface shared with inkstream v1.
 *
 * Tag names and attribute names mirror the frozen v1 manifest
 * (inkstream/src/syntax/markdown-syntax-manifest.ts). Additions are safe;
 * renames and removals are breaking for published content.
 */
export const MINTLIFY_CALLOUT_VARIANTS = {
    Note: 'note',
    Tip: 'tip',
    Info: 'info',
    Warning: 'alert',
    Check: 'check',
} as const;

export const MINTLIFY_CALLOUT_TAG_NAMES = Object.keys(
    MINTLIFY_CALLOUT_VARIANTS,
) as (keyof typeof MINTLIFY_CALLOUT_VARIANTS)[];

export const MINTLIFY_BLOCK_TAG_NAMES = [
    'Card',
    'CardGroup',
    'Columns',
    'Tabs',
    'Tab',
    'Accordion',
    'AccordionGroup',
    'Steps',
    'Step',
    'ResponseField',
    'ParamField',
    'CodeGroup',
    'Update',
    'Tree',
    ...MINTLIFY_CALLOUT_TAG_NAMES,
] as const;

export const MINTLIFY_INLINE_TAG_NAMES = ['Badge', 'Tooltip'] as const;

/**
 * GitHub blockquote alert markers (`> [!NOTE]` etc.) mapped onto the same
 * callout variants the Mintlify tags and `:::message` produce. WARNING and
 * CAUTION intentionally share the strongest variant, mirroring v1.
 */
export const GITHUB_ALERT_VARIANTS = {
    NOTE: 'note',
    TIP: 'tip',
    IMPORTANT: 'info',
    WARNING: 'alert',
    CAUTION: 'alert',
} as const;

export const MINTLIFY_ATTRIBUTE_NAMES = [
    'title',
    'icon',
    'sync',
    'borderBottom',
    'href',
    'cols',
    'name',
    'type',
    'required',
    'default',
    'deprecated',
    'path',
    'query',
    'body',
    'color',
    'size',
    'shape',
    'stroke',
    'disabled',
    'tip',
    'headline',
    'cta',
    'label',
    'description',
    'tags',
] as const;
