/**
 * THE canonical quiet-label voice: sentence-case, one step down in size,
 * medium weight, muted ink. Used by column heads, panel headings, key/value
 * labels, captions — anywhere the console needs a quiet label.
 *
 * This is product-console's table-head voice, copied rather than invented. The
 * kit's own `TableHead` paints `text-muted-foreground … font-medium` inside a
 * `text-sm` `Table` (`components/ui/table/index.tsx:20,90`), and
 * product-console renders every data table through that primitive
 * (`src/components/table/data-table.tsx:14`). It replaced the retired "Ledger"
 * voice — `text-[11px] uppercase tracking-[0.08em]` — which shouted a register
 * no sibling console speaks.
 *
 * Do NOT re-state the cluster by hand; compose extra classes via
 * `cn(LABEL_VOICE_CLASS, ...)`.
 */
export const LABEL_VOICE_CLASS = 'text-sm font-medium text-muted-foreground'

/**
 * Alias of {@link LABEL_VOICE_CLASS} for section headings. Kept as a distinct
 * name so section-level headings can diverge later without touching every
 * quiet-label call site.
 *
 * It stays an alias on purpose. product-console's panel/section TITLE voice is
 * `text-muted-foreground text-lg font-medium` (`EntityBoxHeaderTitle`,
 * `components/entity-box/index.tsx:108`) — but that voice already ships as a
 * component, and every live `SectionLabel` call site is a caption or a small
 * heading (a stat-card label, an inline rate label), not an EntityBox-scale
 * panel title. Promoting this constant to `text-lg` would duplicate a voice the
 * kit already owns and inflate those captions.
 */
export const SECTION_LABEL_CLASS = LABEL_VOICE_CLASS
