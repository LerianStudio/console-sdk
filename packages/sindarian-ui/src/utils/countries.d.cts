/** Shape of `src/public/countries.json`, loaded by `countries.cjs`. */
type RawCountry = {
  code2: string
  code3: string
  name: string
  capital: string
  region: string
  subregion: string
  states: { code: string; name: string; subdivision: string | null }[]
}

declare const countries: RawCountry[]

export = countries
