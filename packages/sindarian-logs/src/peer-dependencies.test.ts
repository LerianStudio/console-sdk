import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { satisfies } from 'semver'

type Manifest = {
  version: string
  peerDependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const SERVER = '@lerianstudio/sindarian-server'

/**
 * A server version on the 1.x line that consumers still install: product-console
 * resolves sindarian-server 1.3.0 today. Widening these ranges onto the 2.x line
 * must not drop that line, and a bare ">=2.0.0-0" drops every 1.x consumer while
 * keeping the sibling assertions below green.
 */
const SUPPORTED_1X = '1.3.0'

/**
 * A range nothing satisfies, used when the key is absent. semver reads '' as
 * '*', so an absent key would pass every assertion here the moment the server
 * leaves prerelease; this fails them instead.
 */
const UNDECLARED = '<0.0.0-0'

const read = (path: string): Manifest =>
  JSON.parse(readFileSync(join(__dirname, path), 'utf8')) as Manifest

const logs = read('../package.json')
const server = read('../../sindarian-server/package.json')

const rangeFor = (field: 'peerDependencies' | 'devDependencies'): string =>
  logs[field]?.[SERVER] ?? UNDECLARED

// A prerelease only satisfies a range that carries a comparator on its own
// major.minor.patch, so ">=1.0.0-beta.27" alone rejects every beta of a later
// line. Each new beta line of the server needs its own clause in both ranges,
// or a console pinning that beta gets "Conflicting peer dependency" on a clean
// install and this package builds against a published copy instead of the
// sibling in this repo.
describe(`${SERVER} ranges`, () => {
  it('declares the server in both ranges', () => {
    expect(logs.peerDependencies?.[SERVER]).toEqual(expect.any(String))
    expect(logs.devDependencies?.[SERVER]).toEqual(expect.any(String))
  })

  it('accepts the sibling version this monorepo publishes', () => {
    expect(satisfies(server.version, rangeFor('peerDependencies'))).toBe(true)
  })

  it('links the sibling for development instead of a published copy', () => {
    expect(satisfies(server.version, rangeFor('devDependencies'))).toBe(true)
  })

  it('keeps the 1.x server line consumers still install', () => {
    expect(satisfies(SUPPORTED_1X, rangeFor('peerDependencies'))).toBe(true)
  })
})
