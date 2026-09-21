import { IdTableCell, LockedTableActions, NameTableCell } from '@/index'

/**
 * TABLE CELLS THE PACKAGE SHIPS BUT A CONSUMER CANNOT IMPORT.
 *
 * `LockedTableActions` was built and never reached the barrel: unreachable
 * from `@lerianstudio/sindarian-ui`, which is half the reason Product Console
 * kept a local copy of it rather than a wrapper. `IdTableCell` and
 * `NameTableCell` are the same class of promise — the console deletes its
 * forks of all three against this entry point.
 *
 * Every one of them has its own co-located suite, and each of those imports
 * the component by relative path, so dropping a line from
 * `components/table/index.tsx` leaves the whole package green while the
 * component goes unreachable again. This case is the only thing that notices,
 * so it asserts the PUBLIC surface: the package's own entry point, the file
 * the build turns into `dist/index.js`.
 */
const PUBLISHED_TABLE_CELLS = [
  ['IdTableCell', IdTableCell],
  ['LockedTableActions', LockedTableActions],
  ['NameTableCell', NameTableCell]
] as const

describe('table cells published from the package entry point', () => {
  it.each(PUBLISHED_TABLE_CELLS)('exports %s', (_name, component) => {
    expect(typeof component).toBe('function')
  })
})
