import { Control, FieldValues } from 'react-hook-form'
import { SelectField } from '../select-field'
import { SelectItem } from '@/components/ui/select'

export type PaginationLimitFieldProps<T extends FieldValues = FieldValues> = {
  label?: string
  options?: number[]
  control: Control<T>
  ['data-testid']?: string
}

export const PaginationLimitField = <T extends FieldValues = FieldValues>({
  options = [10, 50, 100],
  label = 'Items per page',
  control,
  ['data-testid']: dataTestId
}: PaginationLimitFieldProps<T>) => {
  return (
    <div className="flex items-center gap-4">
      <p className="text-muted-foreground text-sm font-medium whitespace-nowrap">
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
