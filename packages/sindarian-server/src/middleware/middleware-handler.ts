import { NextRequest } from 'next/server'
import { Middleware, MiddlewareNext } from './middleware'

export class MiddlewareHandler {
  static async execute(
    request: NextRequest,
    middlewares: Middleware[],
    action: () => Promise<Response>
  ): Promise<Response> {
    if (middlewares.length === 0) {
      return await action()
    }

    const createNext = (i: number): MiddlewareNext => async () => {
      if (i >= middlewares.length) {
        return await action()
      }

      return await middlewares[i].use(request, createNext(i + 1))
    }

    return await createNext(0)()
  }
}
