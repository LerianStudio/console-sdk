import { logHttpEvent } from './http-log-helper'
import { LoggerAggregator } from '@/aggregator/logger-aggregator'

describe('logHttpEvent', () => {
  let mockLogger: jest.Mocked<
    Pick<LoggerAggregator, 'info' | 'error' | 'warn' | 'debug' | 'audit'>
  >

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      audit: jest.fn()
    }
  })

  describe('onBeforeFetch', () => {
    it('should log request method and URL', () => {
      const request = new Request('https://api.example.com/users', {
        method: 'POST'
      })

      logHttpEvent(mockLogger as any, 'UserService', 'onBeforeFetch', [request])

      expect(mockLogger.info).toHaveBeenCalledWith(
        'UserService.onBeforeFetch',
        'POST https://api.example.com/users'
      )
    })

    it('should not log if first arg is not a Request', () => {
      logHttpEvent(mockLogger as any, 'Svc', 'onBeforeFetch', ['not-request'])

      expect(mockLogger.info).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('onAfterFetch', () => {
    it('should log info for successful responses', () => {
      const request = new Request('https://api.example.com/users', {
        method: 'GET'
      })
      const response = new Response(null, { status: 200 })

      logHttpEvent(mockLogger as any, 'UserService', 'onAfterFetch', [
        request,
        response
      ])

      expect(mockLogger.info).toHaveBeenCalledWith(
        'UserService.onAfterFetch',
        'GET https://api.example.com/users → 200'
      )
    })

    it('should log error for failed responses', () => {
      const request = new Request('https://api.example.com/users', {
        method: 'GET'
      })
      const response = new Response(null, { status: 500 })

      logHttpEvent(mockLogger as any, 'UserService', 'onAfterFetch', [
        request,
        response
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.onAfterFetch',
        'GET https://api.example.com/users → 500'
      )
    })

    it('should not log if second arg is not a Response', () => {
      const request = new Request('https://api.example.com/users')

      logHttpEvent(mockLogger as any, 'Svc', 'onAfterFetch', [
        request,
        'not-response'
      ])

      expect(mockLogger.info).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('catch', () => {
    it('should log error with message from error object', () => {
      const request = new Request('https://api.example.com/users', {
        method: 'POST'
      })
      const response = new Response(null, { status: 500 })
      const error = { message: 'Internal Server Error' }

      logHttpEvent(mockLogger as any, 'UserService', 'catch', [
        request,
        response,
        error
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.catch',
        'POST https://api.example.com/users → 500: Internal Server Error'
      )
    })

    it('should JSON-stringify error when no message property', () => {
      const request = new Request('https://api.example.com/users', {
        method: 'GET'
      })
      const response = new Response(null, { status: 400 })
      const error = { code: 'VALIDATION_ERROR' }

      logHttpEvent(mockLogger as any, 'UserService', 'catch', [
        request,
        response,
        error
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.catch',
        expect.stringContaining('VALIDATION_ERROR')
      )
    })
  })

  describe('unknown method', () => {
    it('should not log for unrecognized method names', () => {
      logHttpEvent(mockLogger as any, 'Svc', 'unknownMethod', ['arg'])

      expect(mockLogger.info).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })
})
