import { HttpArgumentsHost } from './http-arguments-host'

describe('HttpArgumentsHost', () => {
  describe('constructor', () => {
    it('should initialize with request and response', () => {
      const mockRequest = { url: 'https://example.com' }
      const mockResponse = { status: 200 }

      const host = new HttpArgumentsHost(mockRequest, mockResponse)

      expect(host.getRequest()).toBe(mockRequest)
      expect(host.getResponse()).toBe(mockResponse)
    })

    it('should handle null request and response', () => {
      const host = new HttpArgumentsHost(null, null)

      expect(host.getRequest()).toBeNull()
      expect(host.getResponse()).toBeNull()
    })

    it('should handle undefined request and response', () => {
      const host = new HttpArgumentsHost(undefined, undefined)

      expect(host.getRequest()).toBeUndefined()
      expect(host.getResponse()).toBeUndefined()
    })
  })

  describe('getRequest', () => {
    it('should return the request object passed to constructor', () => {
      const mockRequest = {
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: { 'content-type': 'application/json' }
      }
      const mockResponse = {}

      const host = new HttpArgumentsHost(mockRequest, mockResponse)

      expect(host.getRequest()).toBe(mockRequest)
      expect(host.getRequest()).toEqual({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: { 'content-type': 'application/json' }
      })
    })

    it('should return Request object with correct typing', () => {
      const mockRequest = new Request('https://example.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'test' })
      })
      const mockResponse = {}

      const host = new HttpArgumentsHost(mockRequest, mockResponse)
      const request = host.getRequest<Request>()

      expect(request).toBe(mockRequest)
      expect(request.method).toBe('POST')
      expect(request.url).toBe('https://example.com/')
    })

    it('should handle custom request objects', () => {
      interface CustomRequest {
        customProperty: string
        method: string
      }

      const customRequest: CustomRequest = {
        customProperty: 'custom value',
        method: 'PATCH'
      }
      const mockResponse = {}

      const host = new HttpArgumentsHost(customRequest, mockResponse)
      const request = host.getRequest<CustomRequest>()

      expect(request).toBe(customRequest)
      expect(request.customProperty).toBe('custom value')
      expect(request.method).toBe('PATCH')
    })

    it('should handle complex request objects', () => {
      const complexRequest = {
        method: 'POST',
        url: 'https://api.example.com/endpoint',
        headers: new Headers({
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json'
        }),
        body: {
          user: { id: 1, name: 'John' },
          metadata: { timestamp: Date.now() }
        },
        params: { id: '123' },
        query: { filter: 'active', page: 1 }
      }
      const mockResponse = {}

      const host = new HttpArgumentsHost(complexRequest, mockResponse)

      expect(host.getRequest()).toBe(complexRequest)
      expect(host.getRequest().body.user.name).toBe('John')
      expect(host.getRequest().params.id).toBe('123')
    })

    it('should maintain reference equality', () => {
      const originalRequest = { id: 'original' }
      const mockResponse = {}

      const host = new HttpArgumentsHost(originalRequest, mockResponse)
      const retrievedRequest = host.getRequest()

      expect(retrievedRequest).toBe(originalRequest) // Same reference

      // Modifying original should affect retrieved
      originalRequest.id = 'modified'
      expect(retrievedRequest.id).toBe('modified')
    })
  })

  describe('getResponse', () => {
    it('should return the response object passed to constructor', () => {
      const mockRequest = {}
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' }
      }

      const host = new HttpArgumentsHost(mockRequest, mockResponse)

      expect(host.getResponse()).toBe(mockResponse)
      expect(host.getResponse()).toEqual({
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' }
      })
    })

    it('should return Response object with correct typing', () => {
      const mockRequest = {}
      const mockResponse = new Response(
        JSON.stringify({ message: 'success' }),
        {
          status: 201,
          statusText: 'Created',
          headers: { 'Content-Type': 'application/json' }
        }
      )

      const host = new HttpArgumentsHost(mockRequest, mockResponse)
      const response = host.getResponse<Response>()

      expect(response).toBe(mockResponse)
      expect(response.status).toBe(201)
      expect(response.statusText).toBe('Created')
    })

    it('should handle custom response objects', () => {
      interface CustomResponse {
        customData: any
        status: number
        send: (data: any) => void
      }

      const mockRequest = {}
      const customResponse: CustomResponse = {
        customData: { framework: 'custom' },
        status: 200,
        send: jest.fn()
      }

      const host = new HttpArgumentsHost(mockRequest, customResponse)
      const response = host.getResponse<CustomResponse>()

      expect(response).toBe(customResponse)
      expect(response.customData.framework).toBe('custom')
      expect(response.status).toBe(200)
      expect(typeof response.send).toBe('function')
    })

    it('should handle NextResponse objects', () => {
      const mockRequest = {}
      const nextResponse = {
        status: 200,
        json: jest.fn(),
        redirect: jest.fn(),
        headers: new Headers()
      }

      const host = new HttpArgumentsHost(mockRequest, nextResponse)

      expect(host.getResponse()).toBe(nextResponse)
      expect(typeof host.getResponse().json).toBe('function')
      expect(typeof host.getResponse().redirect).toBe('function')
    })

    it('should maintain reference equality', () => {
      const mockRequest = {}
      const originalResponse = { status: 200 }

      const host = new HttpArgumentsHost(mockRequest, originalResponse)
      const retrievedResponse = host.getResponse()

      expect(retrievedResponse).toBe(originalResponse) // Same reference

      // Modifying original should affect retrieved
      originalResponse.status = 404
      expect(retrievedResponse.status).toBe(404)
    })
  })

  describe('type safety and generics', () => {
    it('should allow type-safe request access', () => {
      interface ApiRequest {
        apiKey: string
        version: string
        payload: any
      }

      const apiRequest: ApiRequest = {
        apiKey: 'secret-key',
        version: 'v1',
        payload: { data: 'test' }
      }
      const mockResponse = {}

      const host = new HttpArgumentsHost(apiRequest, mockResponse)
      const typedRequest = host.getRequest<ApiRequest>()

      expect(typedRequest.apiKey).toBe('secret-key')
      expect(typedRequest.version).toBe('v1')
      expect(typedRequest.payload.data).toBe('test')
    })

    it('should allow type-safe response access', () => {
      interface ApiResponse {
        statusCode: number
        data: any
        meta: { timestamp: number }
      }

      const mockRequest = {}
      const apiResponse: ApiResponse = {
        statusCode: 200,
        data: { users: [] },
        meta: { timestamp: Date.now() }
      }

      const host = new HttpArgumentsHost(mockRequest, apiResponse)
      const typedResponse = host.getResponse<ApiResponse>()

      expect(typedResponse.statusCode).toBe(200)
      expect(Array.isArray(typedResponse.data.users)).toBe(true)
      expect(typeof typedResponse.meta.timestamp).toBe('number')
    })

    it('should handle default generic types', () => {
      const request = { method: 'GET' }
      const response = { status: 200 }

      const host = new HttpArgumentsHost(request, response)

      // Without explicit type parameters, should default to Request and Response
      const defaultRequest = host.getRequest() // Should be inferred as Request type
      const defaultResponse = host.getResponse() // Should be inferred as Response type

      expect(defaultRequest).toBe(request)
      expect(defaultResponse).toBe(response)
    })
  })

  describe('real-world scenarios', () => {
    it('should handle Express-like request/response objects', () => {
      const expressRequest = {
        method: 'POST',
        url: '/api/users',
        headers: { 'content-type': 'application/json' },
        body: { name: 'John', email: 'john@example.com' },
        params: { id: '123' },
        query: { include: 'profile' }
      }

      const expressResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        header: jest.fn().mockReturnThis()
      }

      const host = new HttpArgumentsHost(expressRequest, expressResponse)

      expect(host.getRequest().method).toBe('POST')
      expect(host.getRequest().body.name).toBe('John')
      expect(host.getResponse().status).toBeDefined()
      expect(typeof host.getResponse().json).toBe('function')
    })

    it('should handle Next.js API route context', () => {
      const nextRequest = {
        method: 'GET',
        url: 'https://app.example.com/api/data',
        headers: new Headers({ 'User-Agent': 'Mozilla/5.0' }),
        nextUrl: { pathname: '/api/data', search: '?limit=10' }
      }

      const nextResponse = {
        json: jest.fn(),
        redirect: jest.fn(),
        rewrite: jest.fn(),
        headers: new Headers()
      }

      const host = new HttpArgumentsHost(nextRequest, nextResponse)

      expect(host.getRequest().nextUrl.pathname).toBe('/api/data')
      expect(host.getResponse().json).toBeDefined()
    })

    it('should handle Fastify-like request/response', () => {
      const fastifyRequest = {
        method: 'PUT',
        url: '/api/items/456',
        headers: { authorization: 'Bearer token' },
        body: { title: 'Updated Item' },
        params: { id: '456' },
        log: { info: jest.fn(), error: jest.fn() }
      }

      const fastifyResponse = {
        code: jest.fn().mockReturnThis(),
        type: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        header: jest.fn().mockReturnThis()
      }

      const host = new HttpArgumentsHost(fastifyRequest, fastifyResponse)

      expect(host.getRequest().params.id).toBe('456')
      expect(host.getRequest().body.title).toBe('Updated Item')
      expect(typeof host.getResponse().code).toBe('function')
    })
  })

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const emptyRequest = {}
      const emptyResponse = {}

      const host = new HttpArgumentsHost(emptyRequest, emptyResponse)

      expect(host.getRequest()).toEqual({})
      expect(host.getResponse()).toEqual({})
    })

    it('should handle functions as request/response', () => {
      const functionRequest = () => 'request function'
      const functionResponse = () => 'response function'

      const host = new HttpArgumentsHost(functionRequest, functionResponse)

      expect(typeof host.getRequest()).toBe('function')
      expect(typeof host.getResponse()).toBe('function')
      expect(host.getRequest()()).toBe('request function')
      expect(host.getResponse()()).toBe('response function')
    })

    it('should handle primitive values', () => {
      const stringRequest = 'request string'
      const numberResponse = 42

      const host = new HttpArgumentsHost(stringRequest, numberResponse)

      expect(host.getRequest()).toBe('request string')
      expect(host.getResponse()).toBe(42)
    })

    it('should handle arrays', () => {
      const arrayRequest = ['GET', '/api/test']
      const arrayResponse = [200, 'OK', { data: 'test' }]

      const host = new HttpArgumentsHost(arrayRequest, arrayResponse)

      expect(Array.isArray(host.getRequest())).toBe(true)
      expect(Array.isArray(host.getResponse())).toBe(true)
      expect(host.getRequest()[0]).toBe('GET')
      expect(host.getResponse()[0]).toBe(200)
    })
  })
})
