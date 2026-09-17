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
function truncateMiddle(id: string, head: number, tail: number): string {
  // No ellipsis unless it actually saves characters: at head + tail + 1 the
  // truncation is the same length as the id and hides a character for nothing.
  return id.length <= head + tail + 1
    ? id
    : `${id.slice(0, head)}…${id.slice(id.length - tail)}`
}

export const IdTableCell = ({
  id,
  onCopy,
  head = 8,
  tail = 4,
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
