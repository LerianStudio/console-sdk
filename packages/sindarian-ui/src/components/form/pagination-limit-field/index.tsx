import { Control } from 'react-hook-form'
import { SelectField } from '../select-field'
import { SelectItem } from '@/components/ui/select'

export type PaginationLimitFieldProps = {
  label?: string
  options?: number[]
  control: Control<any>
  ['data-testid']?: string
}

export const PaginationLimitField = ({
  options = [10, 50, 100],
  label = 'Items per page',
  control,
  ['data-testid']: dataTestId
}: PaginationLimitFieldProps) => {
  return (
    <div className="flex items-center gap-4">
      <p className="text-muted-foreground whitespace-nowrap text-sm font-medium">
        {label}
      </p>
      <SelectField name="limit" control={control} data-testid={dataTestId}>
        {options.map((pageSize: number) => (
          <SelectItem key={pageSize} value={String(pageSize)}>
            {pageSize}
          </SelectItem>
        ))}
      </SelectField>
    </div>
  )
}
