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
