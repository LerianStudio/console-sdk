import { LoggerAggregator } from '@/aggregator/logger-aggregator'

/**
 * Wraps a function in a root logging context.
 * For non-class code like NextAuth callbacks, cron jobs, or queue handlers.
 *
 * @param logger - LoggerAggregator instance
 * @param name - Operation name (e.g., 'next-auth-authorize')
 * @param fn - Async function to wrap
 */
export async function withTrace<T>(
  logger: LoggerAggregator,
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return logger.runWithContext(name, 'INTERNAL', { handler: name }, fn)
}
