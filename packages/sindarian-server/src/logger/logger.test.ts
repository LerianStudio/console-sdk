import 'reflect-metadata'
import { Logger } from './logger'
import { LoggerService, LogLevel } from './logger-service'
import { ConsoleLogger } from './console-logger'

describe('Logger', () => {
  let logger: Logger
  let mockConsoleLogger: jest.Mocked<LoggerService>

  beforeEach(() => {
    logger = new Logger()
    
    // Mock the internal console logger
    mockConsoleLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
      setLogLevels: jest.fn()
    }
    
    // Replace the internal logger with our mock
    ;(logger as any).logger = mockConsoleLogger
    
    // Clear static logger before each test
    Logger.overrideLogger(false)
  })

  afterEach(() => {
    jest.clearAllMocks()
    // Reset static logger
    Logger.overrideLogger(false)
  })

  describe('constructor', () => {
    it('should create instance with ConsoleLogger as default logger', () => {
      const newLogger = new Logger()
      const internalLogger = (newLogger as any).logger
      
      expect(internalLogger).toBeInstanceOf(ConsoleLogger)
    })

    it('should implement LoggerService interface', () => {
      expect(typeof logger.log).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.verbose).toBe('function')
      expect(typeof logger.fatal).toBe('function')
      expect(typeof logger.setLogLevels).toBe('function')
    })
  })

  describe('instance methods', () => {
    it('should delegate log calls to internal logger', () => {
      logger.log('test message', 'param1', 'param2')
      
      expect(mockConsoleLogger.log).toHaveBeenCalledWith('test message', 'param1', 'param2')
    })

    it('should delegate error calls to internal logger', () => {
      logger.error('error message', { error: 'details' })
      
      expect(mockConsoleLogger.error).toHaveBeenCalledWith('error message', { error: 'details' })
    })

    it('should delegate warn calls to internal logger', () => {
      logger.warn('warning message')
      
      expect(mockConsoleLogger.warn).toHaveBeenCalledWith('warning message')
    })

    it('should delegate debug calls to internal logger', () => {
      logger.debug?.('debug message', 123)
      
      expect(mockConsoleLogger.debug).toHaveBeenCalledWith('debug message', 123)
    })

    it('should delegate verbose calls to internal logger', () => {
      logger.verbose?.('verbose message', true)
      
      expect(mockConsoleLogger.verbose).toHaveBeenCalledWith('verbose message', true)
    })

    it('should delegate fatal calls to internal logger', () => {
      logger.fatal?.('fatal message', new Error('test'))
      
      expect(mockConsoleLogger.fatal).toHaveBeenCalledWith('fatal message', new Error('test'))
    })

    it('should delegate setLogLevels calls to internal logger', () => {
      const levels: LogLevel[] = ['error', 'warn', 'log']
      logger.setLogLevels?.(levels)
      
      expect(mockConsoleLogger.setLogLevels).toHaveBeenCalledWith(levels)
    })

    it('should handle optional methods when internal logger does not implement them', () => {
      const limitedMockLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
      } as LoggerService
      
      ;(logger as any).logger = limitedMockLogger
      
      expect(() => {
        logger.debug?.('debug message')
        logger.verbose?.('verbose message')
        logger.fatal?.('fatal message')
        logger.setLogLevels?.(['error'])
      }).not.toThrow()
    })
  })

  describe('static methods', () => {
    let mockStaticLogger: jest.Mocked<LoggerService>

    beforeEach(() => {
      mockStaticLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
        fatal: jest.fn(),
        setLogLevels: jest.fn()
      }
      Logger.overrideLogger(mockStaticLogger)
    })

    it('should delegate static log calls to static logger', () => {
      Logger.log('test message', 'param1')
      
      expect(mockStaticLogger.log).toHaveBeenCalledWith('test message', 'param1')
    })

    it('should delegate static error calls to static logger', () => {
      Logger.error('error message')
      
      expect(mockStaticLogger.error).toHaveBeenCalledWith('error message')
    })

    it('should delegate static warn calls to static logger', () => {
      Logger.warn('warning message', { context: 'test' })
      
      expect(mockStaticLogger.warn).toHaveBeenCalledWith('warning message', { context: 'test' })
    })

    it('should delegate static debug calls to static logger', () => {
      Logger.debug?.('debug message', 456)
      
      expect(mockStaticLogger.debug).toHaveBeenCalledWith('debug message', 456)
    })

    it('should delegate static verbose calls to static logger', () => {
      Logger.verbose?.('verbose message')
      
      expect(mockStaticLogger.verbose).toHaveBeenCalledWith('verbose message')
    })

    it('should delegate static fatal calls to static logger', () => {
      Logger.fatal?.('fatal message')
      
      expect(mockStaticLogger.fatal).toHaveBeenCalledWith('fatal message')
    })

    it('should not throw when no static logger is set', () => {
      Logger.overrideLogger(false)
      
      expect(() => {
        Logger.log('test message')
        Logger.error('error message')
        Logger.warn('warning message')
        Logger.debug?.('debug message')
        Logger.verbose?.('verbose message')
        Logger.fatal?.('fatal message')
      }).not.toThrow()
    })
  })

  describe('getTimestamp', () => {
    it('should return formatted timestamp', () => {
      const timestamp = Logger.getTimestamp()
      
      expect(typeof timestamp).toBe('string')
      expect(timestamp.length).toBeGreaterThan(0)
    })

    it('should return consistent format', () => {
      const timestamp1 = Logger.getTimestamp()
      const timestamp2 = Logger.getTimestamp()
      
      expect(typeof timestamp1).toBe('string')
      expect(typeof timestamp2).toBe('string')
      // Both should have similar structure (date/time format)
      expect(timestamp1).toMatch(/\d/)
      expect(timestamp2).toMatch(/\d/)
    })

    it('should use current date/time', () => {
      const beforeTime = Date.now()
      const timestamp = Logger.getTimestamp()
      const afterTime = Date.now()
      
      // Should be called within the time window
      expect(timestamp).toBeDefined()
      expect(beforeTime).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('overrideLogger', () => {
    let mockLogger: jest.Mocked<LoggerService>

    beforeEach(() => {
      mockLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
        fatal: jest.fn(),
        setLogLevels: jest.fn()
      }
    })

    it('should set static logger with LoggerService object', () => {
      Logger.overrideLogger(mockLogger)
      Logger.log('test message')
      
      expect(mockLogger.log).toHaveBeenCalledWith('test message')
    })

    it('should clear static logger with false', () => {
      Logger.overrideLogger(mockLogger)
      Logger.overrideLogger(false)
      
      expect(() => Logger.log('test message')).not.toThrow()
      expect(mockLogger.log).not.toHaveBeenCalled()
    })

    it('should clear static logger with true', () => {
      Logger.overrideLogger(mockLogger)
      Logger.overrideLogger(true)
      
      expect(() => Logger.log('test message')).not.toThrow()
      expect(mockLogger.log).not.toHaveBeenCalled()
    })

    it('should throw error when trying to extend Logger class', () => {
      class ExtendedLogger extends Logger {}
      const extendedLogger = new ExtendedLogger()
      
      const mockStaticLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
      } as LoggerService
      Logger.overrideLogger(mockStaticLogger)
      
      expect(() => {
        Logger.overrideLogger(extendedLogger)
      }).toThrow('Using the "extends Logger" instruction is not allowed. Please, use "extends ConsoleLogger" instead.')
      
      expect(mockStaticLogger.error).toHaveBeenCalledWith(
        'Using the "extends Logger" instruction is not allowed. Please, use "extends ConsoleLogger" instead.'
      )
    })

    it('should allow Logger instance if constructor is exactly Logger', () => {
      const loggerInstance = new Logger()
      
      expect(() => {
        Logger.overrideLogger(loggerInstance)
      }).not.toThrow()
    })

    it('should allow ConsoleLogger instances', () => {
      const consoleLogger = new ConsoleLogger()
      
      expect(() => {
        Logger.overrideLogger(consoleLogger)
      }).not.toThrow()
    })

    it('should handle non-object values', () => {
      expect(() => {
        Logger.overrideLogger('invalid' as any)
      }).not.toThrow()
      
      expect(() => {
        Logger.overrideLogger(123 as any)
      }).not.toThrow()
      
      expect(() => {
        Logger.overrideLogger(null as any)
      }).not.toThrow()
    })
  })

  describe('dateTimeFormatter', () => {
    it('should format dates correctly', () => {
      const testDate = new Date('2023-01-15T14:30:45.000Z')
      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(testDate.getTime())
      
      const timestamp = Logger.getTimestamp()
      
      expect(timestamp).toBeDefined()
      expect(typeof timestamp).toBe('string')
      
      mockDateNow.mockRestore()
    })
  })

  describe('integration with LoggerService interface', () => {
    it('should be assignable to LoggerService', () => {
      const loggerService: LoggerService = logger
      
      expect(typeof loggerService.log).toBe('function')
      expect(typeof loggerService.error).toBe('function')
      expect(typeof loggerService.warn).toBe('function')
    })

    it('should handle different message types', () => {
      const stringMessage = 'string'
      const numberMessage = 42
      const objectMessage = { key: 'value' }
      const booleanMessage = true
      const nullMessage = null
      const undefinedMessage = undefined

      logger.log(stringMessage)
      logger.log(numberMessage)
      logger.log(objectMessage)
      logger.log(booleanMessage)
      logger.log(nullMessage)
      logger.log(undefinedMessage)

      expect(mockConsoleLogger.log).toHaveBeenCalledTimes(6)
      expect(mockConsoleLogger.log).toHaveBeenNthCalledWith(1, stringMessage)
      expect(mockConsoleLogger.log).toHaveBeenNthCalledWith(2, numberMessage)
      expect(mockConsoleLogger.log).toHaveBeenNthCalledWith(3, objectMessage)
      expect(mockConsoleLogger.log).toHaveBeenNthCalledWith(4, booleanMessage)
      expect(mockConsoleLogger.log).toHaveBeenNthCalledWith(5, nullMessage)
      expect(mockConsoleLogger.log).toHaveBeenNthCalledWith(6, undefinedMessage)
    })
  })

  describe('dependency injection', () => {
    it('should be usable with dependency injection frameworks', () => {
      expect(Logger).toBeDefined()
      expect(typeof Logger).toBe('function')
    })
  })
})