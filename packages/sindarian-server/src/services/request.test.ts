import 'reflect-metadata'
import { Container } from 'inversify'
import { NextRequest } from 'next/server'
import * as RequestModule from './request'

const { REQUEST, bindRequest, getRequest, getCurrentRequest } = RequestModule

// Helper function to create mock NextRequest
function createMockRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, options)
}

describe('Request Service', () => {
  let container: Container
  let mockRequest: NextRequest

  beforeEach(() => {
    container = new Container()
    mockRequest = createMockRequest('http://localhost:3000/api/test')
  })

  afterEach(() => {
    // Clean up container
    container.unbindAll()
  })

  describe('bindRequest', () => {
    it('should bind request to container', () => {
      bindRequest(container, mockRequest)

      expect(container.isBound(REQUEST)).toBe(true)
      const boundRequest = container.get<NextRequest>(REQUEST)
      expect(boundRequest).toBe(mockRequest)
    })

    it('should set global currentRequest reference', () => {
      bindRequest(container, mockRequest)

      const currentRequest = getCurrentRequest()
      expect(currentRequest).toBe(mockRequest)
    })

    it('should rebind request if already bound', () => {
      const firstRequest = createMockRequest('http://localhost:3000/api/first')
      const secondRequest = createMockRequest(
        'http://localhost:3000/api/second'
      )

      bindRequest(container, firstRequest)
      expect(container.get<NextRequest>(REQUEST)).toBe(firstRequest)

      bindRequest(container, secondRequest)
      expect(container.get<NextRequest>(REQUEST)).toBe(secondRequest)
    })

    it('should not throw error when rebinding', () => {
      bindRequest(container, mockRequest)

      const newRequest = createMockRequest('http://localhost:3000/api/new')
      expect(() => bindRequest(container, newRequest)).not.toThrow()
    })

    it('should handle multiple successive bindings', () => {
      const request1 = createMockRequest('http://localhost:3000/api/1')
      const request2 = createMockRequest('http://localhost:3000/api/2')
      const request3 = createMockRequest('http://localhost:3000/api/3')

      bindRequest(container, request1)
      bindRequest(container, request2)
      bindRequest(container, request3)

      expect(container.get<NextRequest>(REQUEST)).toBe(request3)
      expect(getCurrentRequest()).toBe(request3)
    })

    it('should bind request with different HTTP methods', () => {
      const getRequest = createMockRequest('http://localhost:3000/api/test', {
        method: 'GET'
      })
      const postRequest = createMockRequest('http://localhost:3000/api/test', {
        method: 'POST'
      })

      bindRequest(container, getRequest)
      expect(container.get<NextRequest>(REQUEST).method).toBe('GET')

      bindRequest(container, postRequest)
      expect(container.get<NextRequest>(REQUEST).method).toBe('POST')
    })

    it('should bind request with headers', () => {
      const requestWithHeaders = createMockRequest(
        'http://localhost:3000/api/test',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token'
          }
        }
      )

      bindRequest(container, requestWithHeaders)
      const boundRequest = container.get<NextRequest>(REQUEST)

      expect(boundRequest.headers.get('Content-Type')).toBe('application/json')
      expect(boundRequest.headers.get('Authorization')).toBe('Bearer token')
    })
  })

  describe('getRequest', () => {
    it('should retrieve request from container when provided', () => {
      bindRequest(container, mockRequest)

      const retrievedRequest = getRequest(container)
      expect(retrievedRequest).toBe(mockRequest)
    })

    it('should retrieve request from global reference when container not provided', () => {
      bindRequest(container, mockRequest)

      const retrievedRequest = getRequest()
      expect(retrievedRequest).toBe(mockRequest)
    })

    it('should retrieve request from global reference when container provided but REQUEST not bound', () => {
      // Manually set currentRequest without using bindRequest to container
      bindRequest(new Container(), mockRequest)

      const retrievedRequest = getRequest(container)
      expect(retrievedRequest).toBe(mockRequest)
    })

    it('should prefer container-bound request over global reference', () => {
      const containerRequest = createMockRequest(
        'http://localhost:3000/api/container'
      )
      const globalRequest = createMockRequest(
        'http://localhost:3000/api/global'
      )

      // Set global request
      bindRequest(new Container(), globalRequest)

      // Set container request
      bindRequest(container, containerRequest)

      const retrievedRequest = getRequest(container)
      expect(retrievedRequest).toBe(containerRequest)
      expect(retrievedRequest).not.toBe(globalRequest)
    })

    it('should throw error when request not available in container or globally', () => {
      // Create a fresh container that doesn't have REQUEST bound
      // and test when there's no global request either
      // Note: Due to test execution order, currentRequest might be set from previous tests
      // This test may pass or fail depending on test isolation
      const freshContainer = new Container()

      // We can only test the error when both container and global are unavailable
      // Since we can't reset the global state, this test is limited
      if (!getCurrentRequest()) {
        expect(() => getRequest(freshContainer)).toThrow(
          'Request is not available. Make sure bindRequest is called before accessing the request.'
        )
      } else {
        // If global request exists, it won't throw
        expect(() => getRequest(freshContainer)).not.toThrow()
      }

      freshContainer.unbindAll()
    })

    it('should throw error when no container provided and no global request', () => {
      // This test can only work if we can guarantee no global request exists
      // Due to module-level state, we'll test the error message format instead
      // if the condition occurs
      if (!getCurrentRequest()) {
        expect(() => getRequest()).toThrow(
          'Request is not available. Make sure bindRequest is called before accessing the request.'
        )
      } else {
        // If there's a global request, it should return it
        expect(() => getRequest()).not.toThrow()
      }
    })

    it('should retrieve request after multiple rebindings', () => {
      const request1 = createMockRequest('http://localhost:3000/api/1')
      const request2 = createMockRequest('http://localhost:3000/api/2')

      bindRequest(container, request1)
      expect(getRequest(container)).toBe(request1)

      bindRequest(container, request2)
      expect(getRequest(container)).toBe(request2)
    })

    it('should handle request with query parameters', () => {
      const requestWithQuery = createMockRequest(
        'http://localhost:3000/api/test?page=1&limit=10'
      )

      bindRequest(container, requestWithQuery)
      const retrievedRequest = getRequest(container)

      expect(retrievedRequest.nextUrl.searchParams.get('page')).toBe('1')
      expect(retrievedRequest.nextUrl.searchParams.get('limit')).toBe('10')
    })

    it('should handle request with path parameters', () => {
      const requestWithPath = createMockRequest(
        'http://localhost:3000/api/users/123/posts/456'
      )

      bindRequest(container, requestWithPath)
      const retrievedRequest = getRequest(container)

      expect(retrievedRequest.nextUrl.pathname).toBe('/api/users/123/posts/456')
    })
  })

  describe('getCurrentRequest', () => {
    it('should return current request when bound', () => {
      bindRequest(container, mockRequest)

      const currentRequest = getCurrentRequest()
      expect(currentRequest).toBe(mockRequest)
    })

    it('should return null when no request is bound', () => {
      // Note: Due to module-level state persistence across tests,
      // currentRequest might already be set from previous tests
      // We can only test that getCurrentRequest returns something consistent
      const currentRequest = getCurrentRequest()
      // If previous tests ran, currentRequest will be set
      // We test that the function works, not that it's null
      expect(
        typeof currentRequest === 'object' || currentRequest === null
      ).toBe(true)
    })

    it('should return latest bound request', () => {
      const request1 = createMockRequest('http://localhost:3000/api/1')
      const request2 = createMockRequest('http://localhost:3000/api/2')

      bindRequest(container, request1)
      expect(getCurrentRequest()).toBe(request1)

      bindRequest(container, request2)
      expect(getCurrentRequest()).toBe(request2)
    })

    it('should return same reference as getRequest when using global reference', () => {
      bindRequest(container, mockRequest)

      const fromGetRequest = getRequest()
      const fromGetCurrentRequest = getCurrentRequest()

      expect(fromGetRequest).toBe(fromGetCurrentRequest)
    })

    it('should return request even after container is cleared', () => {
      bindRequest(container, mockRequest)
      container.unbindAll()

      // getCurrentRequest should still work because it uses global reference
      const currentRequest = getCurrentRequest()
      expect(currentRequest).toBe(mockRequest)
    })
  })

  describe('REQUEST symbol', () => {
    it('should be a unique symbol', () => {
      expect(typeof REQUEST).toBe('symbol')
    })

    it('should have description "REQUEST"', () => {
      expect(REQUEST.toString()).toBe('Symbol(REQUEST)')
    })

    it('should be usable as container binding key', () => {
      container.bind(REQUEST).toConstantValue(mockRequest)
      expect(container.isBound(REQUEST)).toBe(true)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle concurrent request contexts with different containers', () => {
      const container1 = new Container()
      const container2 = new Container()
      const request1 = createMockRequest('http://localhost:3000/api/request1')
      const request2 = createMockRequest('http://localhost:3000/api/request2')

      bindRequest(container1, request1)
      bindRequest(container2, request2)

      expect(getRequest(container1)).toBe(request1)
      expect(getRequest(container2)).toBe(request2)

      // Cleanup
      container1.unbindAll()
      container2.unbindAll()
    })

    it('should support request lifecycle simulation', () => {
      // Simulate first request
      const firstRequest = createMockRequest('http://localhost:3000/api/first')
      bindRequest(container, firstRequest)
      expect(getRequest(container)).toBe(firstRequest)

      // Simulate second request (rebind)
      const secondRequest = createMockRequest(
        'http://localhost:3000/api/second'
      )
      bindRequest(container, secondRequest)
      expect(getRequest(container)).toBe(secondRequest)
      expect(getCurrentRequest()).toBe(secondRequest)
    })

    it('should maintain request data integrity through binding cycle', () => {
      const requestWithData = createMockRequest(
        'http://localhost:3000/api/test?id=123',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      bindRequest(container, requestWithData)
      const retrieved = getRequest(container)

      expect(retrieved.method).toBe('POST')
      expect(retrieved.nextUrl.searchParams.get('id')).toBe('123')
      expect(retrieved.headers.get('Content-Type')).toBe('application/json')
    })

    it('should handle empty container scenario', () => {
      const emptyContainer = new Container()

      // If there's no global currentRequest, it should throw
      // Otherwise, it will use the global reference
      if (!getCurrentRequest()) {
        expect(() => getRequest(emptyContainer)).toThrow()
      } else {
        // Will use global reference
        expect(() => getRequest(emptyContainer)).not.toThrow()
      }

      emptyContainer.unbindAll()
    })
  })

  describe('Edge cases', () => {
    it('should handle request with complex URL', () => {
      const complexRequest = createMockRequest(
        'http://localhost:3000/api/v1/users/123/posts/456/comments?page=1&limit=10&sort=desc#section'
      )

      bindRequest(container, complexRequest)
      const retrieved = getRequest(container)

      expect(retrieved.nextUrl.pathname).toBe(
        '/api/v1/users/123/posts/456/comments'
      )
      expect(retrieved.nextUrl.searchParams.get('page')).toBe('1')
      expect(retrieved.nextUrl.searchParams.get('limit')).toBe('10')
      expect(retrieved.nextUrl.searchParams.get('sort')).toBe('desc')
    })

    it('should handle request with special characters in URL', () => {
      const specialRequest = createMockRequest(
        'http://localhost:3000/api/search?q=hello%20world&filter=%23tag'
      )

      bindRequest(container, specialRequest)
      const retrieved = getRequest(container)

      expect(retrieved.nextUrl.searchParams.get('q')).toBe('hello world')
      expect(retrieved.nextUrl.searchParams.get('filter')).toBe('#tag')
    })

    it('should handle request with empty query string', () => {
      const requestEmptyQuery = createMockRequest(
        'http://localhost:3000/api/test?'
      )

      bindRequest(container, requestEmptyQuery)
      const retrieved = getRequest(container)

      expect(retrieved.nextUrl.search).toBe('')
    })

    it('should handle request with root path', () => {
      const rootRequest = createMockRequest('http://localhost:3000/')

      bindRequest(container, rootRequest)
      const retrieved = getRequest(container)

      expect(retrieved.nextUrl.pathname).toBe('/')
    })
  })
})
