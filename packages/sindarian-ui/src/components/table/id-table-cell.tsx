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
import { truncate } from 'lodash'
import { Copy } from 'lucide-react'

export type IdTableCellProps = {
  id?: string
  onCopy?: (id: string) => void
}

export const IdTableCell = ({ id, onCopy }: IdTableCellProps) => {
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(id!)
    onCopy?.(id!)
  }

  return (
    <TableCell onClick={handleCopyToClipboard}>
      <TableCellWrapper>
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger>{truncate(id, { length: 16 })}</TooltipTrigger>
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
