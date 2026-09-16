import {
  ApiException,
  BadRequestApiException,
  ValidationApiException,
  UnauthorizedApiException,
  ForbiddenApiException,
  NotFoundApiException,
  UnprocessableEntityApiException,
  InternalServerErrorApiException,
  ServiceUnavailableApiException
} from './api-exception'
import { HttpException } from './http-exception'
import { HttpStatus } from '../constants/http-status'

describe('ApiException', () => {
  describe('ApiException base class', () => {
    it('should create an instance with all required parameters', () => {
      const code = 'TEST001'
      const title = 'Test Error'
      const message = 'This is a test error'
      const status = HttpStatus.BAD_REQUEST

      const exception = new ApiException(code, title, message, status)

      expect(exception.code).toBe(code)
      expect(exception.title).toBe(title)
      expect(exception.message).toBe(message)
      expect(exception.getStatus()).toBe(status)
    })

    it('should create an instance with default status when not provided', () => {
      const code = 'TEST002'
      const title = 'Default Status Error'
      const message = 'This error has default status'

      const exception = new ApiException(code, title, message)

      expect(exception.code).toBe(code)
      expect(exception.title).toBe(title)
      expect(exception.message).toBe(message)
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    it('should extend HttpException', () => {
      const exception = new ApiException(
        'TEST003',
        'Inheritance Test',
        'Testing inheritance'
      )

      expect(exception).toBeInstanceOf(HttpException)
      expect(exception).toBeInstanceOf(Error)
    })

    it('should return the correct response object', () => {
      const code = 'TEST004'
      const title = 'Response Test'
      const message = 'Testing getResponse method'

      const exception = new ApiException(code, title, message)
      const response = exception.getResponse()

      expect(response).toEqual({
        code: code,
        title: title,
        message: message
      })
    })

    it('should have readonly properties for code and title', () => {
      const exception = new ApiException(
        'TEST005',
        'Readonly Test',
        'Testing readonly properties'
      )

      // TypeScript readonly properties are enforced at compile time, not runtime
      // The properties exist and are accessible
      expect(exception.code).toBe('TEST005')
      expect(exception.title).toBe('Readonly Test')

      // Verify they are public readonly properties as defined in the class
      expect(typeof exception.code).toBe('string')
      expect(typeof exception.title).toBe('string')
    })
  })

  describe('BadRequestApiException', () => {
    it('should create an instance with predefined code, title and status', () => {
      const message = 'Invalid request data'
      const exception = new BadRequestApiException(message)

      expect(exception.code).toBe('0000')
      expect(exception.title).toBe('Bad Request')
      expect(exception.message).toBe(message)
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST)
    })

    it('should extend ApiException', () => {
      const exception = new BadRequestApiException('Test message')

      expect(exception).toBeInstanceOf(ApiException)
      expect(exception).toBeInstanceOf(HttpException)
    })

    it('should return the correct response object', () => {
      const message = 'Bad request error'
      const exception = new BadRequestApiException(message)

      expect(exception.getResponse()).toEqual({
        code: '0000',
        title: 'Bad Request',
        message: message
      })
    })
  })

  describe('ValidationApiException', () => {
    it('should create an instance with predefined code, title and status', () => {
      const message = 'Validation failed'
      const exception = new ValidationApiException(message)

      expect(exception.code).toBe('0007')
      expect(exception.title).toBe('Validation Error')
      expect(exception.message).toBe(message)
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST)
    })

    it('should extend ApiException', () => {
      const exception = new ValidationApiException('Test message')

      expect(exception).toBeInstanceOf(ApiException)
      expect(exception).toBeInstanceOf(HttpException)
    })

    it('should return the correct response object', () => {
      const message = 'Field validation error'
      const exception = new ValidationApiException(message)

      expect(exception.getResponse()).toEqual({
        code: '0007',
        title: 'Validation Error',
        message: message
      })
    })
  })

  describe('UnauthorizedApiException', () => {
    it('should create an instance with predefined code, title and status', () => {
      const message = 'Access denied'
      const exception = new UnauthorizedApiException(message)

      expect(exception.code).toBe('0001')
      expect(exception.title).toBe('Unauthorized')
      expect(exception.message).toBe(message)
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED)
    })

    it('should create an instance with default message when not provided', () => {
      const exception = new UnauthorizedApiException()

      expect(exception.code).toBe('0001')
      expect(exception.title).toBe('Unauthorized')
      expect(exception.message).toBe('Unauthorized')
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED)
    })

    it('should extend ApiException', () => {
      const exception = new UnauthorizedApiException('Test message')

      expect(exception).toBeInstanceOf(ApiException)
      expect(exception).toBeInstanceOf(HttpException)
    })

    it('should return the correct response object', () => {
      const message = 'Token expired'
      const exception = new UnauthorizedApiException(message)

      expect(exception.getResponse()).toEqual({
        code: '0001',
        title: 'Unauthorized',
        message: message
      })
    })

    it('should return the correct response object with default message', () => {
      const exception = new UnauthorizedApiException()

      expect(exception.getResponse()).toEqual({
        code: '0001',
        title: 'Unauthorized',
        message: 'Unauthorized'
      })
    })
  })

  describe('ForbiddenApiException', () => {
    it('should create an instance with predefined code, title and status', () => {
      const message = 'Insufficient permissions'
      const exception = new ForbiddenApiException(message)

      expect(exception.code).toBe('0002')
      expect(exception.title).toBe('Forbidden')
      expect(exception.message).toBe(message)
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN)
    })

    it('should extend ApiException', () => {
      const exception = new ForbiddenApiException('Test message')

      expect(exception).toBeInstanceOf(ApiException)
      expect(exception).toBeInstanceOf(HttpException)
    })

    it('should return the correct response object', () => {
      const message = 'Access forbidden'
      const exception = new ForbiddenApiException(message)

      expect(exception.getResponse()).toEqual({
        code: '0002',
        title: 'Forbidden',
        message: message
      })
    })
  })

  describe('NotFoundApiException', () => {
    it('should create an instance with predefined code, title and status', () => {
      const message = 'Resource not found'
      const exception = new NotFoundApiException(message)

      expect(exception.code).toBe('0003')
      expect(exception.title).toBe('Not Found')
      expect(exception.message).toBe(message)
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND)
    })

    it('should extend ApiException', () => {
      const exception = new NotFoundApiException('Test message')

      expect(exception).toBeInstanceOf(ApiException)
      expect(exception).toBeInstanceOf(HttpException)
    })

    it('should return the correct response object', () => {
      const message = 'User not found'
      const exception = new NotFoundApiException(message)

      expect(exception.getResponse()).toEqual({
        code: '0003',
        title: 'Not Found',
        message: message
      })
    })
  })

  describe('UnprocessableEntityApiException', () => {
    it('should create an instance with predefined code, title and status', () => {
      const message = 'Entity cannot be processed'
      const exception = new UnprocessableEntityApiException(message)

      expect(exception.code).toBe('0006')
      expect(exception.title).toBe('Unprocessable Entity')
      expect(exception.message).toBe(message)
      expect(exception.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
    })

    it('should extend ApiException', () => {
      const exception = new UnprocessableEntityApiException('Test message')

      expect(exception).toBeInstanceOf(ApiException)
      expect(exception).toBeInstanceOf(HttpException)
    })

    it('should return the correct response object', () => {
      const message = 'Semantic errors in request'
      const exception = new UnprocessableEntityApiException(message)

      expect(exception.getResponse()).toEqual({
        code: '0006',
        title: 'Unprocessable Entity',
        message: message
      })
    })
  })

  describe('InternalServerErrorApiException', () => {
    it('should create an instance with predefined code, title and status', () => {
      const message = 'Internal server error occurred'
      const exception = new InternalServerErrorApiException(message)

      expect(exception.code).toBe('0004')
      expect(exception.title).toBe('Internal Server Error')
      expect(exception.message).toBe(message)
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    it('should extend ApiException', () => {
      const exception = new InternalServerErrorApiException('Test message')

      expect(exception).toBeInstanceOf(ApiException)
      expect(exception).toBeInstanceOf(HttpException)
    })

    it('should return the correct response object', () => {
      const message = 'Database connection failed'
      const exception = new InternalServerErrorApiException(message)

      expect(exception.getResponse()).toEqual({
        code: '0004',
        title: 'Internal Server Error',
        message: message
      })
    })
  })

  describe('ServiceUnavailableApiException', () => {
    it('should create an instance with predefined code, title and status', () => {
      const message = 'Service temporarily unavailable'
      const exception = new ServiceUnavailableApiException(message)

      expect(exception.code).toBe('0005')
      expect(exception.title).toBe('Service Unavailable')
      expect(exception.message).toBe(message)
      expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE)
    })

    it('should extend ApiException', () => {
      const exception = new ServiceUnavailableApiException('Test message')

      expect(exception).toBeInstanceOf(ApiException)
      expect(exception).toBeInstanceOf(HttpException)
    })

    it('should return the correct response object', () => {
      const message = 'Server overloaded'
      const exception = new ServiceUnavailableApiException(message)

      expect(exception.getResponse()).toEqual({
        code: '0005',
        title: 'Service Unavailable',
        message: message
      })
    })
  })

  // `message` used to be a constructor parameter property, so it replaced
  // `Error.message` with whatever was handed in — and `getResponse()` ships
  // `message` straight to the browser. Anything that is not already a string
  // is now reduced to a bounded sentence before it gets there.
  describe('message coercion', () => {
    it('keeps a string message exactly as given', () => {
      const exception = new ApiException('0001', 'Title', 'Account not found')

      expect(exception.message).toBe('Account not found')
    })

    it('reduces an upstream problem object to its title', () => {
      const exception = new ApiException('0005', 'Service Unavailable', {
        title: 'Gateway Timeout',
        detail: 'cpf 123.456.789-00 timed out at db-primary.internal',
        errors: [{ field: 'taxId', value: '123.456.789-00' }]
      })

      expect(exception.message).toBe('Gateway Timeout')
      expect(JSON.stringify(exception.getResponse())).not.toContain(
        '123.456.789-00'
      )
      expect(JSON.stringify(exception.getResponse())).not.toContain(
        'db-primary.internal'
      )
    })

    it('falls back to the problem code when there is no title', () => {
      const exception = new ApiException('0005', 'Service Unavailable', {
        code: 'ALREADY_EXISTS'
      })

      expect(exception.message).toBe('ALREADY_EXISTS')
    })

    it('names the status when the object classifies nothing', () => {
      const exception = new ApiException(
        '0005',
        'Service Unavailable',
        { detail: 'something went wrong' },
        HttpStatus.BAD_GATEWAY
      )

      // One sentence for one condition: the transport and this constructor
      // both say `noProblemDetails(status)` now, so a caller cannot tell which
      // frame gave up on the body.
      expect(exception.message).toBe(
        'Upstream error body carried no problem details (status 502)'
      )
    })

    // Three Console transports do `throw new ServiceUnavailableApiException(
    // error)` from a `catch (error: any)`, so an `Error` arrives here whole.
    // Its message is what broke, not what the caller may be told: taking it
    // put `fetch failed: connect ECONNREFUSED 10.0.0.5:8080` on the wire.
    it('never takes an Error own message', () => {
      const exception = new ApiException(
        '0005',
        'Service Unavailable',
        new TypeError('fetch failed: connect ECONNREFUSED 10.0.0.5:8080'),
        HttpStatus.SERVICE_UNAVAILABLE
      )

      expect(exception.message).not.toContain('10.0.0.5')
      expect(exception.message).not.toContain('8080')
      expect(JSON.stringify(exception.getResponse())).not.toContain('10.0.0.5')
    })

    it('names the status when there is no message at all', () => {
      const exception = new ApiException(
        '0005',
        'Service Unavailable',
        undefined,
        HttpStatus.SERVICE_UNAVAILABLE
      )

      expect(exception.message).toBe(
        'Upstream error body carried no problem details (status 503)'
      )
      expect(typeof exception.getResponse().message).toBe('string')
    })

    it('caps an upstream title at 200 characters', () => {
      const exception = new ApiException('0005', 'Service Unavailable', {
        title: 'T'.repeat(4000)
      })

      expect(exception.message).toHaveLength(200)
    })

    // `getResponse()` spread the metadata over the three named fields rather
    // than under them, so a caller that put a `message` key in metadata
    // replaced the coerced sentence with whatever it held and undid the
    // coercion one line above it. Metadata extends the body; the named fields
    // are the contract. Console passes `{ details }` here today, and `message`
    // is the next key anyone reaches for.
    it('metadata never replaces the named fields', () => {
      const exception = new ApiException(
        '0005',
        'Service Unavailable',
        'Upstream timed out',
        HttpStatus.SERVICE_UNAVAILABLE,
        {
          message: { detail: 'cpf 123.456.789-00' },
          code: '9999',
          title: 'Overwritten',
          details: { requestId: 'r-1' }
        }
      )

      const response = exception.getResponse()

      expect(response.message).toBe('Upstream timed out')
      expect(response.code).toBe('0005')
      expect(response.title).toBe('Service Unavailable')
      expect(response).toMatchObject({ details: { requestId: 'r-1' } })
      expect(JSON.stringify(response)).not.toContain('123.456.789-00')
    })

    // `getResponse()` is the OTHER caller of a typed exception's message, and
    // the one an application serialises itself: Product Console spreads it
    // into its own envelope. The constructor reduces and bounds the message it
    // is handed, but `Error.message` is a writable property, so a value written
    // after construction reached here untouched - an upstream problem object
    // under a field documented as a sentence, a missing field for `undefined`,
    // or a rethrown 5 MB body served to a browser.
    //
    // The guard belongs where the message is READ, so both callers get it from
    // one place: the filter's typed branch and this accessor.
    describe('a message written after construction', () => {
      const mutated = (value: unknown) => {
        const exception = new NotFoundApiException('Ledger not found')
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
      ])('names the real status for %s', (_label, value) => {
        const response = mutated(value).getResponse()

        expect(response.message).toBe(
          'Upstream error body carried no problem details (status 404)'
        )
        expect(response.code).toBe('0003')
        expect(JSON.stringify(response)).not.toContain('123.456.789-00')
        expect(JSON.stringify(response)).not.toContain('Gateway Timeout')
      })

      it('bounds a message written after construction', () => {
        expect(
          mutated('x'.repeat(1_000_000)).getResponse().message
        ).toHaveLength(2000)
      })

      // The status is read here too, to name it in the fallback, and it is
      // read from a method a subclass may override with anything. An accessor
      // that throws takes its route down with it, so both reads answer rather
      // than throw, and a status no Response can carry is not one.
      it.each([['a throw'], [0], [700]])(
        'answers a body when getStatus gives %s',
        (status) => {
          const broken = (exception: NotFoundApiException) => {
            exception.getStatus = () => {
              if (status === 'a throw') throw new Error('trap')
              return status as number
            }
            return exception
          }

          // A usable message is still answered, and the accessor does not
          // throw on its way there.
          expect(
            broken(new NotFoundApiException('Ledger not found')).getResponse()
          ).toMatchObject({
            code: '0003',
            title: 'Not Found',
            message: 'Ledger not found'
          })

          // And a message that needs the fallback gets one naming a status a
          // response can actually carry.
          expect(
            broken(mutated({ title: 'Gateway Timeout' }) as any).getResponse()
              .message
          ).toBe('Upstream error body carried no problem details (status 500)')
        }
      )

      // Reading it must not throw either: an application renders this body
      // itself, and an accessor that throws takes its route down with it.
      it('answers a sentence when the message getter throws', () => {
        const exception = new NotFoundApiException('Ledger not found')

        Object.defineProperty(exception, 'message', {
          get() {
            throw new Error('trap')
          }
        })

        expect(exception.getResponse().message).toBe(
          'Upstream error body carried no problem details (status 404)'
        )
      })
    })

    // The third value this frame reads, and the last one that was still taken
    // rather than read. Spreading metadata invokes every own enumerable
    // accessor the route attached, and the body is serialised one frame later,
    // so the two ways a route's own object breaks this accessor are a getter
    // that throws and a value JSON refuses.
    describe('metadata a route attached', () => {
      let consoleError: jest.SpyInstance

      beforeEach(() => {
        consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      })

      afterEach(() => {
        consoleError.mockRestore()
      })

      const announced = () =>
        JSON.parse(
          consoleError.mock.calls.find(
            (call) => call[0] === 'Exception metadata dropped'
          )?.[1] as string
        )

      // Nothing an ordinary route writes moves. Console passes `{ details }`
      // here today, and `ValidationApiException` passes every Zod issue of a
      // rejected form, so this is the shape the guard must leave alone.
      it('carries a plain object through unchanged', () => {
        const details = { field: 'payer', issues: ['required'] }

        expect(
          new ApiException(
            '0007',
            'Validation Error',
            'Invalid payload',
            HttpStatus.BAD_REQUEST,
            { details }
          ).getResponse()
        ).toEqual({
          details,
          code: '0007',
          title: 'Validation Error',
          message: 'Invalid payload'
        })

        expect(consoleError).not.toHaveBeenCalled()
      })

      it('answers the named fields when a metadata getter throws', () => {
        const metadata: Record<string, unknown> = {}

        Object.defineProperty(metadata, 'details', {
          enumerable: true,
          get() {
            throw new Error('metadata getter exploded')
          }
        })

        expect(
          new ApiException(
            '0003',
            'Not Found',
            'Ledger not found',
            HttpStatus.NOT_FOUND,
            metadata
          ).getResponse()
        ).toEqual({
          code: '0003',
          title: 'Not Found',
          message: 'Ledger not found'
        })

        expect(announced()).toEqual({
          code: '0003',
          title: 'Not Found',
          cause: 'metadata getter exploded'
        })
      })

      // A `bigint` is what a pg driver hands back for an int64 amount, so a
      // ledger route reaches this with no override at all. Nothing throws
      // while this body is built; the throw lands where it is serialised.
      it('answers the named fields for a value JSON refuses', () => {
        expect(
          new ApiException(
            '0003',
            'Not Found',
            'Ledger not found',
            HttpStatus.NOT_FOUND,
            { amount: BigInt('9007199254740993') }
          ).getResponse()
        ).toEqual({
          code: '0003',
          title: 'Not Found',
          message: 'Ledger not found'
        })

        expect(announced().cause).toBe('Do not know how to serialize a BigInt')
      })

      // The reason is an override's own text and has a size this package does
      // not control, the same argument every other string here is bounded on.
      it('bounds the reason the metadata was dropped', () => {
        const metadata: Record<string, unknown> = {}

        Object.defineProperty(metadata, 'details', {
          enumerable: true,
          get() {
            throw new Error('x'.repeat(1_000_000))
          }
        })

        new ApiException(
          '0003',
          'Not Found',
          'Ledger not found',
          HttpStatus.NOT_FOUND,
          metadata
        ).getResponse()

        expect(announced().cause).toHaveLength(2000)
      })
    })
  })

  // The last two values this body answers, and the two that were still taken
  // rather than read after the metadata guard landed. Neither needs an
  // override or a cast to go wrong: `code: string` is satisfied by the `any` a
  // database row is, and `title` is a writable property a route can set after
  // construction, which is how `message` reached the wire as an object.
  describe('the classification a route wrote', () => {
    let consoleError: jest.SpyInstance

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleError.mockRestore()
    })

    const announced = () =>
      JSON.parse(
        consoleError.mock.calls.find(
          (call) => call[0] === 'Exception classification dropped'
        )?.[1] as string
      )

    it('answers the unclassified code when the code getter throws', () => {
      const exception = new NotFoundApiException('Ledger not found')

      Object.defineProperty(exception, 'code', {
        get() {
          throw new Error('code getter exploded')
        }
      })

      expect(exception.getResponse()).toEqual({
        code: '0004',
        title: 'Not Found',
        message: 'Ledger not found'
      })

      expect(announced()).toEqual({ dropped: ['code'], status: 404 })
    })

    it('answers the status title when the title is an object', () => {
      const exception = new NotFoundApiException('Ledger not found')
      ;(exception as any).title = {
        title: 'Gateway Timeout',
        detail: 'timed out at db-primary.internal:8080'
      }

      expect(exception.getResponse()).toEqual({
        code: '0003',
        title: 'Not Found',
        message: 'Ledger not found'
      })

      expect(announced()).toEqual({ dropped: ['title'], status: 404 })
    })

    // Both at once, in the two shapes the serialiser refuses rather than the
    // two a read refuses: a `bigint` is what a pg driver hands back for an
    // int64, and a cycle is what a record built from a graph carries. Neither
    // throws while this body is built; both take the frame that serialises it.
    it('answers both fallbacks in one line when neither is readable', () => {
      const cyclic: Record<string, unknown> = {}
      cyclic.self = cyclic

      const body = new ApiException(
        BigInt(7) as any,
        cyclic as any,
        'Ledger not found',
        HttpStatus.NOT_FOUND
      ).getResponse()

      expect(body).toEqual({
        code: '0004',
        title: 'Not Found',
        message: 'Ledger not found'
      })
      // The frame that used to fail, one after this one.
      expect(() => JSON.stringify(body)).not.toThrow()
      expect(consoleError).toHaveBeenCalledTimes(1)
      expect(announced()).toEqual({ dropped: ['code', 'title'], status: 404 })
    })

    // Both are written by an upstream as often as by a route, which is the
    // argument `PROBLEM_FIELD_MAX_LENGTH` already makes for the same two
    // fields when a body is reduced to a sentence.
    it('bounds a code and a title an upstream sized', () => {
      const body = new ApiException(
        'x'.repeat(5000),
        'y'.repeat(5000),
        'Ledger not found',
        HttpStatus.NOT_FOUND
      ).getResponse()

      expect(body.code).toHaveLength(200)
      expect(body.title).toHaveLength(200)
      expect(consoleError).not.toHaveBeenCalled()
    })

    // The fallback title is the reason phrase of the status the response is
    // actually built with, which is the title every typed exception in this
    // file already carries for its own status. A status the registry has no
    // phrase for names itself rather than borrowing 500's.
    it('names a status the registry has no phrase for', () => {
      const body = new ApiException(
        '0003',
        undefined as any,
        'Ledger not found',
        599
      ).getResponse()

      expect(body.title).toBe('Error 599')
      expect(announced()).toEqual({ dropped: ['title'], status: 599 })
    })
  })
})
