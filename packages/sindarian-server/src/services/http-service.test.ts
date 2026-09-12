import { HttpService, FetchModuleOptions } from './http-service'
import { HttpStatus } from '../constants/http-status'
import {
  ApiException,
  BadRequestApiException,
  ForbiddenApiException,
  InternalServerErrorApiException,
  NotFoundApiException,
  ServiceUnavailableApiException,
  UnauthorizedApiException,
  UnprocessableEntityApiException
} from '../exceptions/api-exception'

// Mock the global fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock createQueryString
jest.mock('@/utils/search/create-query-string', () => ({
  createQueryString: jest.fn((search?: object) => {
    if (!search) return ''
    const params = new URLSearchParams()
    Object.entries(search).forEach(([key, value]) => {
      params.append(key, String(value))
    })
    return params.toString() ? `?${params.toString()}` : ''
  })
}))

// Create a concrete implementation of HttpService for testing
class TestHttpService extends HttpService {
  public async testCreateRequest(
    url: string | URL,
    options: FetchModuleOptions
  ) {
    return (this as any).createRequest(url, options)
  }

  public async testCreateRequestFormData(
    url: string | URL,
    options: FetchModuleOptions
  ) {
    return (this as any).createRequestFormData(url, options)
  }

  public testObjectToFormData(data: Record<string, any>) {
    return (this as any).objectToFormData(data)
  }

  public async testRequest<T>(request: Request): Promise<T> {
    return this.request<T>(request)
  }

  // Override protected methods for testing
  protected onBeforeFetch = jest.fn()
  protected onAfterFetch = jest.fn()
  protected catch = jest.fn()
  protected createDefaults = jest.fn().mockResolvedValue({})
}

// Same, but keeping the REAL default `catch` so its log line can be asserted
class DefaultCatchHttpService extends HttpService {
  public async testRequest<T>(request: Request): Promise<T> {
    return this.request<T>(request)
  }

  protected createDefaults = jest.fn().mockResolvedValue({})
}

