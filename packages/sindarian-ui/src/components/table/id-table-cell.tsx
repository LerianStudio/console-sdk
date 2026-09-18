import {
  TableCell,
  TableCellAction,
  TableCellWrapper
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Copy } from 'lucide-react'

export type IdTableCellProps = Omit<
  React.ComponentProps<typeof TableCell>,
  'onCopy'
> & {
  id?: string
  onCopy?: (id: string) => void
  /** Characters kept from the start of the id. */
  head?: number
  /** Characters kept from the end of the id. */
  tail?: number
}

/**
 * ⛔ TRUNCATE IN THE MIDDLE, NEVER FROM THE START.
 *
 * This cell renders UUIDs, and a ledger hands out long runs of them from a
 * shared prefix — `00000000-0000-0000-0000-00000000000{1,2,3}`. Keeping the
 * first 13 characters, which is what `truncate(id, { length: 16 })` did,
 * rendered every one of those rows as the same string: the only part that told
 * them apart was the part that was dropped, and the reader had to hover each
 * row in turn to find the one they wanted.
 *
 * Both ends carry information — the head says which family the id belongs to,
 * the tail says which member — so both ends stay.
 */
const DEFAULT_HEAD = 8
const DEFAULT_TAIL = 4

/**
 * ⛔ A BAD LENGTH CANNOT THROW HERE. This runs in a render path, so refusing a
 * malformed prop would unmount the whole table rather than one cell — a
 * consumer computing `head` from data gets a broken cell, not a broken screen.
 *
 * `String.slice` reads a negative number as an offset from the END, so a
 * negative `head` kept nearly the entire id and put an ellipsis in the middle
 * of it, and `NaN` read as 0 and dropped the head — the exact failure middle
 * truncation exists to prevent, and one character LONGER than the untruncated
 * id. Clamped to a non-negative whole number; anything non-finite falls back
 * to the default, which a caller passing `NaN` has already bypassed.
 */
function charCount(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : fallback
}

function truncateMiddle(id: string, head: number, tail: number): string {
  const start = charCount(head, DEFAULT_HEAD)
  const end = charCount(tail, DEFAULT_TAIL)

  // No ellipsis unless it actually saves characters: at head + tail + 1 the
  // truncation is the same length as the id and hides a character for nothing.
  return id.length <= start + end + 1
    ? id
    : `${id.slice(0, start)}…${id.slice(id.length - end)}`
}

export const IdTableCell = ({
  id,
  onCopy,
  head = DEFAULT_HEAD,
  tail = DEFAULT_TAIL,
  ...others
}: IdTableCellProps) => {
  const handleCopyToClipboard = () => {
    // The WHOLE id, never what is rendered. The cell is the only place most
    // consoles expose it, and a truncated id pasted into a query matches
    // nothing.
    navigator.clipboard.writeText(id!)
    onCopy?.(id!)
  }

  return (
    <TableCell
      onClick={handleCopyToClipboard}
      // The tooltip is the styled affordance; `title` is the fallback that
      // survives without it — a printed page, a portal that has not mounted,
      // and the cell padding outside the trigger.
      title={id}
      {...others}
    >
      <TableCellWrapper>
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger>
              {id ? truncateMiddle(id, head, tail) : id}
            </TooltipTrigger>
            <TooltipContent>{id}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TableCellAction>
          <Copy className="size-3.5" />
        </TableCellAction>
      </TableCellWrapper>
    </TableCell>
  )
}
