import { NextRequest } from 'next/server'

export type MiddlewareNext = () => Promise<Response>

export abstract class Middleware {
  abstract use(request: NextRequest, next: MiddlewareNext): Promise<Response>
}
