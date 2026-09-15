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
    expect(body.code).toBe('0004')
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
 * An unexpected error is anything a route threw that this library does not
 * model: a bare `Error`, or a plain `HttpException`. Its text is the failure's
 * own words, whatever the throw site interpolated into them, and it used to
 * reach the browser verbatim: below, an internal host and port and a taxpayer
 * id.
 *
 * It now answers the generic sentence and the code, and the words go to the
 * server log instead, the way `HttpService` already writes an upstream
 * failure. The route above throws the SAME two values as a problem object and
 * they are stripped there too, which is the point of keeping the pair: the
 * shape a route happens to throw no longer decides whether a caller reads the
 * failure's own words.
 */
describe('An unexpected error answers a generic body, never its own text', () => {
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('redacts a thrown Error, host, port and taxpayer id', async () => {
    const { response, body } = await get('error')

    expect(response.status).toBe(500)
    expect(typeof body.message).toBe('string')
    expect(body.message).toBe('Internal server error')
    expect(body.code).toBe('0004')
    expect(JSON.stringify(body)).not.toContain('db-primary.internal')
    expect(JSON.stringify(body)).not.toContain('8080')
    expect(JSON.stringify(body)).not.toContain('123.456.789-00')

    expect(JSON.stringify(consoleError.mock.calls)).toContain(
      'connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00'
    )
  })

  // Found, not fixed: a plain `HttpException` carries a real status of its own
  // and this filter answers 500 regardless. Pinned here so that giving it the
  // real status later is a deliberate red test rather than a silent change.
  it('answers 500 for a plain HttpException, and redacts it too', async () => {
    const { response, body } = await get('http-status')

    expect(response.status).toBe(500)
    expect(body.message).toBe('Internal server error')
    expect(body.code).toBe('0004')
    expect(JSON.stringify(body)).not.toContain('no such ledger')

    expect(JSON.stringify(consoleError.mock.calls)).toContain('no such ledger')
  })
})
