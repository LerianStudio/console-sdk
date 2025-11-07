import { HttpService, FetchModuleOptions } from './http-service'
import { HttpStatus } from '../constants/http-status'
import {
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
        ServiceUnavailableApiException
      )
      expect(httpService.catch).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        { message: 'Bad request' }
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

      const mockRequest = new Request('https://api.example.com/test')

      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        ServiceUnavailableApiException
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
    it('should handle response.json() throwing an error', async () => {
      mockResponse.ok = false
      mockResponse.status = HttpStatus.BAD_REQUEST
      mockResponse.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'))

      const mockRequest = new Request('https://api.example.com/test')

      await expect(httpService.testRequest(mockRequest)).rejects.toThrow(
        ServiceUnavailableApiException
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
})