describe('HttpService', () => {
  let httpService: TestHttpService
  let mockResponse: Partial<Response>
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    httpService = new TestHttpService()
    jest.clearAllMocks()

    // Spy on console.error to test catch method
    consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      json: jest.fn().mockResolvedValue({ data: 'test' }),
      text: jest.fn().mockResolvedValue('test text')
    }

    mockFetch.mockResolvedValue(mockResponse as Response)
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('request method', () => {
    it('should make a successful request', async () => {
      const mockRequest = new Request('https://api.example.com/test')
      const result = await httpService.testRequest(mockRequest)

      expect(httpService.onBeforeFetch).toHaveBeenCalledWith(mockRequest)
      expect(mockFetch).toHaveBeenCalledWith(mockRequest)
      expect(httpService.onAfterFetch).toHaveBeenCalledWith(
        mockRequest,
        mockResponse
      )
      expect(result).toEqual({ data: 'test' })
    })

    it('should handle 204 No Content response', async () => {
      mockResponse.status = HttpStatus.NO_CONTENT
      const mockRequest = new Request('https://api.example.com/test')

      const result = await httpService.testRequest(mockRequest)

      expect(result).toEqual({})
    })

    it('should handle text/plain error responses', async () => {
      mockResponse.ok = false
      mockResponse.status = HttpStatus.BAD_REQUEST
      mockResponse.headers = new Headers({ 'content-type': 'text/plain' })
      mockResponse.text = jest.fn().mockResolvedValue('Bad request')

      const mockRequest = new Request('https://api.example.com/test')

      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        BadRequestApiException
      )
      expect(httpService.catch).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        { text: 'Bad request' }
      )
    })

    it('should throw UnauthorizedApiException for 401 text/plain response', async () => {
      mockResponse.ok = false
      mockResponse.status = HttpStatus.UNAUTHORIZED
      mockResponse.headers = new Headers({ 'content-type': 'text/plain' })
      mockResponse.text = jest.fn().mockResolvedValue('Unauthorized')

      const mockRequest = new Request('https://api.example.com/test')

      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        UnauthorizedApiException
      )
    })

    it('should throw NotFoundApiException for 404 text/plain response', async () => {
      mockResponse.ok = false
      mockResponse.status = HttpStatus.NOT_FOUND
      mockResponse.headers = new Headers({ 'content-type': 'text/plain' })
      mockResponse.text = jest.fn().mockResolvedValue('Not found')

      const mockRequest = new Request('https://api.example.com/test')

      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        NotFoundApiException
      )
    })

    it('should throw UnprocessableEntityApiException for 422 text/plain response', async () => {
      mockResponse.ok = false
      mockResponse.status = HttpStatus.UNPROCESSABLE_ENTITY
      mockResponse.headers = new Headers({ 'content-type': 'text/plain' })
      mockResponse.text = jest.fn().mockResolvedValue('Unprocessable entity')

      const mockRequest = new Request('https://api.example.com/test')

      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        UnprocessableEntityApiException
      )
    })

    it('should throw InternalServerErrorApiException for 500 text/plain response', async () => {
      mockResponse.ok = false
      mockResponse.status = HttpStatus.INTERNAL_SERVER_ERROR
      mockResponse.headers = new Headers({ 'content-type': 'text/plain' })
      mockResponse.text = jest.fn().mockResolvedValue('Internal server error')

      const mockRequest = new Request('https://api.example.com/test')

      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        InternalServerErrorApiException
      )
    })

    it('should handle JSON error responses', async () => {
      mockResponse.ok = false
      mockResponse.status = HttpStatus.BAD_REQUEST
      mockResponse.json = jest.fn().mockResolvedValue({ error: 'Bad request' })
      mockResponse.text = jest
        .fn()
        .mockResolvedValue(JSON.stringify({ error: 'Bad request' }))

      const mockRequest = new Request('https://api.example.com/test')

      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        BadRequestApiException
      )
      expect(httpService.catch).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        { error: 'Bad request' }
      )
    })

    it('should throw UnauthorizedApiException for 401 JSON response', async () => {
      mockResponse.ok = false
      mockResponse.status = HttpStatus.UNAUTHORIZED
      mockResponse.json = jest.fn().mockResolvedValue({ error: 'Unauthorized' })

      const mockRequest = new Request('https://api.example.com/test')

      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        UnauthorizedApiException
      )
    })

    it('should rethrow ApiException instances', async () => {
      const apiError = new NotFoundApiException('Resource not found')
      mockFetch.mockRejectedValue(apiError)

      const mockRequest = new Request('https://api.example.com/test')

      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        NotFoundApiException
      )
      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        'Resource not found'
      )
    })

    it('should wrap non-ApiException errors in ServiceUnavailableApiException', async () => {
      const networkError = new Error('Network error')
      mockFetch.mockRejectedValue(networkError)

      const mockRequest = new Request('https://api.example.com/test')

      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        ServiceUnavailableApiException
      )
    })
  })

  describe('HTTP methods', () => {
    beforeEach(() => {
      // Set up default baseUrl for HTTP method tests
      httpService.createDefaults = jest.fn().mockResolvedValue({
        baseUrl: 'https://api.example.com'
      })
    })

    it('should make GET request', async () => {
      const result = await httpService.get('/test', {
        headers: { Authorization: 'Bearer token' }
      })

      expect(mockFetch).toHaveBeenCalled()
      const [request] = mockFetch.mock.calls[0]
      expect(request.method).toBe('GET')
      expect(result).toEqual({ data: 'test' })
    })

    it('should make POST request', async () => {
      const data = { name: 'test' }
      await httpService.post('/test', { body: JSON.stringify(data) })

      const [request] = mockFetch.mock.calls[0]
      expect(request.method).toBe('POST')
    })

    it('should make PUT request', async () => {
      await httpService.put('/test', { body: JSON.stringify({ id: 1 }) })

      const [request] = mockFetch.mock.calls[0]
      expect(request.method).toBe('PUT')
    })

    it('should make PATCH request', async () => {
      await httpService.patch('/test', {
        body: JSON.stringify({ name: 'updated' })
      })

      const [request] = mockFetch.mock.calls[0]
      expect(request.method).toBe('PATCH')
    })

    it('should make DELETE request', async () => {
      await httpService.delete('/test')

      const [request] = mockFetch.mock.calls[0]
      expect(request.method).toBe('DELETE')
    })

    it('should make HEAD request', async () => {
      await httpService.head('/test')

      const [request] = mockFetch.mock.calls[0]
      expect(request.method).toBe('HEAD')
    })
  })

  describe('FormData methods', () => {
    describe('objectToFormData', () => {
      it('should convert simple object to FormData', () => {
        const data = { name: 'test', age: 25 }
        const formData = httpService.testObjectToFormData(data)

        expect(formData.get('name')).toBe('test')
        expect(formData.get('age')).toBe('25')
      })

      it('should handle File objects', () => {
        const file = new File(['content'], 'test.txt', { type: 'text/plain' })
        const data = { file }
        const formData = httpService.testObjectToFormData(data)

        expect(formData.get('file')).toBe(file)
      })

      it('should handle arrays', () => {
        const data = { tags: ['tag1', 'tag2', 'tag3'] }
        const formData = httpService.testObjectToFormData(data)

        expect(formData.get('tags[0]')).toBe('tag1')
        expect(formData.get('tags[1]')).toBe('tag2')
        expect(formData.get('tags[2]')).toBe('tag3')
      })

      it('should handle arrays with File objects', () => {
        const file1 = new File(['content1'], 'test1.txt')
        const file2 = new File(['content2'], 'test2.txt')
        const data = { files: [file1, file2] }
        const formData = httpService.testObjectToFormData(data)

        expect(formData.get('files[0]')).toBe(file1)
        expect(formData.get('files[1]')).toBe(file2)
      })

      it('should handle nested objects', () => {
        const data = { user: { name: 'John', profile: { age: 30 } } }
        const formData = httpService.testObjectToFormData(data)

        expect(formData.get('user')).toBe(
          JSON.stringify({ name: 'John', profile: { age: 30 } })
        )
      })

      it('should skip null and undefined values', () => {
        const data = {
          name: 'test',
          nullValue: null,
          undefinedValue: undefined
        }
        const formData = httpService.testObjectToFormData(data)

        expect(formData.get('name')).toBe('test')
        expect(formData.get('nullValue')).toBeNull()
        expect(formData.get('undefinedValue')).toBeNull()
      })

      it('should convert non-string values to strings', () => {
        const testDate = new Date('2023-01-01')
        const data = { number: 42, boolean: true, date: testDate }
        const formData = httpService.testObjectToFormData(data)

        expect(formData.get('number')).toBe('42')
        expect(formData.get('boolean')).toBe('true')
        // Date objects are treated as objects and get JSON.stringify applied
        expect(formData.get('date')).toBe(JSON.stringify(testDate))
      })
    })

    it('should make POST request with FormData', async () => {
      // Set up default baseUrl for FormData tests
      httpService.createDefaults = jest.fn().mockResolvedValue({
        baseUrl: 'https://api.example.com'
      })

      const data = { name: 'test', file: new File(['content'], 'test.txt') }
      await httpService.postFormData('/upload', data)

      const [request] = mockFetch.mock.calls[0]
      expect(request.method).toBe('POST')
      // The body becomes a ReadableStream when the Request is created with FormData
      expect(request.body).toBeDefined()
    })

    it('should make PATCH request with FormData', async () => {
      // Set up default baseUrl for FormData tests
      httpService.createDefaults = jest.fn().mockResolvedValue({
        baseUrl: 'https://api.example.com'
      })

      const data = { name: 'updated' }
      await httpService.patchFormData('/update', data)

      const [request] = mockFetch.mock.calls[0]
      expect(request.method).toBe('PATCH')
      // The body becomes a ReadableStream when the Request is created with FormData
      expect(request.body).toBeDefined()
    })
  })

  describe('createRequest', () => {
    it('should create request with baseUrl and search params', async () => {
      httpService.createDefaults = jest.fn().mockResolvedValue({
        baseUrl: 'https://api.example.com',
        headers: { 'User-Agent': 'Test' }
      })

      const request = await httpService.testCreateRequest('/test', {
        search: { page: 1, limit: 10 },
        headers: { Authorization: 'Bearer token' }
      })

      expect(request.url).toBe('https://api.example.com/test?page=1&limit=10')
      expect(request.headers.get('User-Agent')).toBe('Test')
      expect(request.headers.get('Authorization')).toBe('Bearer token')
    })

    it('should merge headers correctly', async () => {
      httpService.createDefaults = jest.fn().mockResolvedValue({
        baseUrl: 'https://api.example.com',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Default' }
      })

      const request = await httpService.testCreateRequest('/test', {
        headers: { Authorization: 'Bearer token', 'User-Agent': 'Custom' }
      })

      expect(request.headers.get('Content-Type')).toBe('application/json')
      expect(request.headers.get('Authorization')).toBe('Bearer token')
      expect(request.headers.get('User-Agent')).toBe('Custom') // Should override default
    })
  })

  describe('createRequestFormData', () => {
    it('should remove Content-Type headers for FormData requests', async () => {
      httpService.createDefaults = jest.fn().mockResolvedValue({
        baseUrl: 'https://api.example.com',
        headers: { 'Content-Type': 'application/json' }
      })

      const request = await httpService.testCreateRequestFormData('/test', {
        headers: {
          'content-type': 'application/json',
          Authorization: 'Bearer token'
        }
      })

      expect(request.headers.get('Content-Type')).toBeNull()
      expect(request.headers.get('content-type')).toBeNull()
      expect(request.headers.get('Authorization')).toBe('Bearer token')
    })
  })

  describe('lifecycle hooks', () => {
    it('should call onBeforeFetch and onAfterFetch', async () => {
      const mockRequest = new Request('https://api.example.com/test')
      await httpService.testRequest(mockRequest)

      expect(httpService.onBeforeFetch).toHaveBeenCalledWith(mockRequest)
      expect(httpService.onAfterFetch).toHaveBeenCalledWith(
        mockRequest,
        mockResponse
      )
    })

    it('should call catch method on error responses', async () => {
      mockResponse.ok = false
      mockResponse.status = HttpStatus.BAD_REQUEST
      mockResponse.json = jest.fn().mockResolvedValue({ error: 'Bad request' })
      mockResponse.text = jest
        .fn()
        .mockResolvedValue(JSON.stringify({ error: 'Bad request' }))

      const mockRequest = new Request('https://api.example.com/test')

      try {
        await httpService.testRequest(mockRequest)
      } catch (error) {
        // Expected to throw
      }

      expect(httpService.catch).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        { error: 'Bad request' }
      )
    })
  })

  describe('error handling edge cases', () => {
    it('should keep the status when the error body is unparseable', async () => {
      mockResponse.ok = false
      mockResponse.status = HttpStatus.BAD_REQUEST
      // Only `text` is stubbed: the body is read as text and parsed here, so
      // `response.json()` is never called on a failed response any more.
      mockResponse.text = jest.fn().mockResolvedValue('not json at all')

      const mockRequest = new Request('https://api.example.com/test')

      // An unreadable body is not a reason to forget that the upstream said
      // 400: the body decides the message, never the status.
      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        BadRequestApiException
      )
    })

    it('should handle response.text() throwing an error for text/plain', async () => {
      mockResponse.ok = false
      mockResponse.status = HttpStatus.BAD_REQUEST
      mockResponse.headers = new Headers({ 'content-type': 'text/plain' })
      mockResponse.text = jest
        .fn()
        .mockRejectedValue(new Error('Cannot read text'))

      const mockRequest = new Request('https://api.example.com/test')

      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        ServiceUnavailableApiException
      )
    })
  })

  // Three defects in how the transport handled a FAILED upstream call. Each
  // test names the leak or the lost status it guards, because each one reached
  // production once.
  describe('failed upstream calls', () => {
    it('logs no part of the problem body and no query string', async () => {
      const service = new DefaultCatchHttpService()
      const problem = {
        type: 'https://hub.example.com/problems/validation',
        title: 'Unprocessable Entity',
        status: 422,
        detail:
          'destination https://webhook.acme.internal/secret-path was rejected',
        errors: [{ message: 'taxId 123.456.789-00 is invalid' }]
      }

      mockResponse.ok = false
      mockResponse.status = HttpStatus.UNPROCESSABLE_ENTITY
      mockResponse.text = jest.fn().mockResolvedValue(JSON.stringify(problem))
      mockResponse.json = jest.fn().mockResolvedValue(problem)

      const mockRequest = new Request(
        'https://api.example.com/v1/destinations?token=s3cr3t-token'
      )

      await expect(service.testRequest(mockRequest)).rejects.toThrow(
        UnprocessableEntityApiException
      )

      const logged = JSON.stringify(consoleSpy.mock.calls)

      // The body, and everything a body can carry.
      expect(logged).not.toContain('webhook.acme.internal')
      expect(logged).not.toContain('secret-path')
      expect(logged).not.toContain('taxId')
      // The query string, which carries tokens and filters just as freely.
      expect(logged).not.toContain('s3cr3t-token')

      // What an operator actually needs to act.
      expect(logged).toContain('https://api.example.com/v1/destinations')
      expect(logged).toContain('422')
      expect(logged).toContain('Unprocessable Entity')
    })

    it('keeps a bodiless 401 a 401 instead of a 503', async () => {
      mockResponse.ok = false
      mockResponse.status = HttpStatus.UNAUTHORIZED
      mockResponse.headers = new Headers({
        'content-type': 'application/json'
      })
      mockResponse.text = jest.fn().mockResolvedValue('')
      mockResponse.json = jest
        .fn()
        .mockRejectedValue(new SyntaxError('Unexpected end of JSON input'))

      const mockRequest = new Request('https://api.example.com/test')

      const error = await httpService
        .testRequest(mockRequest)
        .catch((thrown) => thrown)

      expect(error).toBeInstanceOf(UnauthorizedApiException)
      expect(error).not.toBeInstanceOf(SyntaxError)
      expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED)

      // The hook still runs, and still sees the real upstream status.
      expect(httpService.catch).toHaveBeenCalledTimes(1)
      const [, passedResponse] = (httpService.catch as unknown as jest.Mock)
        .mock.calls[0]
      expect(passedResponse.status).toBe(HttpStatus.UNAUTHORIZED)
    })

    it('never puts a non-JSON error body in the thrown message', async () => {
      const html =
        '<html><body>502 Bad Gateway - proxy-internal.acme</body></html>'

      mockResponse.ok = false
      mockResponse.status = HttpStatus.BAD_GATEWAY
      mockResponse.headers = new Headers({ 'content-type': 'text/html' })
      mockResponse.text = jest.fn().mockResolvedValue(html)
      mockResponse.json = jest
        .fn()
        .mockRejectedValue(
          new SyntaxError(
            `Unexpected token '<', "${html.slice(0, 10)}"... is not valid JSON`
          )
        )

      const mockRequest = new Request('https://api.example.com/test')

      const error = await httpService
        .testRequest(mockRequest)
        .catch((thrown) => thrown)

      expect(error).toBeInstanceOf(ServiceUnavailableApiException)
      expect(error.message).not.toContain('<html>')
      expect(error.message).not.toContain('proxy-internal')
      expect(error.message).toContain('502')
    })
  })

  // Round 2. Everything a failed call is allowed to tell the caller: the
  // status it really was, and a sentence that came from us rather than from
  // the upstream body. Fixtures are real `Response` objects so a body can only
  // be read once, exactly as in production.
  describe('what a failed call tells the caller', () => {
    const upstream = 'https://api.example.com/test'

    it('keeps a text/plain body out of the thrown message', async () => {
      mockFetch.mockResolvedValue(
        new Response('upstream down: db-primary.internal', {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          headers: { 'content-type': 'text/plain' }
        })
      )
      const mockRequest = new Request(upstream)

      const error = await httpService
        .testRequest(mockRequest)
        .catch((thrown) => thrown)

      expect(error).toBeInstanceOf(ServiceUnavailableApiException)
      expect(typeof error.message).toBe('string')
      expect(error.message).not.toContain('db-primary.internal')
      expect(error.message).not.toContain('upstream down')

      // The hook still receives the text: a transport that knows its own
      // upstream may still read it, it just never becomes the thrown sentence.
      // Under `text`, never `message` — see 'the text handed to the catch hook'.
      expect(httpService.catch).toHaveBeenCalledWith(
        mockRequest,
        expect.any(Response),
        { text: 'upstream down: db-primary.internal' }
      )
    })

    it('never makes the upstream JSON body the exception message', async () => {
      const problem = {
        type: 'about:blank',
        title: 'Internal Server Error',
        detail: 'cpf 123.456.789-00 not found in ledger ldg-42'
      }
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify(problem), {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          headers: { 'content-type': 'application/problem+json' }
        })
      )

      const error = await httpService
        .testRequest(new Request(upstream))
        .catch((thrown) => thrown)

      expect(error).toBeInstanceOf(InternalServerErrorApiException)
      // Only the bounded classification survives, never `detail`.
      expect(error.message).toBe('Internal Server Error')
      expect(typeof error.getResponse().message).toBe('string')
      expect(JSON.stringify(error.getResponse())).not.toContain(
        '123.456.789-00'
      )
      expect(JSON.stringify(error.getResponse())).not.toContain('ldg-42')
    })

    it('keeps the upstream host and port out of a network failure', async () => {
      const networkError = new TypeError(
        'fetch failed: connect ECONNREFUSED 10.0.0.5:8080'
      )
      mockFetch.mockRejectedValue(networkError)

      const error = await httpService
        .testRequest(new Request(upstream))
        .catch((thrown) => thrown)

      expect(error).toBeInstanceOf(ServiceUnavailableApiException)
      expect(typeof error.message).toBe('string')
      expect(error.message).not.toContain('10.0.0.5')
      expect(error.message).not.toContain('8080')
      expect(JSON.stringify(error.getResponse())).not.toContain('10.0.0.5')

      // What actually broke stays reachable for a server-side log, off the
      // response the browser is handed.
      expect(error.cause).toBe(networkError)

      // Off it for real: a caller that spreads the exception — into a log
      // context, into a JSON body — must not put the host back on the wire.
      expect(Object.getOwnPropertyDescriptor(error, 'cause')?.enumerable).toBe(
        false
      )
      expect(JSON.stringify({ ...error })).not.toContain('10.0.0.5')
    })

    it('keeps a 403 a 403 instead of a 503', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ title: 'Forbidden' }), {
          status: HttpStatus.FORBIDDEN,
          headers: { 'content-type': 'application/json' }
        })
      )

      const error = await httpService
        .testRequest(new Request(upstream))
        .catch((thrown) => thrown)

      expect(error).toBeInstanceOf(ForbiddenApiException)
      expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN)
    })

    it('keeps a 400 a 400 instead of a 503', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ title: 'Bad Request' }), {
          status: HttpStatus.BAD_REQUEST,
          headers: { 'content-type': 'application/json' }
        })
      )

      const error = await httpService
        .testRequest(new Request(upstream))
        .catch((thrown) => thrown)

      expect(error).toBeInstanceOf(BadRequestApiException)
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST)
    })

    it('keeps a client error with no exception class at its own status', async () => {
      // 409 has no purpose-built exception here, and collapsing it into 503
      // told the user "service unavailable" when the answer was "this already
      // exists". Same for 429, 402, 410.
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ code: 'ALREADY_EXISTS' }), {
          status: HttpStatus.CONFLICT,
          headers: { 'content-type': 'application/json' }
        })
      )

      const error = await httpService
        .testRequest(new Request(upstream))
        .catch((thrown) => thrown)

      expect(error).toBeInstanceOf(ApiException)
      expect(error).not.toBeInstanceOf(ServiceUnavailableApiException)
      expect(error.getStatus()).toBe(HttpStatus.CONFLICT)
      expect(error.message).toBe('ALREADY_EXISTS')

      // The identity a filter and a client read, not only the status.
      expect(error.code).toBe('0008')
      expect(error.title).toBe('Upstream Error')
      expect(error.getResponse()).toEqual({
        code: '0008',
        title: 'Upstream Error',
        message: 'ALREADY_EXISTS'
      })
    })

    it('drops a JSON scalar body instead of quoting it', async () => {
      // A body that parses as JSON but is not an object carries no problem
      // details, and quoting it put the upstream's free text — here a taxpayer
      // id — into the message the browser is handed.
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify('Token expired for cpf 123.456.789-00'), {
          status: HttpStatus.UNAUTHORIZED,
          headers: { 'content-type': 'application/json' }
        })
      )
      const mockRequest = new Request(upstream)

      const error = await httpService
        .testRequest(mockRequest)
        .catch((thrown) => thrown)

      expect(error).toBeInstanceOf(UnauthorizedApiException)
      expect(error.message).toBe(
        'Upstream error body carried no problem details (status 401)'
      )
      expect(error.message).not.toContain('cpf')
      expect(httpService.catch).toHaveBeenCalledWith(
        mockRequest,
        expect.any(Response),
        undefined
      )
    })

    it('never puts a non-JSON success body in the thrown message', async () => {
      // A 200 whose body is a login page, not JSON. `response.json()` throws a
      // SyntaxError that quotes the first bytes of that page, and that message
      // used to become the exception's.
      mockFetch.mockResolvedValue(
        new Response('<html><body>secret-token-abc</body></html>', {
          status: HttpStatus.OK,
          headers: { 'content-type': 'text/html' }
        })
      )

      const error = await httpService
        .testRequest(new Request(upstream))
        .catch((thrown) => thrown)

      expect(error).toBeInstanceOf(ServiceUnavailableApiException)
      expect(typeof error.message).toBe('string')
      expect(error.message).not.toContain('<html>')
      expect(error.message).not.toContain('secret-token-abc')
    })

    // Dropping the `typeof === 'string'` guards looks harmless — the field is
    // just absent from the log either way. It is not: `cap(123)` throws inside
    // `catch`, the throw escapes to the outer handler, and the 409 the
    // upstream really sent reaches the caller as a 503.
    it.each([
      ['type', { type: 123, title: 'Conflict', code: 'ALREADY_EXISTS' }],
      ['title', { type: 'about:blank', title: 123, code: 'ALREADY_EXISTS' }],
      ['code', { type: 'about:blank', title: 'Conflict', code: 123 }]
    ])(
      'drops a non-string %s instead of interpolating it',
      async (field, body) => {
        const service = new DefaultCatchHttpService()
        mockFetch.mockResolvedValue(
          new Response(JSON.stringify(body), {
            status: HttpStatus.CONFLICT,
            headers: { 'content-type': 'application/json' }
          })
        )

        const error = await service
          .testRequest(new Request(upstream))
          .catch((thrown) => thrown)

        const [, logged] = consoleSpy.mock.calls[0]
        expect(logged).not.toHaveProperty(field)

        // The two that ARE strings still land, so this is the guard doing its
        // job and not a throw that swallowed the whole log line.
        expect(Object.keys(logged)).toEqual(
          expect.arrayContaining(
            ['type', 'title', 'code'].filter((name) => name !== field)
          )
        )

        // The status survives the field it could not use.
        expect(error.getStatus()).toBe(HttpStatus.CONFLICT)
        expect(error).not.toBeInstanceOf(ServiceUnavailableApiException)
      }
    )

    it('caps the classification fields it logs', async () => {
      // `type`, `title` and `code` come from the upstream and are unbounded.
      const service = new DefaultCatchHttpService()
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            type: 'x'.repeat(4000),
            title: 'T'.repeat(4000),
            code: 'c'.repeat(4000)
          }),
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            headers: { 'content-type': 'application/json' }
          }
        )
      )

      await expect(
        service.testRequest(new Request(upstream))
      ).rejects.toBeInstanceOf(InternalServerErrorApiException)

      const [, logged] = consoleSpy.mock.calls[0]
      expect(logged.type).toHaveLength(200)
      expect(logged.title).toHaveLength(200)
      expect(logged.code).toHaveLength(200)
    })
  })

  // Round 3. What the `catch` hook is handed for a text/plain failure. The
  // hook's third argument carried the RAW body under the key `message`, and
  // ten of the fifteen Console transports read `error?.message` and re-publish
  // it — to the browser, to an error log — so bounding the thrown message
  // alone left the leak open one frame up.
  describe('the text handed to the catch hook', () => {
    const upstream = 'https://api.example.com/test'
    const leakyBody =
      'token expired for cpf 123.456.789-00 at db-primary.internal:5432'

    /** Mirrors `midaz-http-service.ts:106` — `error.message || <own sentence>`. */
    class MessageReadingHttpService extends HttpService {
      public async testRequest<T>(request: Request): Promise<T> {
        return this.request<T>(request)
      }

      protected createDefaults = jest.fn().mockResolvedValue({})

      protected async catch(
        _request: Request,
        _response: Response,
        error: any
      ) {
        throw new UnauthorizedApiException(error?.message || 'Unauthorized')
      }
    }

    /** Mirrors sindarian-logs `logHttpEvent` — `error?.message || error?.code`. */
    class LoggingHttpService extends HttpService {
      public readonly lines: string[] = []

      public async testRequest<T>(request: Request): Promise<T> {
        return this.request<T>(request)
      }

      protected createDefaults = jest.fn().mockResolvedValue({})

      protected async catch(request: Request, response: Response, error: any) {
        const detail = error?.message || error?.code
        this.lines.push(
          `${request.method} ${response.status}` + (detail ? `: ${detail}` : '')
        )
      }
    }

    class CapturingHttpService extends HttpService {
      public received: unknown

      public async testRequest<T>(request: Request): Promise<T> {
        return this.request<T>(request)
      }

      protected createDefaults = jest.fn().mockResolvedValue({})

      protected async catch(
        _request: Request,
        _response: Response,
        error: any
      ) {
        this.received = error
      }
    }

    it('does not reach a transport that re-publishes error.message', async () => {
      mockFetch.mockResolvedValue(
        new Response(leakyBody, {
          status: HttpStatus.UNAUTHORIZED,
          headers: { 'content-type': 'text/plain' }
        })
      )

      const error = await new MessageReadingHttpService()
        .testRequest(new Request(upstream))
        .catch((thrown) => thrown)

      expect(error).toBeInstanceOf(UnauthorizedApiException)
      expect(error.message).not.toContain('123.456.789-00')
      expect(error.message).not.toContain('db-primary.internal')
      expect(JSON.stringify(error.getResponse())).not.toContain('5432')
    })

    it('does not reach a transport that logs error.message', async () => {
      mockFetch.mockResolvedValue(
        new Response(leakyBody, {
          status: HttpStatus.UNAUTHORIZED,
          headers: { 'content-type': 'text/plain' }
        })
      )
      const service = new LoggingHttpService()

      await expect(
        service.testRequest(new Request(upstream))
      ).rejects.toBeInstanceOf(UnauthorizedApiException)

      expect(service.lines.join('\n')).not.toContain('123.456.789-00')
      expect(service.lines.join('\n')).not.toContain('db-primary.internal')
    })

    it('caps the text it hands over at 200 characters', async () => {
      mockFetch.mockResolvedValue(
        new Response('x'.repeat(100_000), {
          status: HttpStatus.BAD_GATEWAY,
          headers: { 'content-type': 'text/plain' }
        })
      )
      const service = new CapturingHttpService()

      await expect(
        service.testRequest(new Request(upstream))
      ).rejects.toBeInstanceOf(ApiException)

      expect((service.received as { text: string }).text).toHaveLength(200)
    })

    it('hands the text over under a key no transport already reads', async () => {
      mockFetch.mockResolvedValue(
        new Response('upstream is down', {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          headers: { 'content-type': 'text/plain' }
        })
      )
      const service = new CapturingHttpService()

      await expect(
        service.testRequest(new Request(upstream))
      ).rejects.toBeInstanceOf(ServiceUnavailableApiException)

      expect(service.received).toEqual({ text: 'upstream is down' })
      expect(service.received).not.toHaveProperty('message')
    })
  })

  // Round 3. A call that never produced a usable response becomes one fixed
  // sentence on the wire, which is right — and until this hook existed it
  // also became NOTHING in the server log. A Midaz outage, a DNS or TLS
  // failure, a 200 whose body is a login page: all of them left no record at
  // all, and `cause` is read by no code.
  describe('what an unreachable upstream writes down', () => {
    const withQuery = 'https://api.example.com/v1/accounts?token=s3cr3t-token'

    it('logs the method, the path and what actually broke', async () => {
      const service = new DefaultCatchHttpService()
      mockFetch.mockRejectedValue(
        new TypeError('fetch failed: connect ECONNREFUSED 10.0.0.5:8080')
      )

      const error = await service
        .testRequest(new Request(withQuery))
        .catch((thrown) => thrown)

      expect(consoleSpy).toHaveBeenCalledWith('Request failed', {
        method: 'GET',
        url: 'https://api.example.com/v1/accounts',
        cause: 'fetch failed: connect ECONNREFUSED 10.0.0.5:8080'
      })

      // The host and port belong in the operator's log and nowhere else.
      expect(error).toBeInstanceOf(ServiceUnavailableApiException)
      expect(error.message).toBe(
        'The request to the upstream service could not be completed'
      )
    })

    it('keeps the query string out of what it logs', async () => {
      const service = new DefaultCatchHttpService()
      mockFetch.mockRejectedValue(new TypeError('fetch failed'))

      await expect(
        service.testRequest(new Request(withQuery))
      ).rejects.toBeInstanceOf(ServiceUnavailableApiException)

      expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain('s3cr3t')
    })

    it('records a success body that was never JSON', async () => {
      const service = new DefaultCatchHttpService()
      mockFetch.mockResolvedValue(
        new Response('<html><body>login</body></html>', {
          status: HttpStatus.OK,
          headers: { 'content-type': 'text/html' }
        })
      )

      await expect(
        service.testRequest(new Request('https://api.example.com/v1/accounts'))
      ).rejects.toBeInstanceOf(ServiceUnavailableApiException)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Request failed',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('records a catch override that threw something unexpected', async () => {
      class ThrowingCatchHttpService extends HttpService {
        public async testRequest<T>(request: Request): Promise<T> {
          return this.request<T>(request)
        }

        protected createDefaults = jest.fn().mockResolvedValue({})

        protected async catch() {
          throw new Error('transport bug: cannot read code of undefined')
        }
      }

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ title: 'Conflict' }), {
          status: HttpStatus.CONFLICT,
          headers: { 'content-type': 'application/json' }
        })
      )

      await expect(
        new ThrowingCatchHttpService().testRequest(
          new Request('https://api.example.com/v1/accounts')
        )
      ).rejects.toBeInstanceOf(ServiceUnavailableApiException)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Request failed',
        expect.objectContaining({
          cause: 'transport bug: cannot read code of undefined'
        })
      )
    })

    it('is overridable like the fetch hooks beside it', async () => {
      const onRequestFailure = jest.fn()

      class RoutingHttpService extends HttpService {
        public async testRequest<T>(request: Request): Promise<T> {
          return this.request<T>(request)
        }

        protected createDefaults = jest.fn().mockResolvedValue({})
        protected onRequestFailure = onRequestFailure
      }

      const broke = new TypeError('fetch failed')
      mockFetch.mockRejectedValue(broke)

      await expect(
        new RoutingHttpService().testRequest(
          new Request('https://api.example.com/v1/accounts')
        )
      ).rejects.toBeInstanceOf(ServiceUnavailableApiException)

      expect(onRequestFailure).toHaveBeenCalledTimes(1)
      expect(onRequestFailure).toHaveBeenCalledWith(expect.any(Request), broke)
      // Overriding it replaces the default log entirely.
      expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain(
        'Request failed'
      )
    })

    it('contains an override that threw while logging the failure', async () => {
      class ThrowingFailureHttpService extends HttpService {
        public async testRequest<T>(request: Request): Promise<T> {
          return this.request<T>(request)
        }

        protected createDefaults = jest.fn().mockResolvedValue({})

        protected onRequestFailure(): void {
          throw new Error(
            'logger transport failed while writing: fetch failed: connect ECONNREFUSED 10.0.0.5:8080'
          )
        }
      }

      mockFetch.mockRejectedValue(
        new TypeError('fetch failed: connect ECONNREFUSED 10.0.0.5:8080')
      )

      const error = await new ThrowingFailureHttpService()
        .testRequest(new Request('https://api.example.com/v1/accounts'))
        .catch((thrown) => thrown)

      // A crashing failure-logger used to replace the bounded exception, and a
      // non-ApiException puts its own `message` on the wire, serialised
      // verbatim by BaseExceptionFilter.
      expect(error).toBeInstanceOf(ServiceUnavailableApiException)
      expect(error.message).toBe(
        'The request to the upstream service could not be completed'
      )
      expect(error.message).not.toContain('10.0.0.5:8080')
    })
  })
})
