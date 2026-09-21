import { match } from 'path-to-regexp'

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
 * Decode one capture without being able to throw.
 *
 * `decodeURIComponent` raises `URIError` on a malformed escape (`%ZZ`, a lone
 * `%`), and `new URL()` neither decodes nor rejects those, so such a pathname
 * does reach route resolution. The regexp still decides whether the route
 * matches; a capture that cannot be decoded carries its raw text rather than
 * costing the request its route.
 * @param value - The raw capture
 * @returns The decoded capture, or the raw value when it cannot be decoded
 */
function decodeCapture(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * The outcome of matching a pathname against a route.
 */
export type UrlMatch = {
  /** Whether the pathname matches the route */
  matched: boolean
  /** The named segments the route captured, empty when nothing matched */
  params: Record<string, string>
}

/**
 * Check if a pathname matches a route, and return what it captured
 * @param pathname - The pathname to check
 * @param route - The route to check against
 * @returns Whether the pathname matches, and the named segments it captured
 */
export function urlMatch(pathname: string, route: string): UrlMatch {
  // Normalize both paths to handle Next.js trailingSlash configuration
  const normalizedPathname = normalizePath(pathname)
  const normalizedRoute = normalizePath(route)

  const result = match(normalizedRoute, { decode: decodeCapture })(
    normalizedPathname
  )

  if (!result) {
    return { matched: false, params: {} }
  }

  // `match()` builds its params with a null prototype, and a wildcard token
  // (`*name`) captures an array. Both are normalized to a plain
  // `Record<string, string>`: a controller's `@Param()` is declared a string.
  const params: Record<string, string> = {}

  for (const [name, value] of Object.entries(result.params)) {
    if (value === undefined) {
      continue
    }

    params[name] = Array.isArray(value) ? value.join('/') : value
  }

  return { matched: true, params }
}
