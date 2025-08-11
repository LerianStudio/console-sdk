import countriesJson from '../public/countries.json'

export type CountryType = {
  code: string
  name: string
  states: StateType[]
}

export type StateType = {
  name: string
  code: string
}

const getCountries = () => {
  return countriesJson.map((country: any) => ({
    code: country.code2,
    name: country.name,
    states: country.states.map(
      (state: StateType): StateType => ({
        name: state.name,
        code: state.code
      })
    )
  }))
}

const getStateCountry = (country: string): StateType[] => {
  const selectedCountry = getCountries().find(
    (countryItem: CountryType) =>
      countryItem.code === country || countryItem.name === country
  )

  if (!selectedCountry) return [] as StateType[]

  return selectedCountry.states || ([] as StateType[])
}

export { getCountries, getStateCountry }
