import { Control } from 'react-hook-form'
import { SelectField } from '../select-field'
import { SelectItem } from '@/components/ui/select'

export type PaginationLimitFieldProps = {
  label?: string
  options?: number[]
  control: Control<any>
}

export const PaginationLimitField = ({
  options = [10, 50, 100],
  label = 'Items per page',
  control
}: PaginationLimitFieldProps) => {
  return (
    <div className="flex items-center gap-4">
      <p className="text-sm font-medium whitespace-nowrap text-gray-600">
        {label}
      </p>
      <SelectField name="limit" control={control}>
        {options.map((pageSize: number) => (
          <SelectItem key={pageSize} value={String(pageSize)}>
            {pageSize}
          </SelectItem>
        ))}
      </SelectField>
    </div>
  )
}
