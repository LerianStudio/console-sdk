import { app } from '../app/app'
import { generateRequest } from './utils/generate-request'
import { NextRequest } from 'next/server'

/**
 * What a caller parses when a route threw something that is not an
 * ApiException.
 *
 * The app's own filter handles ApiException and returns nothing for the rest,
 * so every case here falls through to the package's BaseExceptionFilter. These
 * assertions read a real Response body rather than the arguments of a mocked
 * `NextResponse.json`, which is the only way to see what the browser receives.
 */
const get = async (path: string) => {
  const [request, params] = generateRequest(
    'GET',
    `http://localhost:3000/api/v1/throwing/${path}`
  ) as [NextRequest, { params: Promise<any> }]

  const response = await app.handler(request, params)

  return { response, body: await response.json() }
}

describe('Whatever a route throws, the body carries a string message', () => {
  jest.setTimeout(10000)

  it('reduces an upstream problem object to its classification', async () => {
    const { response, body } = await get('object')

    expect(response.status).toBe(500)
    expect(typeof body.message).toBe('string')
    expect(body.message).toBe('Gateway Timeout')
    expect(JSON.stringify(body)).not.toContain('123.456.789-00')
    expect(JSON.stringify(body)).not.toContain('db-primary.internal')
  })

  it('names a sentence when the thrown value has no message', async () => {
    const { response, body } = await get('no-message')

    expect(response.status).toBe(500)
    expect(typeof body.message).toBe('string')
    expect(body.message).toBe('Internal server error')
  })

  it('names a sentence for a thrown string', async () => {
    const { response, body } = await get('string')

    expect(response.status).toBe(500)
    expect(typeof body.message).toBe('string')
    expect(body.message).toBe('Internal server error')
  })

  // `throw null` used to make the filter throw while handling the throw, and a
  // filter that throws escapes the request pipeline: the route never produced a
  // Response at all. Measured on Next 16.2.6 under `next start`, that answers
  // `500` with a ZERO-BYTE body and no `content-type` header, so a browser
  // calling `response.json()` gets `SyntaxError: Unexpected end of JSON input`.
  it('answers JSON with a body at all, for a thrown null', async () => {
    const { response, body } = await get('null')

    expect(response.status).toBe(500)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(typeof body.message).toBe('string')
    expect(body.message).toBe('Internal server error')
  })
})

/**
 * KNOWN LEAK CLASS, pinned rather than closed. Awaiting a product decision.
 *
 * A thrown `Error` puts its own text on the wire verbatim. `toProblemMessage`
 * has a rule for an `Error` *value*, returning the fallback instead of its
 * text, but the filter hands it `exception?.message`, which is already a
 * string by then, so that rule never fires from this frame. Whatever the Error
 * says reaches the browser: below, an internal host and port and a taxpayer id.
 *
 * The identical values thrown as a problem object one route over ARE stripped,
 * which is what makes this worth pinning: the leak is not closed, it is only
 * narrow, and the adjacent passing case must not be read as covering it.
 *
 * Closing it is a wire-behaviour change: callers classify on this text today,
 * and no one has measured which. This case exists so that closing it is a
 * deliberate red test, never a silent one.
 */
describe('A thrown Error still puts its own text on the wire', () => {
  it('leaks the Error message verbatim, host, port and taxpayer id', async () => {
    const { response, body } = await get('error')

    expect(response.status).toBe(500)
    expect(typeof body.message).toBe('string')
    expect(body.message).toBe(
      'connect ECONNREFUSED 10.0.0.5:8080 for cpf 123.456.789-00'
    )
  })
})
