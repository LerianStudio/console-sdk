import 'reflect-metadata'
import {
  Controller,
  ControllerHandler,
  ControllerMetadata
} from './controller-decorator'
import { CONTROLLER_KEY } from '../../constants/keys'
import { HttpMethods } from '../../constants/http-methods'

// Mock dependencies
jest.mock('../../utils/apply-decorators', () => ({
  applyDecorators:
    (...decorators: any[]) =>
    (target: any) => {
      decorators.forEach((decorator) => {
        if (typeof decorator === 'function') {
          decorator(target)
        }
      })
    }
}))

jest.mock('inversify', () => ({
  injectable: () => (target: any) => {
    Reflect.defineMetadata('inversify:injectable', true, target)
  }
}))

jest.mock('../../utils/class/get-class-methods', () => ({
  getClassMethods: jest.fn()
}))

jest.mock('../../utils/url/url-join', () => ({
  urlJoin: jest.fn()
}))

jest.mock('./route-decorator', () => ({
  RouteHandler: {
    getMetadata: jest.fn()
  }
}))

import { getClassMethods } from '../../utils/class/get-class-methods'
import { urlJoin } from '../../utils/url/url-join'
import { RouteHandler } from './route-decorator'

const mockGetClassMethods = getClassMethods as jest.MockedFunction<
  typeof getClassMethods
>
const mockUrlJoin = urlJoin as jest.MockedFunction<typeof urlJoin>
const mockRouteHandler = RouteHandler.getMetadata as jest.MockedFunction<
  typeof RouteHandler.getMetadata
>

