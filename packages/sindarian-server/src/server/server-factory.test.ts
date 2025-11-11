import 'reflect-metadata'
import { ServerFactory, ServerFactoryOptions } from './server-factory'
import { Container } from '@/dependency-injection/container'
import { NextRequest, NextResponse } from 'next/server'
import { HttpMethods } from '@/constants/http-methods'

// Mock all dependencies
jest.mock('@/dependency-injection/container')
jest.mock('@/context/arguments-host')
jest.mock('@/context/execution-context')
jest.mock('@/controllers/base-controller')
jest.mock('@/exceptions/base-exception-filter')
jest.mock('@/exceptions/decorators/catch-decorator')
jest.mock('@/exceptions/decorators/use-filters-decorator', () => ({
  FilterHandler: {
    fetch: jest.fn()
  }
}))
jest.mock('@/interceptor/decorators/use-interceptor-decorator', () => ({
  InterceptorHandler: {
    fetch: jest.fn(),
    execute: jest.fn()
  }
}))
jest.mock('@/pipes/decorators/use-pipes', () => ({
  PipeHandler: {
    fetch: jest.fn(),
    execute: jest.fn()
  }
}))
jest.mock('@/controllers/decorators/route-decorator', () => ({
  RouteHandler: {
    getArgs: jest.fn()
  }
}))
jest.mock('@/modules/module-decorator')
jest.mock('@/services/request')
jest.mock('@/utils/url/url-match')
jest.mock('@/logger/logger')
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn()
  }
}))
jest.mock('lodash', () => ({
  isNil: jest.fn()
}))

import { ArgumentsHost } from '@/context/arguments-host'
import { ExecutionContext } from '@/context/execution-context'
import { BaseController } from '@/controllers/base-controller'
import { BaseExceptionFilter } from '@/exceptions/base-exception-filter'
import { catchHandler } from '@/exceptions/decorators/catch-decorator'
import { FilterHandler } from '@/exceptions/decorators/use-filters-decorator'
import { InterceptorHandler } from '@/interceptor/decorators/use-interceptor-decorator'
import { PipeHandler } from '@/pipes/decorators/use-pipes'
import { RouteHandler } from '@/controllers/decorators/route-decorator'
import { moduleHandler } from '@/modules/module-decorator'
import { bindRequest } from '@/services/request'
import { urlMatch } from '@/utils/url/url-match'
import { Logger } from '@/logger/logger'
import { isNil } from 'lodash'

const mockContainer = Container as jest.MockedClass<typeof Container>
const mockArgumentsHost = ArgumentsHost as jest.MockedClass<
  typeof ArgumentsHost
>
const mockExecutionContext = ExecutionContext as jest.MockedClass<
  typeof ExecutionContext
>
const mockBaseController = BaseController as jest.MockedClass<
  typeof BaseController
>
const mockBaseExceptionFilter = BaseExceptionFilter as jest.MockedClass<
  typeof BaseExceptionFilter
>
const mockCatchHandler = catchHandler as jest.MockedFunction<
  typeof catchHandler
>
const mockFilterHandler = FilterHandler.fetch as jest.MockedFunction<
  typeof FilterHandler.fetch
>
const mockInterceptorExecute = InterceptorHandler.execute as jest.MockedFunction<
  typeof InterceptorHandler.execute
>
const mockInterceptorHandler = InterceptorHandler.fetch as jest.MockedFunction<
  typeof InterceptorHandler.fetch
>
const mockPipeHandler = PipeHandler.fetch as jest.MockedFunction<
  typeof PipeHandler.fetch
>
const mockPipeExecute = PipeHandler.execute as jest.MockedFunction<
  typeof PipeHandler.execute
>
const mockRouteHandler = RouteHandler.getArgs as jest.MockedFunction<
  typeof RouteHandler.getArgs
>
const mockModuleHandler = moduleHandler as jest.MockedFunction<
  typeof moduleHandler
