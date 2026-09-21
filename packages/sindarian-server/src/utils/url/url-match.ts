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

  // Compiling the route happens OUTSIDE the try: an invalid route pattern is a
  // framework misconfiguration and must stay loud, never degrade into a silent
  // not-found.
  const matcher = match(normalizedRoute)

  let result: ReturnType<typeof matcher>

  try {
    result = matcher(normalizedPathname)
  } catch {
    // `match()` decodes each capture with `decodeURIComponent`, which raises
    // `URIError` on a malformed escape (`%ZZ`, a trailing `%`); `new URL()`
    // neither decodes nor rejects those, so such a pathname does reach route
    // resolution. A capture nobody can decode is not a match: the request
    // answers 404 rather than handing a controller raw text as though it were
    // a real id. Plan 2026-09-21-console-simplification C9.
    return { matched: false, params: {} }
  }

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