describe('controller-decorator', () => {
  let originalConsoleWarn: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    originalConsoleWarn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    originalConsoleWarn.mockRestore()
  })

  describe('Controller decorator', () => {
    it('should define controller metadata with path', () => {
      @Controller('/api/users')
      class TestController {}

      const metadata = Reflect.getMetadata(CONTROLLER_KEY, TestController)

      expect(metadata).toEqual({ path: '/api/users' })
    })

    it('should apply injectable decorator', () => {
      @Controller('/api/test')
      class TestController {}

      const hasInjectableMetadata = Reflect.hasMetadata(
        'inversify:injectable',
        TestController
      )

      expect(hasInjectableMetadata).toBe(true)
    })

    it('should handle empty path', () => {
      @Controller('')
      class TestController {}

      const metadata = Reflect.getMetadata(CONTROLLER_KEY, TestController)

      expect(metadata).toEqual({ path: '' })
    })

    it('should handle root path', () => {
      @Controller('/')
      class TestController {}

      const metadata = Reflect.getMetadata(CONTROLLER_KEY, TestController)

      expect(metadata).toEqual({ path: '/' })
    })

    it('should handle complex paths', () => {
      @Controller('/api/v1/users')
      class TestController {}

      const metadata = Reflect.getMetadata(CONTROLLER_KEY, TestController)

      expect(metadata).toEqual({ path: '/api/v1/users' })
    })

    it('should work with multiple controllers', () => {
      @Controller('/api/users')
      class UsersController {}

      @Controller('/api/products')
      class ProductsController {}

      const usersMetadata = Reflect.getMetadata(CONTROLLER_KEY, UsersController)
      const productsMetadata = Reflect.getMetadata(
        CONTROLLER_KEY,
        ProductsController
      )

      expect(usersMetadata).toEqual({ path: '/api/users' })
      expect(productsMetadata).toEqual({ path: '/api/products' })
    })
  })

  describe('controllerHandler', () => {
    beforeEach(() => {
      mockGetClassMethods.mockReturnValue(['method1', 'method2'])
      mockUrlJoin.mockImplementation((base, path) => {
        if (!base || base === '/') return path || '/'
        if (!path || path === '/') return base || '/'
        return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`
      })
    })

    it('should return empty array when no controller metadata', () => {
      class TestController {}

      const routes = ControllerHandler.getRoutes(TestController)

      expect(routes).toEqual([])
      expect(originalConsoleWarn).toHaveBeenCalledWith(
        'Class TestController does not have a Controller decorator'
      )
    })

    it('should extract routes from controller methods', () => {
      @Controller('/api/users')
      class TestController {
        method1() {}
        method2() {}
      }

      mockRouteHandler
        .mockReturnValueOnce({ method: HttpMethods.GET, path: '/list' })
        .mockReturnValueOnce({ method: HttpMethods.POST, path: '/create' })

      const routes = ControllerHandler.getRoutes(TestController)

      expect(mockGetClassMethods).toHaveBeenCalledWith(TestController)
      expect(mockRouteHandler).toHaveBeenCalledWith(
        TestController.prototype,
        'method1'
      )
      expect(mockRouteHandler).toHaveBeenCalledWith(
        TestController.prototype,
        'method2'
      )
      expect(mockUrlJoin).toHaveBeenCalledWith('/api/users', '/list')
      expect(mockUrlJoin).toHaveBeenCalledWith('/api/users', '/create')

      expect(routes).toEqual([
        {
          methodName: 'method1',
          method: HttpMethods.GET,
          path: '/api/users/list'
        },
        {
          methodName: 'method2',
          method: HttpMethods.POST,
          path: '/api/users/create'
        }
      ])
    })

    it('should handle methods without route metadata', () => {
      @Controller('/api/users')
      class TestController {
        routeMethod() {}
        regularMethod() {}
      }

      mockGetClassMethods.mockReturnValue(['routeMethod', 'regularMethod'])

      mockRouteHandler
        .mockReturnValueOnce({ method: HttpMethods.GET, path: '/list' })
        .mockReturnValueOnce(undefined)

      const routes = ControllerHandler.getRoutes(TestController)

      expect(routes).toEqual([
        {
          methodName: 'routeMethod',
          method: HttpMethods.GET,
          path: '/api/users/list'
        }
      ])
    })

    it('should handle controller with no methods', () => {
      @Controller('/api/empty')
      class EmptyController {}

      mockGetClassMethods.mockReturnValue([])

      const routes = ControllerHandler.getRoutes(EmptyController)

      expect(routes).toEqual([])
    })

    it('should handle all HTTP methods', () => {
      @Controller('/api/resource')
      class ResourceController {
        getMethod() {}
        postMethod() {}
        putMethod() {}
        patchMethod() {}
        deleteMethod() {}
      }

      mockGetClassMethods.mockReturnValue([
        'getMethod',
        'postMethod',
        'putMethod',
        'patchMethod',
        'deleteMethod'
      ])

      mockRouteHandler
        .mockReturnValueOnce({ method: HttpMethods.GET, path: '' })
        .mockReturnValueOnce({ method: HttpMethods.POST, path: '' })
        .mockReturnValueOnce({ method: HttpMethods.PUT, path: '/:id' })
        .mockReturnValueOnce({ method: HttpMethods.PATCH, path: '/:id' })
        .mockReturnValueOnce({ method: HttpMethods.DELETE, path: '/:id' })

      const routes = ControllerHandler.getRoutes(ResourceController)

      expect(routes).toHaveLength(5)
      expect(routes.map((r) => r.method)).toEqual([
        HttpMethods.GET,
        HttpMethods.POST,
        HttpMethods.PUT,
        HttpMethods.PATCH,
        HttpMethods.DELETE
      ])
    })

    it('should handle complex path joining scenarios', () => {
      @Controller('/api/v1')
      class TestController {
        method1() {}
        method2() {}
      }

      mockRouteHandler
        .mockReturnValueOnce({ method: HttpMethods.GET, path: '/users/:id' })
        .mockReturnValueOnce({ method: HttpMethods.POST, path: '/users' })

      mockUrlJoin
        .mockReturnValueOnce('/api/v1/users/:id')
        .mockReturnValueOnce('/api/v1/users')

      const routes = ControllerHandler.getRoutes(TestController)

      expect(mockUrlJoin).toHaveBeenCalledWith('/api/v1', '/users/:id')
      expect(mockUrlJoin).toHaveBeenCalledWith('/api/v1', '/users')

      expect(routes).toEqual([
        {
          methodName: 'method1',
          method: HttpMethods.GET,
          path: '/api/v1/users/:id'
        },
        {
          methodName: 'method2',
          method: HttpMethods.POST,
          path: '/api/v1/users'
        }
      ])
    })

    it('should handle empty controller path', () => {
      @Controller('')
      class TestController {
        method1() {}
      }

      mockRouteHandler.mockReturnValueOnce({
        method: HttpMethods.GET,
        path: '/list'
      })

      mockUrlJoin.mockReturnValueOnce('/list')

      const routes = ControllerHandler.getRoutes(TestController)

      expect(mockUrlJoin).toHaveBeenCalledWith('', '/list')
      expect(routes).toEqual([
        {
          methodName: 'method1',
          method: HttpMethods.GET,
          path: '/list'
        }
      ])
    })

    it('should handle root controller path', () => {
      @Controller('/')
      class TestController {
        method1() {}
      }

      mockRouteHandler.mockReturnValueOnce({
        method: HttpMethods.GET,
        path: '/list'
      })

      mockUrlJoin.mockReturnValueOnce('/list')

      const routes = ControllerHandler.getRoutes(TestController)

      expect(mockUrlJoin).toHaveBeenCalledWith('/', '/list')
      expect(routes).toEqual([
        {
          methodName: 'method1',
          method: HttpMethods.GET,
          path: '/list'
        }
      ])
    })

    it('should handle methods with special characters in names', () => {
      @Controller('/api/test')
      class TestController {
        'special-method'() {}
        another_method() {}
      }

      mockGetClassMethods.mockReturnValue(['special-method', 'another_method'])

      mockRouteHandler
        .mockReturnValueOnce({ method: HttpMethods.GET, path: '/special' })
        .mockReturnValueOnce({ method: HttpMethods.POST, path: '/another' })

      const routes = ControllerHandler.getRoutes(TestController)

      expect(routes).toEqual([
        {
          methodName: 'special-method',
          method: HttpMethods.GET,
          path: '/api/test/special'
        },
        {
          methodName: 'another_method',
          method: HttpMethods.POST,
          path: '/api/test/another'
        }
      ])
    })
  })

  describe('ControllerMetadata type', () => {
    it('should have correct type structure', () => {
      const metadata: ControllerMetadata = {
        methodName: 'testMethod',
        method: HttpMethods.GET,
        path: '/test/path'
      }

      expect(typeof metadata.methodName).toBe('string')
      expect(Object.values(HttpMethods)).toContain(metadata.method)
      expect(typeof metadata.path).toBe('string')
    })

    it('should work with all HTTP methods', () => {
      const getRoute: ControllerMetadata = {
        methodName: 'getMethod',
        method: HttpMethods.GET,
        path: '/get'
      }

      const postRoute: ControllerMetadata = {
        methodName: 'postMethod',
        method: HttpMethods.POST,
        path: '/post'
      }

      const putRoute: ControllerMetadata = {
        methodName: 'putMethod',
        method: HttpMethods.PUT,
        path: '/put'
      }

      const patchRoute: ControllerMetadata = {
        methodName: 'patchMethod',
        method: HttpMethods.PATCH,
        path: '/patch'
      }

      const deleteRoute: ControllerMetadata = {
        methodName: 'deleteMethod',
        method: HttpMethods.DELETE,
        path: '/delete'
      }

      expect([
        getRoute,
        postRoute,
        putRoute,
        patchRoute,
        deleteRoute
      ]).toHaveLength(5)
    })
  })
})
