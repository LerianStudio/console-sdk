import { ModuleMetadata } from '@/modules/module-decorator'

/**
 * Sort routes by specificity (most specific first)
 * Routes with more static segments come before routes with parameters
 * This matches NestJS behavior to ensure routes like:
 * - GET /organizations/:id/ledgers/with-assets (more specific)
 * - GET /organizations/:id/ledgers/:ledgerId (less specific)
 * are matched in the correct order
 *
 * @param routes - Array of route metadata to sort
 * @returns Sorted array with most specific routes first
 */
export function sortRoutesBySpecificity(
  routes: ModuleMetadata[]
): ModuleMetadata[] {
  return [...routes].sort((a, b) => {
    const aScore = calculateRouteSpecificity(a.path)
    const bScore = calculateRouteSpecificity(b.path)
    return bScore - aScore // Higher score = more specific = comes first
  })
}

/**
 * Calculate specificity score for a route path
 * Higher score = more specific route
 *
 * This algorithm is based on the route-sort library by Luke Edwards
 * https://github.com/lukeed/route-sort
 *
 * Segment Values (lower = more specific):
 * - Static segment: 1
 * - Parameter (:id): 111
 * - Parameter with suffix (:id.format): 11
 * - Optional parameter (:id?): 1111
 * - Wildcard (*): 100000000000 (1e11)
 *
 * Rank = (segment_count - 1) / sum_of_segment_values
 * Higher rank = more specific route
 *
 * Examples:
 * - /users/active (2 static) = 1 / 2 = 0.5
 * - /users/:id (1 static + 1 param) = 1 / 112 = ~0.0089
 * - /users/* (1 static + 1 wildcard) = 1 / 100000000001 = ~1e-11
 *
 * @param path - The route path to score
 * @returns Specificity score (higher = more specific)
 */
export function calculateRouteSpecificity(path: string): number {
  const segments = path.split('/').filter((s) => s.length > 0)

  if (segments.length === 0) {
    // Root path is treated as a static route
    return 1
  }

  let totalValue = 0

  for (const segment of segments) {
    totalValue += getSegmentValue(segment)
  }

  // Calculate rank: (segment_count - 1) / total_value
  // Higher rank = more specific
  return (segments.length - 1) / totalValue
}

/**
 * Get numeric value for a route segment
 * Lower value = more specific
 *
 * @param segment - Route segment to evaluate
 * @returns Numeric value representing specificity
 */
function getSegmentValue(segment: string): number {
  // Wildcard
  if (segment === '*') {
    return 1e11
  }

  // Optional parameter (:id?)
  if (/^:.*\?$/.test(segment)) {
    return 1111
  }

  // Parameter with suffix (:id.format)
  if (/^:.*\./.test(segment)) {
    return 11
  }

  // Regular parameter (:id)
  if (segment.startsWith(':')) {
    return 111
  }

  // Static segment
  return 1
}
