export function getNextRequestArgument(args: any[]) {
  if (!args) {
    return undefined
  }

  return args[0]
}

export async function getNextParamArgument(args: any[]) {
  if (!args) {
    return undefined
  }

  if (!args[1] || !('params' in args[1])) {
    return undefined
  }

  // args[1].params is a Promise in Next.js App Router
  return await args[1].params
}

/**
 * The captures the matched route produced, carried by `ServerFactory` on the
 * second element of the handler-argument tuple as `routeParams`.
 *
 * Synchronous on purpose: unlike Next's own `params`, these are already
 * resolved by the time the route is chosen, so there is nothing to await.
 *
 * Contract: plan 2026-09-21-console-simplification C9.
 */
export function getRouteParamArgument(args: any[]) {
  if (!args) {
    return undefined
  }

  if (!args[1] || !('routeParams' in args[1])) {
    return undefined
  }

  return args[1].routeParams
}
