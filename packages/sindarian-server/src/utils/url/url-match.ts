import { pathToRegexp } from 'path-to-regexp'

/**
 * Check if a pathname matches a route
 * @param pathname - The pathname to check
 * @param route - The route to check against
 * @returns True if the pathname matches the route, false otherwise
 */
export function urlMatch(pathname: string, route: string) {
  const { regexp } = pathToRegexp(route)
  return regexp.test(pathname)
}
