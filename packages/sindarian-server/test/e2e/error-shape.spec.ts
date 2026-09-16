import { format } from 'node:util'
import {
  ApiException,
  HttpStatus,
  noProblemDetails
} from '@lerianstudio/sindarian-server'
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

/**
 * Hoisted over both blocks below, because the log half of the rule is asserted
 * in both: every shape that reaches this filter writes one line, and a shape
 * that writes none has had its text deleted rather than moved.
 */
let consoleError: jest.SpyInstance

beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleError.mockRestore()
})

/**
 * What Node actually writes for each call, not what the spy was handed.
 *
 * `JSON.stringify` of the call arguments was one frame too early: it re-escapes
 * the record, so an assertion could not read the wire text, and it could not
 * see how many physical lines one failure becomes. `util.format` is what
 * `console.error` hands the stream.
 */
const writtenLines = () =>
  consoleError.mock.calls.map((call) => format(...call))

const logged = () => writtenLines().join('\n')

describe('Whatever a route throws, the body carries a string message', () => {
  jest.setTimeout(10000)

  it('keeps no part of an upstream problem object', async () => {
    const { response, body } = await get('object')

    expect(response.status).toBe(500)
    expect(typeof body.message).toBe('string')
    expect(body.message).toBe('Internal server error')
    expect(body.code).toBe('0004')
    expect(JSON.stringify(body)).not.toContain('Gateway Timeout')
    expect(JSON.stringify(body)).not.toContain('123.456.789-00')
    expect(JSON.stringify(body)).not.toContain('db-primary.internal')

    expect(logged()).toContain('Gateway Timeout')
    expect(logged()).toContain('123.456.789-00')
    // The taxpayer id is three levels down. Rendered at the default depth it
    // reads `errors: { payer: [Object] }` and the incident is gone from the
    // only place that still has it.
    expect(logged()).not.toContain('[Object]')
    // And it is one event, not seven. Handing `console.error` a record object
    // let Node break it across physical lines, which splits the taxpayer id
    // from the label an operator greps for in any line-oriented collector.
    expect(writtenLines()).toHaveLength(1)
    expect(writtenLines()[0]).not.toContain('\n')
  })

  // The ordinary rethrow in a TypeScript route, and the shape that survived
  // the first version of this redaction: not an `Error`, so a redaction keyed
  // off `instanceof Error` handed the browser its text. Byte for byte the same
  // text as the `error` route below, which was already redacted, so the pair
  // reads as one rule rather than two.
  it('keeps no part of a thrown object whose message is a string', async () => {
    const { response, body } = await get('errorlike')

    expect(response.status).toBe(500)
    expect(body.message).toBe('Internal server error')
    expect(body.code).toBe('0004')
    expect(JSON.stringify(body)).not.toContain('db-primary.internal')
    expect(JSON.stringify(body)).not.toContain('8080')
    expect(JSON.stringify(body)).not.toContain('123.456.789-00')

    expect(logged()).toContain(
      'connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00'
    )
  })

  it('names a sentence when the thrown value has no message', async () => {
    const { response, body } = await get('no-message')

    expect(response.status).toBe(500)
    expect(typeof body.message).toBe('string')
    expect(body.message).toBe('Internal server error')
    expect(body.code).toBe('0004')

    expect(logged()).toContain('E_NOPE')
  })

  it('names a sentence for a thrown string', async () => {
    const { response, body } = await get('string')

    expect(response.status).toBe(500)
    expect(typeof body.message).toBe('string')
    expect(body.message).toBe('Internal server error')
    expect(body.code).toBe('0004')

    expect(logged()).toContain('something went wrong')
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
    expect(body.code).toBe('0004')

    // The label alone would pass on an empty record, and this is the shape
    // whose record has nothing but the rendered value in it.
    expect(logged()).toContain('Unhandled exception')
    expect(logged()).toContain('"value":"null"')
  })

  // A rejection with no argument at all. It answers the same body as every
  // other shape, and its log line carries the one thing there is to say.
  it('answers JSON with a body at all, for a thrown undefined', async () => {
    const { response, body } = await get('undefined')

    expect(response.status).toBe(500)
    expect(body.message).toBe('Internal server error')
    expect(body.code).toBe('0004')

    expect(logged()).toContain('"name":"undefined"')
    expect(logged()).toContain('"value":"undefined"')
  })
})