>
const mockBindRequest = bindRequest as jest.MockedFunction<typeof bindRequest>
const mockUrlMatch = urlMatch as jest.MockedFunction<typeof urlMatch>
const mockLogger = Logger as jest.Mocked<typeof Logger>
const mockIsNil = isNil as jest.MockedFunction<typeof isNil>

describe('ServerFactory', () => {
  let serverFactory: ServerFactory
  let mockContainerInstance: jest.Mocked<Container>
  let mockModule: any
  let mockRoutes: any[]

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock container instance
    mockContainerInstance = {
      container: {} as any,
      load: jest.fn(),
      bind: jest.fn(),
      get: jest.fn(),
      getAsync: jest.fn(),
      isBound: jest.fn(),
      unbind: jest.fn(),
      rebind: jest.fn()
    } as any

    mockContainer.mockImplementation(() => mockContainerInstance)

    // Setup mock module
    mockModule = jest.fn()
    mockModule.prototype = { __module__: { registry: jest.fn() } }

    // Setup mock routes
    mockRoutes = [
      {
        controller: mockModule,
        methodName: 'testMethod',
        method: HttpMethods.GET,
        path: '/test'
      }
    ]

    // Setup basic mocks
    mockModuleHandler.mockReturnValue(mockRoutes)
    mockLogger.log = jest.fn()
    mockLogger.error = jest.fn()
    mockLogger.overrideLogger = jest.fn()
    mockIsNil.mockReturnValue(false)
    mockFilterHandler.mockResolvedValue([])
    mockInterceptorHandler.mockResolvedValue([])
    mockPipeHandler.mockResolvedValue([])
    mockInterceptorExecute.mockImplementation(async (context, interceptors, action) => await action())
    mockPipeExecute.mockImplementation(async (controller, methodName, pipes, args) => args.map((arg: any) => arg.parameter))
    mockRouteHandler.mockReturnValue([])
    mockCatchHandler.mockReturnValue({ type: null })
  })

  describe('constructor', () => {
    it('should create ServerFactory instance', () => {
      serverFactory = new ServerFactory(
        mockModule,
        mockContainerInstance,
        mockRoutes
      )

      expect(serverFactory).toBeInstanceOf(ServerFactory)
      expect(mockLogger.log).toHaveBeenCalledWith('Application Started.')
    })

    it('should store module, container, and routes', () => {
      serverFactory = new ServerFactory(
        mockModule,
        mockContainerInstance,
        mockRoutes
      )

      expect(serverFactory['module']).toBe(mockModule)
      expect(serverFactory['container']).toBe(mockContainerInstance)
      expect(serverFactory['routes']).toBe(mockRoutes)
    })

    it('should initialize with default values', () => {
      serverFactory = new ServerFactory(
        mockModule,
        mockContainerInstance,
        mockRoutes
      )

      expect(serverFactory['globalPrefix']).toBe('')
      expect(serverFactory['globalFilters']).toHaveLength(1)
      expect(serverFactory['globalFilters'][0]).toBeInstanceOf(
        BaseExceptionFilter
      )
      expect(serverFactory['globalInterceptors']).toEqual([])
    })
  })

  describe('create static method', () => {
    beforeEach(() => {
      mockContainer.mockImplementation(() => mockContainerInstance)
    })

    it('should create ServerFactory with default options', () => {
      const result = ServerFactory.create(mockModule)

      expect(mockContainer).toHaveBeenCalled()
      expect(mockContainerInstance.load).toHaveBeenCalledWith(
        mockModule.prototype.__module__
      )
      expect(mockModuleHandler).toHaveBeenCalledWith(mockModule)
      expect(result).toBeInstanceOf(ServerFactory)
    })

    it('should register logger when provided', () => {
      const mockLoggerService = { log: jest.fn() }
      const options: ServerFactoryOptions = { logger: mockLoggerService }

      ServerFactory.create(mockModule, options)

      expect(mockLogger.overrideLogger).toHaveBeenCalledWith(mockLoggerService)
    })

    it('should not register logger when false', () => {
      const options: ServerFactoryOptions = { logger: false }

      ServerFactory.create(mockModule, options)

      expect(mockLogger.overrideLogger).not.toHaveBeenCalled()
    })

    it('should register logger when true', () => {
      mockIsNil.mockReturnValue(false)
      const options: ServerFactoryOptions = { logger: true }

      ServerFactory.create(mockModule, options)

      expect(mockLogger.overrideLogger).toHaveBeenCalledWith(true)
    })
  })

  describe('setGlobalPrefix', () => {
    beforeEach(() => {
      serverFactory = new ServerFactory(
        mockModule,
        mockContainerInstance,
        mockRoutes
      )
    })

    it('should set global prefix', () => {
      serverFactory.setGlobalPrefix('/api/v1')

      expect(serverFactory['globalPrefix']).toBe('/api/v1')
    })

    it('should handle empty prefix', () => {
      serverFactory.setGlobalPrefix('')

      expect(serverFactory['globalPrefix']).toBe('')
    })
  })

  describe('useGlobalFilters', () => {
    beforeEach(() => {
      serverFactory = new ServerFactory(
        mockModule,
        mockContainerInstance,
        mockRoutes
      )
    })

    it('should add global filters', () => {
      const filter1 = new BaseExceptionFilter()
      const filter2 = new BaseExceptionFilter()

      serverFactory.useGlobalFilters(filter1, filter2)

      expect(serverFactory['globalFilters']).toHaveLength(3) // 1 default + 2 added
      expect(serverFactory['globalFilters']).toContain(filter1)
      expect(serverFactory['globalFilters']).toContain(filter2)
    })
  })

  describe('useGlobalInterceptors', () => {
    beforeEach(() => {
      serverFactory = new ServerFactory(
        mockModule,
        mockContainerInstance,
        mockRoutes
      )
    })

    it('should add global interceptors', () => {
      const interceptor1 = { intercept: jest.fn() } as any
      const interceptor2 = { intercept: jest.fn() } as any

      serverFactory.useGlobalInterceptors(interceptor1, interceptor2)

      expect(serverFactory['globalInterceptors']).toHaveLength(2)
      expect(serverFactory['globalInterceptors']).toContain(interceptor1)
      expect(serverFactory['globalInterceptors']).toContain(interceptor2)
    })
  })

  describe('handler', () => {
    let mockRequest: NextRequest
    let mockController: jest.Mocked<BaseController>
    let mockParams: Promise<any>

    beforeEach(() => {
      serverFactory = new ServerFactory(
        mockModule,
        mockContainerInstance,
        mockRoutes
      )

      mockRequest = {
        url: 'http://localhost:3000/test',
        method: 'GET'
      } as NextRequest

      mockController = {
        testMethod: jest.fn().mockResolvedValue({ success: true })
      } as any

      mockParams = Promise.resolve({ id: '123' })

      // Setup mocks
      mockArgumentsHost.mockImplementation(
        () => ({ getRequest: () => mockRequest }) as any
      )
      mockContainerInstance.getAsync.mockResolvedValue(mockController)
      mockUrlMatch.mockReturnValue({ params: { id: '123' } })
      mockInterceptorHandler.mockResolvedValue([])
      mockInterceptorExecute.mockImplementation(
        async (ctx, interceptors, action) => action()
      )
      mockExecutionContext.mockImplementation(() => ({}) as any)
    })

    it('should handle successful request', async () => {
      const response = await serverFactory.handler(mockRequest, {
        params: mockParams
      })

      expect(mockBindRequest).toHaveBeenCalledWith(
        mockContainerInstance,
        mockRequest
      )
      expect(mockUrlMatch).toHaveBeenCalledWith('/test', '/test')
      expect(mockContainerInstance.getAsync).toHaveBeenCalledWith(mockModule)
      expect(mockController.testMethod).toHaveBeenCalled()
      expect(response).toEqual({ success: true })
    })

    it('should handle request with global prefix', async () => {
      serverFactory.setGlobalPrefix('/api/v1')
      mockRequest = {
        url: 'http://localhost:3000/api/v1/test',
        method: 'GET'
      } as NextRequest

      await serverFactory.handler(mockRequest, { params: mockParams })

      expect(mockUrlMatch).toHaveBeenCalledWith('/test', '/test')
    })

    it('should handle route not found with exception filter', async () => {
      mockUrlMatch.mockReturnValue(null)
      mockRoutes.length = 0

      // Mock the exception filter response
      const mockExceptionResponse = NextResponse.json(
        { error: 'Not Found' },
        { status: 404 }
      )
      const mockFilter = {
        catch: jest.fn().mockResolvedValue(mockExceptionResponse),
        constructor: jest.fn()
      }
      serverFactory['globalFilters'] = [mockFilter as any]
      mockCatchHandler.mockReturnValue({ type: null })

      const response = await serverFactory.handler(mockRequest, {
        params: mockParams
      })

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Route not found for GET /test'
      )
      expect(mockFilter.catch).toHaveBeenCalled()
      expect(response).toBe(mockExceptionResponse)
    })

    it.skip('should handle exceptions with filters', async () => {
      const testError = new Error('Test error')
      mockController.testMethod.mockRejectedValue(testError)

      const mockFilter = {
        catch: jest
          .fn()
          .mockResolvedValue(NextResponse.json({ error: 'handled' }))
      }

      mockCatchHandler.mockReturnValue({ type: Error })
      serverFactory['globalFilters'] = [mockFilter as any]

      const response = await serverFactory.handler(mockRequest, {
        params: mockParams
      })

      expect(mockFilter.catch).toHaveBeenCalledWith(
        testError,
        expect.any(Object)
      )
      expect(response).toBeDefined()
    })

    it.skip('should return 500 when no filter handles exception', async () => {
      const testError = new Error('Unhandled error')
      mockController.testMethod.mockRejectedValue(testError)

      mockCatchHandler.mockReturnValue({ type: null })
      const mockFilter = {
        catch: jest.fn().mockResolvedValue(null)
      }
      serverFactory['globalFilters'] = [mockFilter as any]

      const response = await serverFactory.handler(mockRequest, {
        params: mockParams
      })

      expect(response).toBeDefined()
    })

    it('should execute interceptors', async () => {
      const mockInterceptor = { intercept: jest.fn() }
      mockInterceptorHandler.mockResolvedValue([mockInterceptor] as any)

      // Reset the mock before our specific test
      mockInterceptorExecute.mockClear()

      await serverFactory.handler(mockRequest, { params: mockParams })

      expect(mockInterceptorExecute).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Array),
        expect.any(Function)
      )
    })
  })

  describe('_parseRequest', () => {
    beforeEach(() => {
      serverFactory = new ServerFactory(
        mockModule,
        mockContainerInstance,
        mockRoutes
      )
    })

    it('should parse request without global prefix', () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/users',
        method: 'POST'
      } as NextRequest

      const result = serverFactory['_parseRequest'](mockRequest)

      expect(result).toEqual({
        pathname: '/api/users',
        method: 'POST'
      })
    })

    it('should parse request with global prefix', () => {
      serverFactory.setGlobalPrefix('/api/v1')
      const mockRequest = {
        url: 'http://localhost:3000/api/v1/users',
        method: 'GET'
      } as NextRequest

      const result = serverFactory['_parseRequest'](mockRequest)

      expect(result).toEqual({
        pathname: '/users',
        method: 'GET'
      })
    })

    it('should handle lowercase HTTP method', () => {
      const mockRequest = {
        url: 'http://localhost:3000/test',
        method: 'get'
      } as NextRequest

      const result = serverFactory['_parseRequest'](mockRequest)

      expect(result.method).toBe('GET')
    })
  })

  describe('_fetchRoute', () => {
    beforeEach(() => {
      serverFactory = new ServerFactory(
        mockModule,
        mockContainerInstance,
        mockRoutes
      )
    })

    it('should find matching route', () => {
      mockUrlMatch.mockReturnValue({ params: {} })

      const result = serverFactory['_fetchRoute']('/test', 'GET')

      expect(mockUrlMatch).toHaveBeenCalledWith('/test', '/test')
      expect(result).toEqual(mockRoutes[0])
    })

    it('should throw NotFoundApiException when route not found', () => {
      mockUrlMatch.mockReturnValue(null)

      expect(() => serverFactory['_fetchRoute']('/nonexistent', 'GET')).toThrow(
        'Route /nonexistent not found'
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Route not found for GET /nonexistent'
      )
    })

    it('should match by method and path', () => {
      mockRoutes.push({
        controller: mockModule,
        methodName: 'postMethod',
        method: HttpMethods.POST,
        path: '/test'
      })

      mockUrlMatch.mockReturnValue({ params: {} })

      const result = serverFactory['_fetchRoute']('/test', 'POST')

      expect(result.method).toBe(HttpMethods.POST)
    })
  })

  describe('_fetchInterceptors', () => {
    let mockController: BaseController

    beforeEach(() => {
      serverFactory = new ServerFactory(
        mockModule,
        mockContainerInstance,
        mockRoutes
      )
      mockController = { constructor: mockModule } as BaseController
    })

    it('should return global interceptors', async () => {
      const globalInterceptor = { intercept: jest.fn() }
      serverFactory['globalInterceptors'] = [globalInterceptor as any]

      mockContainerInstance.isBound.mockReturnValue(false)
      mockInterceptorHandler.mockResolvedValue([])

      const result = await serverFactory['_fetchInterceptors'](mockController)

      expect(result).toContain(globalInterceptor)
    })

    it('should fetch app interceptor', async () => {
      const appInterceptor = { intercept: jest.fn() }
      mockContainerInstance.isBound.mockReturnValue(true)
      mockContainerInstance.getAsync.mockResolvedValue(appInterceptor)
      mockInterceptorHandler.mockResolvedValue([])

      const result = await serverFactory['_fetchInterceptors'](mockController)

      expect(mockContainerInstance.isBound).toHaveBeenCalledWith(
        expect.any(Symbol)
      )
      expect(result).toContain(appInterceptor)
    })

    it('should resolve controller interceptors', async () => {
      const interceptorClass = class TestInterceptor {}
      const interceptorInstance = { intercept: jest.fn() }

      mockContainerInstance.isBound.mockReturnValue(false)
      mockInterceptorHandler.mockResolvedValue([interceptorInstance])
      mockContainerInstance.getAsync.mockResolvedValue(interceptorInstance)

      const result = await serverFactory['_fetchInterceptors'](mockController)

      expect(result).toContain(interceptorInstance)
    })
  })

  describe('_fetchExceptionFilters', () => {
    let mockController: BaseController

    beforeEach(() => {
      serverFactory = new ServerFactory(
        mockModule,
        mockContainerInstance,
        mockRoutes
      )
      mockController = { constructor: mockModule } as BaseController
    })

    it('should return global filters', async () => {
      mockContainerInstance.isBound.mockReturnValue(false)
      mockFilterHandler.mockReturnValue([])

      const result =
        await serverFactory['_fetchExceptionFilters'](mockController)

      expect(result).toContain(serverFactory['globalFilters'][0])
    })

    it('should fetch app filter', async () => {
      const appFilter = { catch: jest.fn() }
      mockContainerInstance.isBound.mockReturnValue(true)
      mockContainerInstance.getAsync.mockResolvedValue(appFilter)
      mockFilterHandler.mockReturnValue([])

      const result =
        await serverFactory['_fetchExceptionFilters'](mockController)

      expect(mockContainerInstance.isBound).toHaveBeenCalledWith(
        expect.any(Symbol)
      )
      expect(result).toEqual(expect.arrayContaining([expect.any(Object)]))
    })

    it('should include controller filters', async () => {
      const controllerFilter = { catch: jest.fn() }
      mockContainerInstance.isBound.mockReturnValue(false)
      mockFilterHandler.mockReturnValue([controllerFilter])

      const result =
        await serverFactory['_fetchExceptionFilters'](mockController)

      expect(result).toEqual(expect.arrayContaining([expect.any(Object)]))
    })
  })

  describe('_fetchHandler', () => {
    let mockController: BaseController

    beforeEach(() => {
      serverFactory = new ServerFactory(
        mockModule,
        mockContainerInstance,
        mockRoutes
      )
      mockController = {
        testMethod: jest.fn().mockReturnValue('test result'),
        anotherMethod: jest.fn().mockReturnValue('another result')
      } as any
    })

    it('should return a named function wrapper', () => {
      const handler = serverFactory['_fetchHandler'](
        mockController,
        'testMethod'
      )

      expect(typeof handler).toBe('function')
      expect(handler.name).toBe('testMethod')
    })

    it('should preserve method name for different methods', () => {
      const testHandler = serverFactory['_fetchHandler'](
        mockController,
        'testMethod'
      )
      const anotherHandler = serverFactory['_fetchHandler'](
        mockController,
        'anotherMethod'
      )

      expect(testHandler.name).toBe('testMethod')
      expect(anotherHandler.name).toBe('anotherMethod')
    })

    it('should call original method with correct context and arguments', () => {
      const handler = serverFactory['_fetchHandler'](
        mockController,
        'testMethod'
      )
      const args = ['arg1', 'arg2']

      const result = handler(...args)

      expect(mockController.testMethod).toHaveBeenCalledWith(...args)
      expect(result).toBe('test result')
    })

    it('should maintain this context when calling original method', () => {
      const mockMethod = jest.fn(function (this: any) {
        return this
      })
      mockController.contextMethod = mockMethod

      const handler = serverFactory['_fetchHandler'](
        mockController,
        'contextMethod'
      )
      const result = handler()

      expect(result).toBe(mockController)
    })

    it('should handle methods with no arguments', () => {
      const handler = serverFactory['_fetchHandler'](
        mockController,
        'testMethod'
      )

      const result = handler()

      expect(mockController.testMethod).toHaveBeenCalledWith()
      expect(result).toBe('test result')
    })

    it('should handle methods that return promises', async () => {
      const asyncMethod = jest.fn().mockResolvedValue('async result')
      mockController.asyncMethod = asyncMethod

      const handler = serverFactory['_fetchHandler'](
        mockController,
        'asyncMethod'
      )
      const result = await handler('test-arg')

      expect(asyncMethod).toHaveBeenCalledWith('test-arg')
      expect(result).toBe('async result')
    })

    it('should handle methods that throw errors', () => {
      const errorMethod = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      mockController.errorMethod = errorMethod

      const handler = serverFactory['_fetchHandler'](
        mockController,
        'errorMethod'
      )

      expect(() => handler()).toThrow('Test error')
      expect(errorMethod).toHaveBeenCalled()
    })
  })

  describe('_registerLogger static method', () => {
    it('should register logger service', () => {
      const mockLoggerService = { log: jest.fn() }
      mockIsNil.mockReturnValue(false)

      ServerFactory['_registerLogger'](mockLoggerService)

      expect(mockLogger.overrideLogger).toHaveBeenCalledWith(mockLoggerService)
    })

    it('should not register when logger is false', () => {
      ServerFactory['_registerLogger'](false)

      expect(mockLogger.overrideLogger).not.toHaveBeenCalled()
    })

    it('should not register when logger is nil', () => {
      mockIsNil.mockReturnValue(true)

      ServerFactory['_registerLogger'](undefined)

      expect(mockLogger.overrideLogger).not.toHaveBeenCalled()
    })
  })
})
