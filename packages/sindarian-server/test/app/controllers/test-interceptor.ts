import {
  CallHandler,
  ExecutionContext,
  Interceptor
} from '@lerianstudio/sindarian-server'

export class TestInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    // Custom logic before the request is handled
    console.log('Before request is handled')

    const response = await next.handle()

    // Custom logic after the request is handled
    console.log('After request is handled')

    return response
  }
}
