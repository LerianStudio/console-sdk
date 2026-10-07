import 'reflect-metadata'
import { BODY_KEY } from '../../constants/keys'
import { HttpStatus } from '../../constants/http-status'
import { BodyHandler, Body, DEFAULT_BODY_LIMITS } from './body-decorator'
import {
  PayloadTooLargeApiException,
  ValidationApiException
} from '../../exceptions'

const URL = 'http://localhost/api/test'

const post = (body: BodyInit, contentType?: string) =>
  new Request(URL, {
    method: 'POST',
    body,
    headers: contentType ? { 'Content-Type': contentType } : {}
  })

/** A body with no declared length, streamed the way Next hands one over. */
const streamed = (chunks: number, chunkBytes: number) => {
  const pulls = { count: 0 }
  async function* source() {
    for (let i = 0; i < chunks; i++) {
      pulls.count++
      yield new Uint8Array(chunkBytes)
    }
  }

  const request = new Request(URL, {
    method: 'POST',
    body: source() as unknown as BodyInit,
    duplex: 'half',
    headers: { 'Content-Type': 'application/json' }
  } as RequestInit)

  return { request, pulls }
}

class TestClass {
  testMethod(_body: unknown) {}
}

const decorate = (options?: { maxBytes?: number }) =>
  Body(options)(TestClass.prototype, 'testMethod', 0)

const handle = (request: Request, context?: object) =>
  BodyHandler.handle(TestClass.prototype, 'testMethod', [request, context])

const refusal = (request: Request, context?: object) =>
  handle(request, context).then(
    () => undefined,
    (error: unknown) => error
  )

describe('BodyHandler.handle', () => {
  afterEach(() => {
    Reflect.deleteMetadata(BODY_KEY, TestClass.prototype, 'testMethod')
  })

  it('returns null when the method has no @Body()', async () => {
    expect(await handle(post('{}', 'application/json'))).toBeNull()
  })

  it('parses a JSON body', async () => {
    decorate()

    expect(
      await handle(post('{"name":"John","age":30}', 'application/json'))
    ).toEqual({
      type: 'body',
      parameter: { name: 'John', age: 30 },
      parameterIndex: 0
    })
  })

  it('reads a body that is neither JSON nor multipart as text', async () => {
    decorate()

    const result = await handle(post('plain words', 'text/plain'))

    expect(result?.parameter).toBe('plain words')
  })

  it('parses a multipart body into its fields', async () => {
    decorate()
    const form = new FormData()
    form.append('name', 'schema')
    form.append('file', new Blob(['<xs:schema/>']), 'a.xsd')

    const result = await handle(
      new Request(URL, { method: 'POST', body: form })
    )

    expect(result?.parameter.name).toBe('schema')
    expect(await result?.parameter.file.text()).toBe('<xs:schema/>')
  })

  it('refuses a malformed JSON body with 400', async () => {
    decorate()

    const error = await refusal(post('{"name":', 'application/json'))

    expect(error).toBeInstanceOf(ValidationApiException)
  })

  it('refuses a body past the default limit with 413', async () => {
    decorate()
    const body = JSON.stringify({
      blob: 'x'.repeat(DEFAULT_BODY_LIMITS.maxBytes)
    })

    const error = await refusal(post(body, 'application/json'))

    expect(error).toBeInstanceOf(PayloadTooLargeApiException)
    expect((error as PayloadTooLargeApiException).getStatus()).toBe(
      HttpStatus.PAYLOAD_TOO_LARGE
    )
  })

  it('stops reading an undeclared body once it passes the limit', async () => {
    decorate({ maxBytes: 4096 })
    const { request, pulls } = streamed(1024, 1024)

    const error = await refusal(request)

    expect(error).toBeInstanceOf(PayloadTooLargeApiException)
    expect(pulls.count).toBeLessThan(10)
  })

  it('lets a route raise its own limit', async () => {
    decorate({ maxBytes: 3 * 1024 * 1024 })
    const body = JSON.stringify({ blob: 'x'.repeat(2 * 1024 * 1024) })

    const result = await handle(post(body, 'application/json'))

    expect(result?.parameter.blob).toHaveLength(2 * 1024 * 1024)
  })

  it('applies the server limits, multipart against its own', async () => {
    decorate()
    const bodyLimits = { maxBytes: 64, maxMultipartBytes: 4096 }
    const form = new FormData()
    form.append('file', new Blob(['y'.repeat(1024)]), 'a.txt')

    const multipart = await handle(
      new Request(URL, { method: 'POST', body: form }),
      { bodyLimits }
    )
    const json = await refusal(
      post(JSON.stringify({ blob: 'x'.repeat(64) }), 'application/json'),
      { bodyLimits }
    )

    expect(multipart?.parameter.file.size).toBe(1024)
    expect(json).toBeInstanceOf(PayloadTooLargeApiException)
  })

  it('reads the body once per request', async () => {
    decorate()
    const request = post('{"a":1}', 'application/json')

    const first = await handle(request)
    const second = await handle(request)

    expect(second?.parameter).toBe(first?.parameter)
  })
})

describe('Body decorator', () => {
  afterEach(() => {
    Reflect.deleteMetadata(BODY_KEY, TestClass.prototype, 'testMethod')
  })

  it('records the parameter index', () => {
    decorate()

    expect(
      Reflect.getOwnMetadata(BODY_KEY, TestClass.prototype, 'testMethod')
    ).toEqual({ parameterIndex: 0 })
  })

  it('records a route limit', () => {
    decorate({ maxBytes: 10 })

    expect(
      Reflect.getOwnMetadata(BODY_KEY, TestClass.prototype, 'testMethod')
    ).toEqual({ parameterIndex: 0, maxBytes: 10 })
  })
})
