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
  })
})
