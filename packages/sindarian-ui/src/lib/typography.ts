/**
 * THE canonical quiet-label voice: the recessive uppercase-tracked small-caps
 * label that lets the loud mono figures dominate. Used by panel headings,
 * column heads, key/value labels, captions — anywhere the console needs a
 * quiet label.
 *
 * Do NOT re-state the cluster by hand; compose extra classes via
 * `cn(LABEL_VOICE_CLASS, ...)`.
 */
export const LABEL_VOICE_CLASS =
  'text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground'

/**
 * Alias of {@link LABEL_VOICE_CLASS} for section headings. Kept as a distinct
 * name so section-level headings can diverge later without touching every
 * quiet-label call site.
 */
export const SECTION_LABEL_CLASS = LABEL_VOICE_CLASS
