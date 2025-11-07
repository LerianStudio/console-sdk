import { Button } from '../ui/button'
import type { UsePaginationReturn } from '@/hooks/use-pagination'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type PaginationProps = UsePaginationReturn & {
  previousLabel?: string
  nextLabel?: string
  total?: number
}

export const Pagination = ({
  page,
  limit,
  total = 0,
  previousLabel,
  nextLabel,
  nextPage,
  previousPage
}: PaginationProps) => {
  return (
    <div className="flex items-center justify-end space-x-2">
      <Button
        variant="outline"
        size="small"
        onClick={previousPage}
        disabled={page <= 1}
        icon={<ChevronLeft size={16} />}
        iconPlacement="start"
      >
        {previousLabel}
      </Button>

      <Button
        variant="outline"
        size="small"
        onClick={nextPage}
        disabled={total < limit}
        icon={<ChevronRight size={16} />}
        iconPlacement="end"
      >
        {nextLabel}
      </Button>
    </div>
  )
}
