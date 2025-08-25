import { ArgumentsHost } from './arguments-host'
import { HttpArgumentsHost } from './http-arguments-host'
import { NextResponse } from 'next/server'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: jest.fn()
}))

// Mock HttpArgumentsHost
jest.mock('./http-arguments-host')
const MockedHttpArgumentsHost = HttpArgumentsHost as jest.MockedClass<
  typeof HttpArgumentsHost
>

describe('ArgumentsHost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with default http type', () => {
      const args = ['arg1', 'arg2', 'arg3']
      const host = new ArgumentsHost(args)

      expect(host.getType()).toBe('http')
      expect(host.getArgs()).toBe(args)
    })

    it('should initialize with explicit http type', () => {
      const args = ['request', 'response']
      const host = new ArgumentsHost(args, 'http')

      expect(host.getType()).toBe('http')
      expect(host.getArgs()).toBe(args)
    })

    it('should create HttpArgumentsHost with first argument and NextResponse', () => {
      const args = ['request', 'response', 'next']
      new ArgumentsHost(args)

      expect(MockedHttpArgumentsHost).toHaveBeenCalledWith(
        'request',
        NextResponse
      )
    })

    it('should handle empty arguments array', () => {
      const args: any[] = []
      const host = new ArgumentsHost(args)

      expect(host.getArgs()).toEqual([])
      expect(MockedHttpArgumentsHost).toHaveBeenCalledWith(
        undefined,
        NextResponse
      )
    })

    it('should handle single argument', () => {
      const args = ['single-arg']
      const host = new ArgumentsHost(args)

      expect(host.getArgs()).toEqual(['single-arg'])
      expect(MockedHttpArgumentsHost).toHaveBeenCalledWith(
        'single-arg',
        NextResponse
      )
    })
  })

  describe('getType', () => {
    it('should return http type', () => {
      const host = new ArgumentsHost([])
      expect(host.getType()).toBe('http')
    })
  })

  describe('getArgs', () => {
    it('should return original arguments array', () => {
      const args = ['arg1', 'arg2', 'arg3']
      const host = new ArgumentsHost(args)

      expect(host.getArgs()).toBe(args)
      expect(host.getArgs()).toEqual(['arg1', 'arg2', 'arg3'])
    })

    it('should return reference to same array', () => {
      const args = ['test']
      const host = new ArgumentsHost(args)
      const returned = host.getArgs()

      expect(returned).toBe(args) // Same reference

      // Modifying original should affect returned
      args.push('new')
      expect(returned).toContain('new')
    })
  })

  describe('getArgsByIndex', () => {
    it('should return argument at specified index', () => {
      const args = ['first', 'second', 'third']
      const host = new ArgumentsHost(args)

      expect(host.getArgsByIndex(0)).toBe('first')
      expect(host.getArgsByIndex(1)).toBe('second')
      expect(host.getArgsByIndex(2)).toBe('third')
    })

    it('should return undefined for out of bounds index', () => {
      const args = ['arg1', 'arg2']
      const host = new ArgumentsHost(args)

      expect(host.getArgsByIndex(5)).toBeUndefined()
      expect(host.getArgsByIndex(-1)).toBeUndefined()
    })

    it('should handle negative indices according to JavaScript array behavior', () => {
      const args = ['a', 'b', 'c']
      const host = new ArgumentsHost(args)

      // JavaScript arrays return undefined for negative indices
      expect(host.getArgsByIndex(-1)).toBeUndefined()
      expect(host.getArgsByIndex(-2)).toBeUndefined()
    })

    it('should return undefined for empty args array', () => {
      const host = new ArgumentsHost([])

      expect(host.getArgsByIndex(0)).toBeUndefined()
      expect(host.getArgsByIndex(1)).toBeUndefined()
    })
  })

  describe('switchToHttp', () => {
    it('should return HttpArgumentsHost instance', () => {
      const mockHttpHost = {} as HttpArgumentsHost
      MockedHttpArgumentsHost.mockImplementation(() => mockHttpHost)

      const args = ['request']
      const host = new ArgumentsHost(args)

      const httpHost = host.switchToHttp()

      expect(httpHost).toBe(mockHttpHost)
    })

    it('should return same HttpArgumentsHost instance on multiple calls', () => {
      const mockHttpHost = {} as HttpArgumentsHost
      MockedHttpArgumentsHost.mockImplementation(() => mockHttpHost)

      const host = new ArgumentsHost(['request'])

      const httpHost1 = host.switchToHttp()
      const httpHost2 = host.switchToHttp()

      expect(httpHost1).toBe(httpHost2)
      expect(MockedHttpArgumentsHost).toHaveBeenCalledTimes(1) // Only called once in constructor
    })
  })

  describe('integration with different argument types', () => {
    it('should handle Request objects', () => {
      const mockRequest = new Request('https://example.com')
      const args = [mockRequest, 'response']
      const host = new ArgumentsHost(args)

      expect(host.getArgsByIndex(0)).toBe(mockRequest)
      expect(MockedHttpArgumentsHost).toHaveBeenCalledWith(
        mockRequest,
        NextResponse
      )
    })

    it('should handle complex objects', () => {
      const complexArg = { nested: { data: 'value' }, array: [1, 2, 3] }
      const args = [complexArg]
      const host = new ArgumentsHost(args)

      expect(host.getArgsByIndex(0)).toBe(complexArg)
      expect(MockedHttpArgumentsHost).toHaveBeenCalledWith(
        complexArg,
        NextResponse
      )
    })

    it('should handle null and undefined arguments', () => {
      const args = [null, undefined, 'valid']
      const host = new ArgumentsHost(args)

      expect(host.getArgsByIndex(0)).toBeNull()
      expect(host.getArgsByIndex(1)).toBeUndefined()
      expect(host.getArgsByIndex(2)).toBe('valid')
    })

    it('should handle functions as arguments', () => {
      const func = () => 'test'
      const args = [func, 'other']
      const host = new ArgumentsHost(args)

      expect(host.getArgsByIndex(0)).toBe(func)
      expect(MockedHttpArgumentsHost).toHaveBeenCalledWith(func, NextResponse)
    })
  })

  describe('type safety', () => {
    it('should maintain type information', () => {
      const args = ['string', 123, true, { obj: 'value' }]
      const host = new ArgumentsHost(args)

      expect(typeof host.getArgsByIndex(0)).toBe('string')
      expect(typeof host.getArgsByIndex(1)).toBe('number')
      expect(typeof host.getArgsByIndex(2)).toBe('boolean')
      expect(typeof host.getArgsByIndex(3)).toBe('object')
    })
  })

  describe('edge cases', () => {
    it('should handle very large arguments array', () => {
      const largeArgs = Array.from({ length: 1000 }, (_, i) => `arg${i}`)
      const host = new ArgumentsHost(largeArgs)

      expect(host.getArgs()).toHaveLength(1000)
      expect(host.getArgsByIndex(0)).toBe('arg0')
      expect(host.getArgsByIndex(999)).toBe('arg999')
    })

    it('should handle arguments with special values', () => {
      const args = [0, '', false, null, undefined, NaN, Infinity]
      const host = new ArgumentsHost(args)

      expect(host.getArgsByIndex(0)).toBe(0)
      expect(host.getArgsByIndex(1)).toBe('')
      expect(host.getArgsByIndex(2)).toBe(false)
      expect(host.getArgsByIndex(3)).toBe(null)
      expect(host.getArgsByIndex(4)).toBe(undefined)
      expect(Number.isNaN(host.getArgsByIndex(5))).toBe(true)
      expect(host.getArgsByIndex(6)).toBe(Infinity)
    })
  })
})