/**
 * An unexpected error is anything a route threw that this library does not
 * model, with no exception: an `Error`, a plain `HttpException`, an object
 * carrying a string `message`, an upstream problem body, a string, a `null`,
 * an `undefined`. Its text is the failure's own words, whatever the throw site
 * interpolated into them.
 *
 * What each of those used to answer differed by shape, which is the defect.
 * The shapes carrying a string under `message`, the `Error` and the plain
 * `HttpException` among them, put that string on the wire verbatim: below, an
 * internal host and port and a taxpayer id. The rest answered a body a caller
 * could not read at all, `{}` for a thrown string and for a value with no
 * `message`, and no response whatsoever for a thrown `null`.
 *
 * They now answer one body, the generic sentence and the code, and the words
 * go to the server log instead, the way `HttpService` already writes an
 * upstream failure. The block above throws the SAME values under four
 * different shapes and reads the same body back from every one, which is the
 * point of keeping them together: the shape a route happens to throw no longer
 * decides whether a caller reads the failure's own words.
 */
describe('An unexpected error answers a generic body, never its own text', () => {
  it('redacts a thrown Error, host, port and taxpayer id', async () => {
    const { response, body } = await get('error')

    expect(response.status).toBe(500)
    expect(typeof body.message).toBe('string')
    expect(body.message).toBe('Internal server error')
    expect(body.code).toBe('0004')
    expect(JSON.stringify(body)).not.toContain('db-primary.internal')
    expect(JSON.stringify(body)).not.toContain('8080')
    expect(JSON.stringify(body)).not.toContain('123.456.789-00')

    expect(logged()).toContain(
      'connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00'
    )
    // The stack is the shape that broke this worst: handed over as a record
    // OBJECT, these same three fields render across MANY physical lines,
    // measured in situ by formatting them the old way and counting
    // `split('\n').length`.
    //
    // No digit is written here, because the digit is a property of how the
    // suite was INVOKED, not of this package. Measured on one build: the gate,
    // which runs both specs and so runs this one in a jest worker, renders 18
    // lines; this spec alone, with or without `-i`, renders 17, because the
    // worker contributes a frame. An earlier version of this comment named one
    // of those numbers as the fact and blamed the drift on copy-to-copy
    // variation, which sent a reader looking for something unreproducible when
    // it reproduces on demand from the command.
    //
    // What does not move is the count this file asserts: ONE line, which is
    // zero newlines. Its frames are still inside it, escaped.
    expect(writtenLines()).toHaveLength(1)
    expect(writtenLines()[0]).not.toContain('\n')
    expect(writtenLines()[0]).toContain('\\n    at ')
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

    expect(logged()).toContain('no such ledger')
  })
})

/**
 * The other half of the same rule, for the exceptions this library DOES model.
 *
 * These never reach the package's filter here: the app registers its own
 * filter, which answers an `ApiException` by spreading
 * `ApiException.getResponse()` into its envelope, and that is how an
 * application that renders its own body reads the message. So this block is
 * the only place the accessor is read through a real Response.
 *
 * The constructor reduces and bounds whatever it is handed. `Error.message` is
 * writable, so a value written after construction never passed through it, and
 * this is the shape that put an upstream's object on the wire under a field
 * documented as a sentence, a 5 MB body in a browser, and - for a `message`
 * that throws when read - no response at all.
 */
