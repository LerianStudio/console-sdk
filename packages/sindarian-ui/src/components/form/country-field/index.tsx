import { CommandItem } from '@/components/ui/command'
import { FieldValues } from 'react-hook-form'
import { ComboBoxField, ComboBoxFieldProps } from '../combo-box-field'
import { getCountries } from '@/utils/country-utils'

export type CountryFieldProps<T extends FieldValues = FieldValues> = Omit<
  ComboBoxFieldProps<T>,
  'children'
>

export const CountryField = <T extends FieldValues = FieldValues>({
  ...others
}: CountryFieldProps<T>) => {
  return (
    <ComboBoxField {...others}>
      {getCountries().map((country) => (
        <CommandItem key={country.code} value={country.code}>
          {country.name}
        </CommandItem>
      ))}
    </ComboBoxField>
  )
}
