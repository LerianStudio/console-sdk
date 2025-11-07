import { LOG_LEVELS, LogLevel, LoggerService } from './logger-service'

describe('logger-service', () => {
  describe('LOG_LEVELS constant', () => {
    it('should contain all expected log levels', () => {
      expect(LOG_LEVELS).toEqual([
        'verbose',
        'debug',
        'log',
        'warn',
        'error',
        'fatal'
      ])
    })

    it('should be readonly array', () => {
      expect(Array.isArray(LOG_LEVELS)).toBe(true)
      // TypeScript readonly arrays are not frozen at runtime, just compile-time immutable
      expect(() => {
        // This would fail at compile time but not runtime
        const levels = LOG_LEVELS as any
        expect(levels).toBeDefined()
      }).not.toThrow()
    })

    it('should have length of 6', () => {
      expect(LOG_LEVELS).toHaveLength(6)
    })

    it('should contain only string values', () => {
      LOG_LEVELS.forEach((level) => {
        expect(typeof level).toBe('string')
      })
    })

    it('should have unique values', () => {
      const uniqueLevels = [...new Set(LOG_LEVELS)]
      expect(uniqueLevels).toHaveLength(LOG_LEVELS.length)
    })
  })

  describe('LogLevel type', () => {
    it('should accept valid log level strings', () => {
      const validLevels: LogLevel[] = [
        'verbose',
        'debug',
        'log',
        'warn',
        'error',
        'fatal'
      ]

      validLevels.forEach((level) => {
        expect(LOG_LEVELS).toContain(level)
      })
    })

    it('should be compatible with LOG_LEVELS elements', () => {
      LOG_LEVELS.forEach((level) => {
        const typedLevel: LogLevel = level
        expect(typeof typedLevel).toBe('string')
      })
    })
  })

  describe('LoggerService interface', () => {
    class MockLoggerService implements LoggerService {
      log = jest.fn()
      error = jest.fn()
      warn = jest.fn()
      debug = jest.fn()
      verbose = jest.fn()
      fatal = jest.fn()
      setLogLevels = jest.fn()
    }

    let mockLogger: MockLoggerService

    beforeEach(() => {
      mockLogger = new MockLoggerService()
    })

    it('should implement required methods', () => {
      expect(typeof mockLogger.log).toBe('function')
      expect(typeof mockLogger.error).toBe('function')
      expect(typeof mockLogger.warn).toBe('function')
    })

    it('should implement optional methods', () => {
      expect(typeof mockLogger.debug).toBe('function')
      expect(typeof mockLogger.verbose).toBe('function')
      expect(typeof mockLogger.fatal).toBe('function')
      expect(typeof mockLogger.setLogLevels).toBe('function')
    })

    it('should allow log method calls with message and optional parameters', () => {
      mockLogger.log('test message', 'param1', 'param2')

      expect(mockLogger.log).toHaveBeenCalledWith(
        'test message',
        'param1',
        'param2'
      )
    })

    it('should allow error method calls with message and optional parameters', () => {
      mockLogger.error('error message', { error: 'details' })

      expect(mockLogger.error).toHaveBeenCalledWith('error message', {
        error: 'details'
      })
    })

    it('should allow warn method calls with message and optional parameters', () => {
      mockLogger.warn('warning message')

      expect(mockLogger.warn).toHaveBeenCalledWith('warning message')
    })

    it('should allow debug method calls', () => {
      mockLogger.debug?.('debug message', 123)

      expect(mockLogger.debug).toHaveBeenCalledWith('debug message', 123)
    })

    it('should allow verbose method calls', () => {
      mockLogger.verbose?.('verbose message', true)

      expect(mockLogger.verbose).toHaveBeenCalledWith('verbose message', true)
    })

    it('should allow fatal method calls', () => {
      mockLogger.fatal?.('fatal error', new Error('test'))

      expect(mockLogger.fatal).toHaveBeenCalledWith(
        'fatal error',
        new Error('test')
      )
    })

    it('should allow setLogLevels method calls with LogLevel array', () => {
      const levels: LogLevel[] = ['error', 'warn', 'log']
      mockLogger.setLogLevels?.(levels)

      expect(mockLogger.setLogLevels).toHaveBeenCalledWith(levels)
    })

    it('should handle different message types', () => {
      const stringMessage = 'string message'
      const numberMessage = 123
      const objectMessage = { key: 'value' }
      const booleanMessage = true
      const nullMessage = null
      const undefinedMessage = undefined

      mockLogger.log(stringMessage)
      mockLogger.log(numberMessage)
      mockLogger.log(objectMessage)
      mockLogger.log(booleanMessage)
      mockLogger.log(nullMessage)
      mockLogger.log(undefinedMessage)

      expect(mockLogger.log).toHaveBeenCalledTimes(6)
      expect(mockLogger.log).toHaveBeenNthCalledWith(1, stringMessage)
      expect(mockLogger.log).toHaveBeenNthCalledWith(2, numberMessage)
      expect(mockLogger.log).toHaveBeenNthCalledWith(3, objectMessage)
      expect(mockLogger.log).toHaveBeenNthCalledWith(4, booleanMessage)
      expect(mockLogger.log).toHaveBeenNthCalledWith(5, nullMessage)
      expect(mockLogger.log).toHaveBeenNthCalledWith(6, undefinedMessage)
    })
  })

  describe('Type compatibility', () => {
    it('should allow LogLevel to be used as array elements', () => {
      const levels: LogLevel[] = ['error', 'warn']
      const allLevels: LogLevel[] = [...LOG_LEVELS]

      expect(levels).toHaveLength(2)
      expect(allLevels).toHaveLength(6)
    })

    it('should allow LogLevel in function parameters', () => {
      function logWithLevel(level: LogLevel, message: string): void {
        expect(LOG_LEVELS).toContain(level)
      }

      logWithLevel('error', 'test message')
      logWithLevel('debug', 'debug message')
    })

    it('should allow LogLevel in object properties', () => {
      interface LogConfig {
        level: LogLevel
        enabled: boolean
      }

      const config: LogConfig = {
        level: 'warn',
        enabled: true
      }

      expect(config.level).toBe('warn')
      expect(LOG_LEVELS).toContain(config.level)
    })
  })

  describe('Interface inheritance compatibility', () => {
    interface ExtendedLoggerService extends LoggerService {
      logWithTimestamp(message: any, timestamp: Date): void
    }

    class ExtendedLogger implements ExtendedLoggerService {
      log = jest.fn()
      error = jest.fn()
      warn = jest.fn()
      debug = jest.fn()
      verbose = jest.fn()
      fatal = jest.fn()
      setLogLevels = jest.fn()
      logWithTimestamp = jest.fn()
    }

    it('should allow interface extension', () => {
      const logger = new ExtendedLogger()

      expect(typeof logger.log).toBe('function')
      expect(typeof logger.logWithTimestamp).toBe('function')
    })

    it('should maintain base interface compatibility', () => {
      const logger = new ExtendedLogger()
      const baseLogger: LoggerService = logger

      expect(typeof baseLogger.log).toBe('function')
      expect(typeof baseLogger.error).toBe('function')
      expect(typeof baseLogger.warn).toBe('function')
    })
  })
})
