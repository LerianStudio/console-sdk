import { HttpException } from './http-exception'
import { HttpStatus } from '../constants/http-status'

describe('HttpException', () => {
  it('should create an instance with a message and default status', () => {
    const message = 'An error occurred'
    const exception = new HttpException(message)

    expect(exception.message).toBe(message)
    expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
  })

  it('should create an instance with a message and custom status', () => {
    const message = 'Not Found'
    const status = HttpStatus.NOT_FOUND
    const exception = new HttpException(message, status)

    expect(exception.message).toBe(message)
    expect(exception.getStatus()).toBe(status)
  })

  it('should return the response object with the message', () => {
    const message = 'An error occurred'
    const exception = new HttpException(message)

    expect(exception.getResponse()).toEqual({ message })
  })

  // This class is exported from the package barrel and it is the TYPE an
  // application's own filter takes: Console's `toExceptionResponse(exception:
  // HttpException)` reads this accessor, so a plain `HttpException` there
  // reaches the base class and not the subclass. It was the third reader of an
  // exception message in this package and the one that got no guard: two lines
  // returning `this.message` raw. `Error.message` is writable, so what arrives
  // here is not what the constructor was given.
  describe('a message written after construction', () => {
    const mutated = (value: unknown) => {
      const exception = new HttpException(
        'no such ledger',
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
      ['undefined', undefined],
      ['a number', 42]
    ])('answers a sentence naming the real status for %s', (_label, value) => {
      const response = mutated(value).getResponse()

      expect(response.message).toBe(
        'Upstream error body carried no problem details (status 404)'
      )
      expect(JSON.stringify(response)).not.toContain('123.456.789-00')
    })

    // A rethrown upstream body used to become a response of the same size.
    it('bounds a five-megabyte message at two thousand characters', () => {
      expect(mutated('x'.repeat(5_000_000)).getResponse().message).toHaveLength(
        2000
      )
    })

    // An accessor that throws inside an application's filter is the zero-byte
    // body again: the filter throws, the throw escapes the request pipeline,
    // and the route answers nothing at all.
    it('answers a sentence when the message getter throws', () => {
      const exception = new HttpException(
        'no such ledger',
        HttpStatus.NOT_FOUND
      )

      Object.defineProperty(exception, 'message', {
        get() {
          throw new Error('trap')
        }
      })

      expect(exception.getResponse().message).toBe(
        'Upstream error body carried no problem details (status 404)'
      )
    })

    // The status is read for the sentence the same guarded way, so an
    // unusable one names a status a response can actually carry.
    it('names 500 when the status cannot be used either', () => {
      const exception = mutated({ title: 'Gateway Timeout' })
      exception.getStatus = () => 204

      expect(exception.getResponse().message).toBe(
        'Upstream error body carried no problem details (status 500)'
      )
    })
  })
})