describe('A typed exception carries a bounded sentence, however it was written', () => {
  it('names the real status instead of an upstream object', async () => {
    const { response, body } = await get('typed-object')

    expect(response.status).toBe(404)
    expect(body.message).toBe(
      'Upstream error body carried no problem details (status 404)'
    )
    expect(body.code).toBe('0003')
    expect(JSON.stringify(body)).not.toContain('123.456.789-00')
    expect(JSON.stringify(body)).not.toContain('db-primary.internal')
    expect(JSON.stringify(body)).not.toContain('Gateway Timeout')
  })

  // The sentence a failed read falls back to is published beside the readers
  // that take it. An application rendering its own envelope had to invent its
  // own, so the same failed read read differently depending on which frame
  // answered it, which is the drift exporting the readers exists to close. The
  // literal is asserted here as well, so this is a pin rather than a tautology.
  it('publishes the fallback sentence it answers', async () => {
    const { body } = await get('typed-object')

    expect(body.message).toBe(noProblemDetails(404))
    expect(noProblemDetails(404)).toBe(
      'Upstream error body carried no problem details (status 404)'
    )
  })

  it('bounds a five-megabyte message at two thousand characters', async () => {
    const { response, body } = await get('typed-huge')

    expect(response.status).toBe(404)
    expect(body.message).toHaveLength(2000)
  })

  // The status a response is BUILT with, which is the read this app makes
  // itself, and the one case where a number inside 200 to 599 is still not
  // usable: the runtime pairs no body with 204, 205 or 304 and raises a
  // `TypeError` when one is attached. Measured through a real Response here,
  // because the filter's unit tests mock `NextResponse.json` and no mock
  // refuses a status.
  //
  // All THREE are driven, not one. What the reader holds is a set, and a set
  // is only as right as its members: a real `Response` is the only thing in
  // this repository that refuses one, so a member covered by the reader's own
  // table alone is covered by an assertion about the table.
  it.each([[204], [205], [304]])(
    'answers a body for the status %s, which carries none',
    async (status) => {
      const { response, body } = await get(`typed-nullbody-${status}`)

      expect(response.status).toBe(500)
      expect(response.headers.get('content-type')).toContain('application/json')
      // The status is the only thing that falls back: the sentence the route
      // wrote is still the one the caller is told.
      expect(body.message).toBe('Ledger not found')
      expect(body.code).toBe('0003')
    }
  )

  // The third value this frame reads, after the message and the status. The
  // body is `{ ...metadata, code, title, ...super.getResponse() }`, and the
  // spread is a read of every own enumerable accessor the route attached: a
  // getter that throws never returns a body at all, and a `bigint` returns one
  // the serialiser refuses one frame later. Both escape `app.handler` with no
  // Response, which is the zero-byte failure this whole branch exists to
  // close, so both are driven through the real handler here.
  it.each([
    ['a getter that throws', 'typed-meta-trap', 'metadata getter exploded'],
    [
      'a value that cannot be serialised',
      'typed-meta-bigint',
      'Do not know how to serialize a BigInt'
    ]
  ])(
    'answers a body at all for metadata carrying %s',
    async (_shape, path, reason) => {
      const { response, body } = await get(path)

      expect(response.status).toBe(404)
      expect(response.headers.get('content-type')).toContain('application/json')
      // The metadata is the only thing that falls back: the sentence the route
      // wrote and its classification are still what the caller is told.
      expect(body.message).toBe('Ledger not found')
      expect(body.code).toBe('0003')
      expect(body.title).toBe('Not Found')
      // And the drop is not silent. The fields are gone from the body, so the
      // reason they are gone is the only thing left that explains it.
      expect(logged()).toContain('Exception metadata dropped')
      expect(logged()).toContain(reason)
    }
  )

  // The last two values this frame answers. A `code` getter that throws never
  // returns a body at all, so the throw escapes `app.handler` above the frame
  // that would have built a Response, and it did so writing no operator line
  // either, which is worse than the metadata case above.
  it('answers a body at all when reading the code throws', async () => {
    const { response, body } = await get('typed-code-trap')

    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')
    // The code is the only thing that falls back: the sentence the route
    // wrote, its title and its status are still what the caller is told.
    expect(body.code).toBe('0004')
    expect(body.title).toBe('Not Found')
    expect(body.message).toBe('Ledger not found')
    expect(logged()).toContain('Exception classification dropped')
  })

  // Nothing throws for this one, which is why no guard caught it: an object
  // serialises, and a field documented as a short classification carried an
  // upstream body with an internal host in it all the way to the browser.
  it('answers a string title when a route wrote an object', async () => {
    const { response, body } = await get('typed-title-object')

    expect(response.status).toBe(404)
    expect(body.title).toBe('Not Found')
    expect(JSON.stringify(body)).not.toContain('db-primary.internal')
    expect(body.code).toBe('0003')
    expect(body.message).toBe('Ledger not found')
    expect(logged()).toContain('Exception classification dropped')
  })

  // A filter that throws escapes the request pipeline, and the route answers a
  // ZERO-BYTE body with no content-type: `response.json()` below is the
  // assertion, because it is what raises `SyntaxError: Unexpected end of JSON
  // input` for a caller promised an envelope.
  it('answers a body at all when reading the message throws', async () => {
    const { response, body } = await get('typed-trap')

    expect(response.status).toBe(404)
    expect(body.message).toBe(
      'Upstream error body carried no problem details (status 404)'
    )
    expect(body.code).toBe('0003')
  })

  // The TYPE this method emits, not the value it answers. An application that
  // renders its own envelope spreads this body into it and reads metadata keys
  // back off it - Console passes `{ details }` and reads `details` - so a
  // return narrowed to the three named fields stops that consumer compiling at
  // the 2.x bump, silently, because nothing in the package itself reads a
  // metadata key. This suite is the only one here that type-checks, and it
  // resolves the package through `file:../`, so what it compiles against is
  // the emitted `.d.ts` a consumer installs. The read below IS the assertion:
  // a narrowed type fails this suite before a single case runs.
  it('lets a consumer read a metadata key off the body it emits', () => {
    const body = new ApiException(
      '0007',
      'Validation Error',
      'Invalid body',
      HttpStatus.BAD_REQUEST,
      { details: { requestId: 'r-1' } }
    ).getResponse()

    expect(body.details).toEqual({ requestId: 'r-1' })
    expect(body.message).toBe('Invalid body')
  })
})
