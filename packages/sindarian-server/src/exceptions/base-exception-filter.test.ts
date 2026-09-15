import { Console } from 'node:console'
import { Writable } from 'node:stream'
import { format, inspect } from 'node:util'
import { BaseExceptionFilter } from './base-exception-filter'
import { ApiException } from './api-exception'
import { NextResponse } from 'next/server'
import { HttpStatus } from '@/constants'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn()
  }
}))

const mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>

describe('BaseExceptionFilter', () => {
  let filter: BaseExceptionFilter
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    filter = new BaseExceptionFilter()
    jest.clearAllMocks()

    // Hoisted, because every value that is not an ApiException now writes one
    // line here, not only an Error. Without the spy these cases print the log
    // of every shape they throw.
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Mock NextResponse.json to return a mock response
    mockNextResponse.json.mockReturnValue({
      status: 500,
      statusText: 'Internal Server Error'
    } as any)
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('should handle ApiException with getStatus method', async () => {
    const exception = new ApiException(
      'TEST_ERROR',
      'Test Error',
      'Test error message',
      HttpStatus.BAD_REQUEST
    )

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Test error message' },
      { status: 400 }
    )
  })

  // Named for the `exception.getStatus ? exception.getStatus() : 500` guard
  // that `9bcba71` deleted as unreachable, so the old name pointed at a concept
  // this filter no longer has and read as coverage for a missing-`getStatus`
  // path that nothing exercises. What the case actually pins is the status: a
  // value this library does not model is answered 500 whatever it carries.
  it('answers 500 for a value this library does not model', async () => {
    const exception = {
      message: 'Test error message'
    }

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Internal server error', code: '0004' },
      { status: 500 }
    )
  })

  // An empty message used to survive the constructor, and this filter's
  // `message || 'Internal server error'` then told the user that an expired
  // token was a server fault. The constructor now substitutes a sentence that
  // names the real status, so the filter's own fallback stays unreached.
  it('names the real status when the message is empty', async () => {
    const exception = new ApiException(
      'TEST_ERROR',
      'Test Error',
      '', // empty message
      HttpStatus.NOT_FOUND
    )

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: expect.stringContaining('404') },
      { status: 404 }
    )
    expect(mockNextResponse.json).not.toHaveBeenCalledWith(
      { message: 'Internal server error' },
      { status: 404 }
    )
  })

  // What the ApiException branch answers when the message is falsy, which this
  // pass reduced to a bare `exception.message` with no fallback of its own.
  // Measured rather than argued: the previous head answered
  // `{"message":"Internal server error"}` for this input and no case in the
  // suite could tell the two apart, so the reduction shipped unpinned.
  //
  // The constructor cannot produce this. `api-exception.ts` runs every message
  // through `toProblemMessage`, which substitutes a sentence naming the status,
  // and the case above pins that. Only a post-construction mutation reaches
  // here, and what it answers is the empty string it was given.
  it('answers the message it was given, even a mutated empty one', async () => {
    const exception = new ApiException(
      '0003',
      'Not Found',
      'Ledger not found',
      HttpStatus.NOT_FOUND
    )
    exception.message = ''

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: '' },
      { status: 404 }
    )
  })

  // The same branch, for a message mutated to something that is not a string
  // at all. This filter's whole claim is that the body carries a string
  // `message` every time, and the ApiException branch was the one place left
  // handing over whatever it was given: an object reached the browser under a
  // field documented as a sentence, with an upstream's `detail` and a taxpayer
  // id inside it, and an `undefined` left the field missing entirely. Both are
  // the exact defects this filter answers for on every other path.
  //
  // The answer is the constructor's own fallback, which names the real status,
  // not the 500 sentence: a 404 that says `Internal server error` is the defect
  // `names the real status when the message is empty` exists to prevent.
  describe('a mutated ApiException message that is not a string', () => {
    const mutated = (value: unknown) => {
      const exception = new ApiException(
        '0003',
        'Not Found',
        'Ledger not found',
        HttpStatus.NOT_FOUND
      )
      ;(exception as any).message = value
      return exception
    }

    it.each([
      [
        'an upstream problem object',
        { title: 'Gateway Timeout', detail: 'cpf 123.456.789-00' }
      ],
      ['a number', 42],
      ['undefined', undefined],
      ['null', null]
    ])('names the real status for %s', async (_label, value) => {
      await filter.catch(mutated(value))

      const body = mockNextResponse.json.mock.calls[0][0] as any

      expect(typeof body.message).toBe('string')
      expect(body.message).toContain('404')
      expect(JSON.stringify(body)).not.toContain('123.456.789-00')
      expect(JSON.stringify(body)).not.toContain('Gateway Timeout')
      expect(mockNextResponse.json.mock.calls[0][1]).toEqual({ status: 404 })
    })
  })

  // The same branch again, for the three ways a thrown value can fight back
  // while it is being read.
  //
  // A guard that reads the value TWICE is not a guard: it checks one read and
  // hands over another, and `message` is a property a throw site owns. A
  // getter answering a sentence first and an object second passed the `typeof`
  // and put the object on the wire. Reading once into a local is the whole
  // fix.
  //
  // A read that THROWS is worse than a wrong body. This filter runs inside
  // `ServerFactory._handleRequest`'s own catch block and that call is not
  // guarded, so a filter that throws escapes the request pipeline and the
  // route answers a ZERO-BYTE body with no content-type: a caller promised
  // JSON gets `SyntaxError: Unexpected end of JSON input`. The unexpected
  // branch below has been guarded against exactly this since `throw null`; the
  // typed branch was not, and reached it through a `message` getter or an
  // overridden `getStatus`.
  //
  // The answer keeps the constructor's own fallback and the REAL status
  // whenever the status could be read, because a 404 that says `Internal
  // server error` is the defect `names the real status when the message is
  // empty` exists to prevent. When the status itself is unreadable there is
  // nothing left to trust and the answer is 500.
  describe('a typed exception whose message cannot be trusted', () => {
    const notFound = () =>
      new ApiException(
        '0003',
        'Not Found',
        'Ledger not found',
        HttpStatus.NOT_FOUND
      )

    const bodyOf = () => mockNextResponse.json.mock.calls[0][0] as any
    const statusOf = () => mockNextResponse.json.mock.calls[0][1] as any

    it('answers a string for a message that changes between reads', async () => {
      const exception = notFound()
      let reads = 0

      Object.defineProperty(exception, 'message', {
        get() {
          reads += 1
          return reads === 1
            ? 'looks like a sentence'
            : { title: 'Gateway Timeout', payer: 'cpf 123.456.789-00' }
        }
      })

      await filter.catch(exception)

      expect(typeof bodyOf().message).toBe('string')
      expect(JSON.stringify(bodyOf())).not.toContain('123.456.789-00')
      expect(JSON.stringify(bodyOf())).not.toContain('Gateway Timeout')
      expect(statusOf()).toEqual({ status: 404 })
    })

    it('answers a body when the message getter throws', async () => {
      const exception = notFound()

      Object.defineProperty(exception, 'message', {
        get() {
          throw new Error('trap')
        }
      })

      await filter.catch(exception)

      expect(bodyOf().message).toBe(
        'Upstream error body carried no problem details (status 404)'
      )
      expect(statusOf()).toEqual({ status: 404 })
    })

    it('answers a body at 500 when getStatus throws', async () => {
      const exception = notFound()

      exception.getStatus = () => {
        throw new Error('trap')
      }

      await filter.catch(exception)

      expect(bodyOf().message).toBe(
        'Upstream error body carried no problem details (status 500)'
      )
      expect(statusOf()).toEqual({ status: 500 })
    })

    // The constructor caps every message it is given at 2000 characters
    // (`toProblemMessage`), and a message written after construction walked
    // straight past that: a rethrown 5 MB upstream body became a 5 MB response
    // body. The same ceiling now applies wherever the message is read.
    it('bounds a message written after construction', async () => {
      const exception = notFound()
      exception.message = 'x'.repeat(1_000_000)

      await filter.catch(exception)

      expect(bodyOf().message).toHaveLength(2000)
      expect(statusOf()).toEqual({ status: 404 })
    })
  })

  // The shape of an ordinary rethrow in a TypeScript route:
  // `catch (e) { throw { message: e.message } }`, or an upstream problem body
  // whose `message` is already a sentence. It is not an `Error`, so a
  // redaction keyed off `instanceof Error` let its text through, and this case
  // asserted that it did.
  it('should handle non-ApiException', async () => {
    const exception = {
      message:
        'connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00'
    }

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Internal server error', code: '0004' },
      { status: 500 }
    )
    expect(JSON.stringify(mockNextResponse.json.mock.calls)).not.toContain(
      '123.456.789-00'
    )
  })

  // A controller may throw anything at all, and this filter writes the last
  // body before the wire. `message` used to be whatever the thrown value
  // carried under that name: an object, an empty string, or nothing. A caller
  // that classifies a failure with string methods, which is every Console
  // route reading `error.message`, got a dead branch and answered a 500, and
  // an object landed in the browser under a field documented as a sentence.
  //
  // Every case below throws a DIFFERENT shape and asserts the SAME body. That
  // is the rule: past the ApiException narrowing, the thrown shape decides
  // nothing a caller can read. The cases stay one per shape because the shapes
  // are what a route actually throws, and a rule is only pinned where it can
  // be broken one shape at a time.
  describe('the body always carries a string message', () => {
    const messageOf = () => mockNextResponse.json.mock.calls[0][0] as any

    it('names a fallback when the thrown value has no message', async () => {
      await filter.catch({ message: undefined })

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    it('names a fallback for an empty message', async () => {
      await filter.catch({ message: '' })

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    it('names a fallback for an object message that classifies nothing', async () => {
      await filter.catch({
        message: { error: 'Complex error', details: ['detail1', 'detail2'] }
      })

      expect(typeof messageOf().message).toBe('string')
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    // The transport keeps an upstream's `title` because the transport knows it
    // called an upstream and answers a typed exception for it. This frame does
    // not: past the narrowing above, a `title` is a word some other system
    // wrote about a failure this library could not classify, and passing it on
    // under the code that means UNCLASSIFIED is what made the code unreadable.
    // A caller reading `0004` can now trust that the sentence beside it is
    // ours.
    it('keeps no part of an upstream classification', async () => {
      await filter.catch({
        message: {
          title: 'Gateway Timeout',
          detail: 'cpf 123.456.789-00 timed out at db-primary.internal'
        }
      })

      expect(messageOf().message).toBe('Internal server error')
      expect(JSON.stringify(messageOf())).not.toContain('Gateway Timeout')
      expect(JSON.stringify(messageOf())).not.toContain('123.456.789-00')
      expect(JSON.stringify(messageOf())).not.toContain('db-primary.internal')
    })

    it('names a fallback for a thrown string', async () => {
      await filter.catch('Simple string error')

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    // `throw null` used to make the filter itself throw on `.message`, and a
    // filter that throws escapes the whole request pipeline, so the route
    // produced no Response at all. Measured on Next 16.2.6 under `next start`:
    // `500`, a ZERO-BYTE body, no `content-type`, and a browser parsing that
    // as JSON gets `SyntaxError: Unexpected end of JSON input`.
    it('survives a thrown null', async () => {
      await expect(filter.catch(null)).resolves.toBeDefined()

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    // Length was the only thing that ever stood between an untyped message and
    // the browser, and a 2000-character cap is not a redaction: the host, the
    // port and the taxpayer id are in the first eighty. The cap is gone from
    // this branch because the text is.
    it('drops an unbounded message rather than capping it', async () => {
      await filter.catch({ message: 'x'.repeat(5000) })

      expect(messageOf().message).toBe('Internal server error')
    })
  })

  // What a route threw that this library does not model. Its text is the
  // failure's own words and it used to be the response body; it is now the log
  // line, and the caller is told only that the failure was not classified.
  //
  // The log line is the half that is easy to get wrong, because nothing a
  // caller can see goes red when it is missing. An `Error` was the only shape
  // that wrote one, so an operator paged on a spike of 500s had no host, no
  // taxpayer id and no line to grep for every other shape, and the response no
  // longer carried them either: the text was not redacted, it was deleted.
  //
  // The record is always the same three fields. `message` is the greppable
  // sentence when the value had one, and nothing else decides what gets
  // written: `value` carries the whole thrown value rendered, so a field beside
  // an EMPTY message survives, which an `??` fallback keyed on nullish deleted.
  // Both fields are cut at 2000 characters, because the value is whatever a
  // route threw and a rethrown upstream body has no size this package controls.
  describe('an unexpected error', () => {
    // What `console.error` was handed: the label is `[0][0]`, the record
    // `[0][1]`, which is JSON so that one failure is one physical line. A case
    // reads one field of it rather than restating all three.
    const payloadOf = () => JSON.parse(consoleError.mock.calls[0][1]) as any

    // What Node writes for that call, which is one frame PAST the spy. Every
    // other assertion in this file reads the arguments, so none of them can see
    // how many lines the record becomes.
    const written = () => format(...(consoleError.mock.calls[0] as [string]))

    it('answers the generic sentence and the code, never the Error text', async () => {
      await filter.catch(new Error('connect ECONNREFUSED 10.0.0.5:8080'))

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    // The stack is inside `value`: rendering an `Error` prints its stack, which
    // is why the record has no separate `stack` field to go unbounded.
    it('writes the Error text and its stack to the server log', async () => {
      await filter.catch(new Error('connect ECONNREFUSED 10.0.0.5:8080'))

      expect(payloadOf().name).toBe('Error')
      expect(payloadOf().message).toBe('connect ECONNREFUSED 10.0.0.5:8080')
      expect(payloadOf().value).toContain(
        'Error: connect ECONNREFUSED 10.0.0.5:8080'
      )
      expect(payloadOf().value).toContain('at ')
    })

    it('writes the text of a thrown object that is not an Error', async () => {
      await filter.catch({
        message: 'connect ECONNREFUSED 10.0.0.5:8080',
        code: 'ECONNREFUSED'
      })

      expect(payloadOf().name).toBe('object')
      expect(payloadOf().message).toBe('connect ECONNREFUSED 10.0.0.5:8080')
      expect(payloadOf().value).toContain("code: 'ECONNREFUSED'")
    })

    // The upstream body a route rethrew has no `message` at all. It is rendered
    // whole rather than stringified, because `String({...})` is
    // `[object Object]` and the fields ARE the incident: this is the only copy
    // left once the response stopped carrying them.
    it('writes a thrown value that has no message at all', async () => {
      await filter.catch({ code: 'E_NOPE', detail: 'timed out at db-primary' })

      // `message` is absent rather than `undefined`: the record is JSON, and a
      // key with no value is a key JSON does not write. Absent and undefined
      // say the same thing, that the thrown value carried no string message.
      expect(payloadOf()).toEqual({
        name: 'object',
        value: "{ code: 'E_NOPE', detail: 'timed out at db-primary' }"
      })
    })

    // The shape the `??` fallback deleted: `message` is PRESENT and empty, so
    // a fallback keyed on nullish kept the empty string and wrote nothing else.
    // An operator paged on this got a line that said nothing at all, which is
    // the outcome moving the text to the log exists to prevent.
    it('keeps the fields beside an empty message', async () => {
      await filter.catch({
        message: '',
        code: 'E_NOPE',
        detail: 'cpf 123.456.789-00 timed out at db-primary.internal:8080'
      })

      expect(payloadOf().message).toBe('')
      expect(payloadOf().value).toContain("code: 'E_NOPE'")
      expect(payloadOf().value).toContain('123.456.789-00')
    })

    // An upstream problem body nests: `errors` holds a field map, and the
    // rejected value is two levels under that. Rendering it at the default
    // depth prints `[Object]` exactly where the incident is.
    it('prints a nested body to its leaf rather than [Object]', async () => {
      await filter.catch({
        code: 'E_UPSTREAM',
        errors: { payer: { document: { value: 'cpf 123.456.789-00' } } }
      })

      expect(payloadOf().value).toContain('123.456.789-00')
      expect(payloadOf().value).not.toContain('[Object]')
    })

    // A route that rethrows a megabyte of upstream body writes a megabyte per
    // failed request otherwise, which is how one bad upstream fills a log sink.
    it('bounds a thrown value of a megabyte', async () => {
      await filter.catch('x'.repeat(1_000_000))

      expect(payloadOf().value).toHaveLength(2000)
    })

    // `name` is read off the thrown value like the other two, so it is bounded
    // like the other two. A non-string one falls back rather than being written
    // raw, and the real field is in `value` either way.
    it('bounds a name of a megabyte', async () => {
      await filter.catch({ name: 'x'.repeat(1_000_000), code: 'E_NOPE' })

      expect(payloadOf().name).toHaveLength(2000)
    })

    it('bounds an Error message of a megabyte', async () => {
      await filter.catch(new Error('x'.repeat(1_000_000)))

      expect(payloadOf().message).toHaveLength(2000)
      expect(payloadOf().value).toHaveLength(2000)
    })

    it('writes a thrown string', async () => {
      await filter.catch('payment gateway rejected the settlement')

      expect(payloadOf()).toEqual({
        name: 'string',
        value: "'payment gateway rejected the settlement'"
      })
    })

    // A line even here, so a 500 in the log is never a 500 with no line. The
    // reads are all optional: a filter that throws while handling a throw
    // escapes the pipeline and the route answers no body at all.
    it('writes a line for a thrown null without throwing', async () => {
      await expect(filter.catch(null)).resolves.toBeDefined()

      expect(payloadOf()).toEqual({ name: 'object', value: 'null' })
    })

    // Writing the log line must not cost the caller its response. The filter
    // runs inside `ServerFactory._handleRequest`'s catch block, and that call
    // is not itself guarded, so a filter that throws escapes the request
    // pipeline and the route answers a zero-byte body: the exact failure a
    // thrown `null` used to produce. Everything the record reads is controlled
    // by the throw site, and it can be booby-trapped two ways.
    it('answers a body when reading the thrown value throws', async () => {
      await expect(
        filter.catch({
          get message() {
            throw new Error('this getter is the trap')
          }
        })
      ).resolves.toBeDefined()

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
      // Still a line, so a 500 in the log is never a 500 with no line.
      expect(payloadOf()).toEqual({ name: 'object' })
    })

    // Rendering a value runs its `[util.inspect.custom]` function unless that
    // is turned off. It is not our code, it can throw, and a lying one could
    // hide the incident it was supposed to print.
    it('ignores a custom inspection function on the thrown value', async () => {
      await filter.catch({
        code: 'E_NOPE',
        [inspect.custom]: () => {
          throw new Error('this inspector is the trap')
        }
      })

      expect(payloadOf().value).toContain("code: 'E_NOPE'")
    })

    // `Promise.reject()` with no argument, or a rethrow of a value that turned
    // out to be undefined. `typeof undefined` is the only name there is.
    it('answers and writes a line for a thrown undefined', async () => {
      await expect(filter.catch(undefined)).resolves.toBeDefined()

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
      expect(payloadOf()).toEqual({ name: 'undefined', value: 'undefined' })
    })

    // Length is no longer what stands between the text and the browser, so an
    // Error is not capped, it is dropped. This case exists because the cap
    // above used to be the only thing holding a 5000-character Error back.
    it('drops an unbounded Error text rather than capping it', async () => {
      await filter.catch(new Error('x'.repeat(5000)))

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    // An ApiException IS an Error. Redacting by `instanceof Error` alone would
    // take the message off every 401, 404 and 422 this library raises, which
    // is the whole sentence a caller shows a user.
    it('never redacts an ApiException, which is an Error too', async () => {
      await filter.catch(
        new ApiException(
          '0003',
          'Not Found',
          'Ledger not found',
          HttpStatus.NOT_FOUND
        )
      )

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Ledger not found' },
        { status: 404 }
      )
      expect(consoleError).not.toHaveBeenCalled()
    })

    // One failure has to be ONE log event, and handing `console.error` a record
    // OBJECT does not give that. Node renders the second argument with its own
    // `util.inspect` defaults, `breakLength: 128` and `compact: 3`, which no
    // option on our own `inspect` call can reach: measured through the real
    // request pipeline, this shape printed across SEVEN physical lines and a
    // thrown `Error` fifteen, and flattening the value alone only shortens the
    // first one to five. A line-oriented collector, the
    // Docker json-file driver or Fluent Bit, ships each of those as a separate
    // event, so the taxpayer id arrives in a different event from the
    // `Unhandled exception` label an operator greps for, which is the exact
    // outcome moving the text to the log was meant to prevent.
    //
    // The record is therefore serialised here, not by Node: a string argument
    // is written through verbatim, and JSON has no multi-line string, so a
    // stack's newlines survive as escapes inside one line rather than breaking
    // it. Every other assertion in this file reads the spy's ARGUMENTS, one
    // frame before Node formats them, so none of them can see any of this.
    describe('one failure is one physical log line', () => {
      it('writes a three-level upstream body on one line', async () => {
        await filter.catch({
          message: {
            title: 'Gateway Timeout',
            detail: 'timed out at db-primary.internal:8080',
            errors: { payer: { document: 'cpf 123.456.789-00' } }
          }
        })

        expect(written()).not.toContain('\n')
        // Same line, so a collector ships the incident with the label.
        expect(written().startsWith('Unhandled exception ')).toBe(true)
        expect(written()).toContain('123.456.789-00')
        // And the value is flat inside the record, which is `compact: true`
        // doing its half: without it `util.inspect` breaks a value nested three
        // deep whatever `breakLength` says, and the break would ride along as
        // an escape inside the record for no reason.
        expect(payloadOf().value).not.toContain('\n')
      })

      it('writes an Error and its whole stack on one line', async () => {
        await filter.catch(new Error('connect ECONNREFUSED 10.0.0.5:8080'))

        expect(written()).not.toContain('\n')
        // Not dropped, escaped: the frames are still there as the two
        // characters `\` and `n`, so a consumer parsing the record gets the
        // stack back and a collector still counts one event.
        expect(written()).toContain('\\n    at ')
      })

      // The bytes themselves, with no `util.format` of ours in the way and no
      // spy: a REAL `Console` writing to a captured stream, which is the frame
      // a collector reads. Spying `process.stderr.write` does not reach it,
      // because jest replaces the global console with one that buffers into the
      // test report instead of writing to the process streams, so that spy
      // captures nothing at all and would pass on an empty array.
      it('reaches the stream as one write of one line', async () => {
        const chunks: string[] = []
        const sink = new Writable({
          write(chunk, _encoding, done) {
            chunks.push(String(chunk))
            done()
          }
        })
        const real = new Console({ stdout: sink, stderr: sink })
        const saved = global.console

        global.console = real as unknown as Console
        try {
          await filter.catch({
            message: {
              title: 'Gateway Timeout',
              errors: { payer: { document: 'cpf 123.456.789-00' } }
            }
          })
        } finally {
          global.console = saved
        }

        expect(chunks).toHaveLength(1)
        expect(chunks[0].endsWith('\n')).toBe(true)
        expect(chunks[0].slice(0, -1)).not.toContain('\n')
        expect(chunks[0]).toContain('123.456.789-00')
      })
    })
  })

  // Was named for `NextResponse.json`'s return value and asserted only that the
  // filter hands it back, which is mock plumbing: that assertion holds whatever
  // body, status or code the filter passed, so it read as coverage of a 400
  // path this filter cannot produce. Return propagation is proved for real in
  // the e2e suite, which reads a Response instead of a mock.
  //
  // What IS worth pinning is the `getStatus` stub the old name pointed at. The
  // narrowing above is `instanceof ApiException`, not a duck-type, so a plain
  // object carrying a `getStatus` method is still an unexpected error: the stub
  // is never called and the answer is 500 with the constant body, not the 400
  // the stub would have given.
  it('answers 500 for a value that only looks like an ApiException', async () => {
    const getStatus = jest.fn(() => 400)

    await filter.catch({ message: 'Test', getStatus })

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Internal server error', code: '0004' },
      { status: 500 }
    )
    expect(getStatus).not.toHaveBeenCalled()
  })

  it('should handle ApiException with custom status codes', async () => {
    const testCases = [
      { status: HttpStatus.OK, message: 'OK' },
      { status: HttpStatus.CREATED, message: 'Created' },
      { status: HttpStatus.NOT_FOUND, message: 'Not Found' },
      {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Unprocessable Entity'
      },
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error'
      }
    ]

    for (const testCase of testCases) {
      jest.clearAllMocks()

      const exception = new ApiException(
        'TEST_ERROR',
        'Test Error',
        testCase.message,
        testCase.status
      )

      await filter.catch(exception)

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: testCase.message },
        { status: testCase.status }
      )
    }
  })
})
