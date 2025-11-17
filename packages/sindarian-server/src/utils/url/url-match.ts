import { pathToRegexp } from 'path-to-regexp'

/**
 * Normalize a path by removing trailing slashes (except for root path)
 * @param path - The path to normalize
 * @returns The normalized path
 */
function normalizePath(path: string): string {
  if (path === '/' || path === '') {
    return path
  }
  return path.endsWith('/') ? path.slice(0, -1) : path
}

/**
 * Check if a pathname matches a route
 * @param pathname - The pathname to check
 * @param route - The route to check against
 * @returns True if the pathname matches the route, false otherwise
 */
export function urlMatch(pathname: string, route: string) {
  // Normalize both paths to handle Next.js trailingSlash configuration
  const normalizedPathname = normalizePath(pathname)
  const normalizedRoute = normalizePath(route)

  const { regexp } = pathToRegexp(normalizedRoute)
  return regexp.test(normalizedPathname)
}
