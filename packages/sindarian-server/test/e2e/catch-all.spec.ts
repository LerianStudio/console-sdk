import { NextRequest } from 'next/server'
import { app } from '../app/app'
import { generateRequest } from './utils/generate-request'

type NextRouteArgs = [NextRequest, { params: Promise<any> }]

/**
 * One route file serves every endpoint the framework registers.
 *
 * Next hands a `[[...path]]` route a `params` object shaped `{ path: [...] }`:
 * the raw segment array, carrying no named segment at all. Every case below
 * builds its request that way, so a `@Param('id')` can only resolve from the
 * captures the matched route produced — which is what this spec exists to
 * prove, on a real `Response` body rather than on a mocked `NextResponse.json`.
 *
 * `app.spec.ts` keeps the per-file arrangement (`params` = `{ id: '123' }`)
 * untouched: both must work, because an application that adopts the catch-all
 * still keeps bespoke route files for the handlers it writes by hand.
 *
 * Contract: plan 2026-09-21-console-simplification C9.
 */
describe('Catch-all route dispatch', () => {
  jest.setTimeout(10000)

  async function get(url: string, params?: any) {
    const [request, context] = generateRequest(
      'GET',
      url,
      undefined,
      params
    ) as NextRouteArgs

    const response = await app.handler(request, context)

    return { status: response.status, body: await response.json() }
  }

  describe('a parameterised route', () => {
    it('resolves one param from the URL the framework matched', async () => {
      const { status, body } = await get(
        'http://localhost:3000/api/v1/test/123',
        { path: ['test', '123'] }
      )

      expect({ status, body }).toEqual({
        status: 200,
        body: { id: '123', name: 'test' }
      })
    })

    it('resolves both params of a nested route', async () => {
      const { status, body } = await get(
        'http://localhost:3000/api/v1/organizations/org_1/ledgers/led_2/accounts',
        { path: ['organizations', 'org_1', 'ledgers', 'led_2', 'accounts'] }
      )

      expect({ status, body }).toEqual({
        status: 200,
        body: { organizationId: 'org_1', ledgerId: 'led_2' }
      })
    })
  })

  describe("when Next's own params carry nothing", () => {
    it('resolves one param with no params object at all', async () => {
      const { status, body } = await get(
        'http://localhost:3000/api/v1/test/123',
        undefined
      )

      expect({ status, body }).toEqual({
        status: 200,
        body: { id: '123', name: 'test' }
      })
    })

    it('resolves both params of a nested route with no params object at all', async () => {
      const { status, body } = await get(
        'http://localhost:3000/api/v1/organizations/org_1/ledgers/led_2/accounts',
        undefined
      )

      expect({ status, body }).toEqual({
        status: 200,
        body: { organizationId: 'org_1', ledgerId: 'led_2' }
      })
    })
  })

  describe('the routes that carry no param', () => {
    it('dispatches a static route through the same entry', async () => {
      const { status, body } = await get('http://localhost:3000/api/v1/test', {
        path: ['test']
      })

      expect({ status, body }).toEqual({
        status: 200,
        body: { items: [{ id: 1, name: 'test' }], query: {} }
      })
    })

    it('answers an unmatched URL with a not-found, never a sibling controller', async () => {
      const { status, body } = await get(
        'http://localhost:3000/api/v1/nope/1',
        { path: ['nope', '1'] }
      )

      expect({ status, message: body.message }).toEqual({
        status: 404,
        message: 'Route /nope/1 not found'
      })
    })
  })

  describe('an encoded segment', () => {
    // A capture nobody can decode is not a match, so the request falls
    // through to a not-found instead of reaching the controller with raw
    // `%ZZ` text standing in for an id — and never a 500, which is what an
    // unguarded `decodeURIComponent` would have cost it.
    // Plan 2026-09-21-console-simplification C9.
    it('answers a not-found when the escape cannot be decoded', async () => {
      const { status, body } = await get(
        'http://localhost:3000/api/v1/test/%ZZ',
        { path: ['test', '%ZZ'] }
      )

      expect({ status, message: body.message }).toEqual({
        status: 404,
        message: 'Route /test/%ZZ not found'
      })
    })

    it('reaches the controller decoded', async () => {
      const { status, body } = await get(
        'http://localhost:3000/api/v1/organizations/org%201/ledgers/led_2/accounts',
        { path: ['organizations', 'org 1', 'ledgers', 'led_2', 'accounts'] }
      )

      expect({ status, body }).toEqual({
        status: 200,
        body: { organizationId: 'org 1', ledgerId: 'led_2' }
      })
    })
  })
})
