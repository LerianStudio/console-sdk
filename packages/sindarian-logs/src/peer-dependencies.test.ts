import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { satisfies } from 'semver'

type Manifest = {
  version: string
  peerDependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const SERVER = '@lerianstudio/sindarian-server'

const read = (path: string): Manifest =>
  JSON.parse(readFileSync(join(__dirname, path), 'utf8')) as Manifest

const logs = read('../package.json')
const server = read('../../sindarian-server/package.json')

// A prerelease only satisfies a range that carries a comparator on its own
// major.minor.patch, so ">=1.0.0-beta.27" alone rejects every beta of a later
// line. Each new beta line of the server needs its own clause in both ranges,
// or a console pinning that beta gets "Conflicting peer dependency" on a clean
// install and this package builds against a published copy instead of the
// sibling in this repo.
describe(`${SERVER} ranges`, () => {
  it('accepts the sibling version this monorepo publishes', () => {
    expect(
      satisfies(server.version, logs.peerDependencies?.[SERVER] ?? '')
    ).toBe(true)
  })

  it('links the sibling for development instead of a published copy', () => {
    expect(
      satisfies(server.version, logs.devDependencies?.[SERVER] ?? '')
    ).toBe(true)
  })
})
