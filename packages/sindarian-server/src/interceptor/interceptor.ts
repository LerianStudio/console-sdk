import { ExecutionContext } from '@/context/execution-context'
import { CallHandler } from './call-handler'

export abstract class Interceptor {
  abstract intercept(context: ExecutionContext, next: CallHandler): Promise<any>
}
