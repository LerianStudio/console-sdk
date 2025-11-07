/**
 * Join multiple URL parts with a slash
 * @param args - The URL parts to join
 * @returns The joined URL
 */
export function urlJoin(...args: string[]) {
  if (args.length === 0) return '/'

  const cleaned = args
    .map((pathPart) => pathPart.replace(/(^\/+|\/+$)/g, ''))
    .filter(Boolean)

  return cleaned.length > 0 ? '/' + cleaned.join('/') : '/'
}
