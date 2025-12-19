import { ExecutionContext } from '@/context/execution-context'

/**
 * Interface defining the `canActivate()` function that must be implemented
 * by a guard. Return value indicates whether or not the current request is
 * allowed to proceed.
 *
 * @see [Guards](https://docs.nestjs.com/guards)
 *
 * @publicApi
 */
export interface CanActivate {
  /**
   * @param context Current execution context. Provides access to details about
   * the current request pipeline.
   *
   * @returns Value indicating whether or not the current request is allowed to
   * proceed. Can be a boolean or a Promise that resolves to a boolean.
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean>
}
