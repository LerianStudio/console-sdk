import { NextRequest } from 'next/server'
import { app } from '../app/app'
import { guardCalls } from '../app/controllers/guarded-controller'
import { generateRequest } from './utils/generate-request'

type NextRouteArgs = [NextRequest, { params: Promise<any> }]

/**
 * A controller that carries a class-level `@UseGuards` and a method that
 * carries its own.
 *
 * The class decorator used to copy its guard list onto every prototype method,
 * and it runs AFTER the method decorators, so a method-level `@UseGuards` was
 * overwritten: the route was authorized by the class guard alone and the class
 * guard ran twice. A DELETE behind an admin-level guard answered 200 to anyone
 * the read-level guard let in.
 *
 * Contract: plan 2026-09-21-console-simplification C9.
 */
describe('Guards on a controller that carries one at both levels', () => {
  jest.setTimeout(10000)

  beforeEach(() => {
    guardCalls.read = 0
    guardCalls.admin = 0
  })

  async function call(method: string, url: string, params?: any) {
    const [request, context] = generateRequest(
      method,
      url,
      undefined,
      params
    ) as NextRouteArgs

    const response = await app.handler(request, context)

    return { status: response.status, body: await response.json() }
  }

  it('consults the method guard, which refuses the delete', async () => {
    const { status } = await call(
      'DELETE',
      'http://localhost:3000/api/v1/guarded/123',
      { id: '123' }
    )

    expect(status).toBe(403)
    expect(guardCalls.admin).toBe(1)
  })

  it('runs the class guard exactly once on that same delete', async () => {
    await call('DELETE', 'http://localhost:3000/api/v1/guarded/123', {
      id: '123'
    })

    expect(guardCalls.read).toBe(1)
  })

  it('still lets a method with no guard of its own through the class guard', async () => {
    const { status, body } = await call(
      'GET',
      'http://localhost:3000/api/v1/guarded/123',
      { id: '123' }
    )

    expect({ status, body }).toEqual({ status: 200, body: { id: '123' } })
    expect(guardCalls).toEqual({ read: 1, admin: 0 })
  })
})
