import { BreadcrumbPath } from '.'
import { isNil } from 'lodash'

type BreadcrumbPathTabs = (BreadcrumbPath & {
  active?: () => boolean
})[]

export function getBreadcrumbPaths(paths: BreadcrumbPathTabs) {
  return (
    paths
      .filter((path) => {
        if (isNil(path.active)) {
          return true
        }

        return path.active()
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ active, ...path }) => path)
  )
}
