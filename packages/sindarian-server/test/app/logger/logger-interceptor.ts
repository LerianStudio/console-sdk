import {
  CallHandler,
  ExecutionContext,
  Interceptor
} from '@lerianstudio/sindarian-server'
import { NextRequest } from 'next/server'

export class LoggerInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest<NextRequest>()
    const handler = `${context.getClass().name}.${context.getHandler().name}`

    console.log(`[LOG] ${request.method} ${request.url} -> ${handler}`)

    const start = Date.now()
    const result = await next.handle()
    const duration = Date.now() - start

    console.log(`[LOG] ${handler} completed in ${duration}ms`)

    return result
  }
}
