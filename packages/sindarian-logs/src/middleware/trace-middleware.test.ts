import { TraceMiddleware } from './trace-middleware'
import { LoggerAggregator } from '@/aggregator/logger-aggregator'
import { RequestIdRepository } from '@/request-id/request-id-repository'
import { NextRequest } from 'next/server'

describe('TraceMiddleware', () => {
  let middleware: TraceMiddleware
  let mockLogger: jest.Mocked<
    Pick<
      LoggerAggregator,
      'runWithContext' | 'setResponseMetadata' | 'hasContext'
    >
  >
  let requestIdRepo: RequestIdRepository

  beforeEach(() => {
    requestIdRepo = new RequestIdRepository()

    mockLogger = {
      runWithContext: jest.fn((_path, _method, _meta, fn) => fn()),
      setResponseMetadata: jest.fn(),
      hasContext: jest.fn().mockReturnValue(true)
    }

    middleware = new TraceMiddleware(mockLogger as any, requestIdRepo)
  })

  it('should generate a trace ID and wrap in both requestId and logger contexts', async () => {
    const request = new NextRequest('http://localhost:3000/api/users')
    const mockResponse = new Response('ok', {
      status: 200,
      headers: { 'content-length': '2' }
    })

    const next = jest.fn().mockResolvedValue(mockResponse)

    const response = await middleware.use(request, next)

    expect(next).toHaveBeenCalled()
    expect(mockLogger.runWithContext).toHaveBeenCalledWith(
      '/api/users',
      'GET',
      expect.objectContaining({ traceId: expect.any(String) }),
      expect.any(Function)
    )
    expect(mockLogger.setResponseMetadata).toHaveBeenCalledWith(200, 2)
    expect(response).toBe(mockResponse)
  })

  it('should make trace ID available inside the callback via requestIdRepo', async () => {
    let capturedTraceId: string | undefined

    // Use real logger aggregator to test the full flow
    const realRepo = new RequestIdRepository()

    // Override runWithContext to capture what happens inside
    mockLogger.runWithContext.mockImplementation(
      async (_path, _method, meta, fn) => {
        capturedTraceId = realRepo.get()
        return fn()
      }
    )

    // Rebuild middleware with real requestIdRepo
    const mw = new TraceMiddleware(mockLogger as any, realRepo)

    const request = new NextRequest('http://localhost:3000/test')
    const mockResponse = new Response('ok', { status: 200 })

    await mw.use(request, async () => {
      // Inside the runWith context, the trace ID should be available
      capturedTraceId = realRepo.get()
      return mockResponse
    })

    expect(capturedTraceId).toBeDefined()
    expect(capturedTraceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('should handle zero content-length', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const mockResponse = new Response(null, {
      status: 204,
      headers: {}
    })

    await middleware.use(request, async () => mockResponse)

    expect(mockLogger.setResponseMetadata).toHaveBeenCalledWith(204, undefined)
  })
})
