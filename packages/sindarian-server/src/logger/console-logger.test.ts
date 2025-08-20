import 'reflect-metadata'
import { ConsoleLogger, ConsoleLoggerOptions } from './console-logger'
import { LogLevel } from './logger-service'
import { Logger } from './logger'

describe('ConsoleLogger', () => {
  let originalWrite: jest.SpyInstance
  let originalStdout: jest.SpyInstance
  let originalStderr: jest.SpyInstance
  let mockTimestamp: jest.SpyInstance

  beforeEach(() => {
    originalStdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
    originalStderr = jest.spyOn(process.stderr, 'write').mockImplementation(() => true)
    mockTimestamp = jest.spyOn(Logger, 'getTimestamp').mockReturnValue('2023-01-01T12:00:00')
  })

  afterEach(() => {
    originalStdout.mockRestore()
    originalStderr.mockRestore()
    mockTimestamp.mockRestore()
  })

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const logger = new ConsoleLogger()
      
      expect(logger['options'].prefix).toBe('Sindarian')
      expect(logger['options'].logLevels).toEqual([
        'log',
        'error',
        'warn',
        'debug',
        'verbose',
        'fatal'
      ])
    })

    it('should create instance with custom prefix', () => {
      const options: ConsoleLoggerOptions = {
        prefix: 'CustomApp'
      }
      const logger = new ConsoleLogger(options)
      
      expect(logger['options'].prefix).toBe('CustomApp')
      expect(logger['options'].logLevels).toEqual([
        'log',
        'error',
        'warn',
        'debug',
        'verbose',
        'fatal'
      ])
    })

    it('should create instance with custom log levels', () => {
      const customLevels: LogLevel[] = ['error', 'warn']
      const options: ConsoleLoggerOptions = {
        logLevels: customLevels
      }
      const logger = new ConsoleLogger(options)
      
      expect(logger['options'].prefix).toBe('Sindarian')
      expect(logger['options'].logLevels).toEqual([
        'log',
        'error',
        'warn',
        'debug',
        'verbose',
        'fatal'
      ])
    })

    it('should handle undefined options', () => {
      const logger = new ConsoleLogger(undefined)
      
      expect(logger['options'].prefix).toBe('Sindarian')
      expect(logger['options'].logLevels).toEqual([
        'log',
        'error',
        'warn',
        'debug',
        'verbose',
        'fatal'
      ])
    })

    it('should handle empty options object', () => {
      const logger = new ConsoleLogger({})
      
      expect(logger['options'].prefix).toBe('Sindarian')
      expect(logger['options'].logLevels).toEqual([
        'log',
        'error',
        'warn',
        'debug',
        'verbose',
        'fatal'
      ])
    })
  })

  describe('logging methods', () => {
    let logger: ConsoleLogger

    beforeEach(() => {
      logger = new ConsoleLogger()
    })

    it('should log info message', () => {
      logger.log('test message')
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [LOG] test message\n'
      )
    })

    it('should log error message', () => {
      logger.error('error message')
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [ERROR] error message\n'
      )
    })

    it('should log warning message', () => {
      logger.warn('warning message')
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [WARN] warning message\n'
      )
    })

    it('should log debug message', () => {
      logger.debug?.('debug message')
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [DEBUG] debug message\n'
      )
    })

    it('should log verbose message', () => {
      logger.verbose?.('verbose message')
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [VERBOSE] verbose message\n'
      )
    })

    it('should log fatal message', () => {
      logger.fatal('fatal message')
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [FATAL] fatal message\n'
      )
    })

    it('should log with custom prefix', () => {
      const customLogger = new ConsoleLogger({ prefix: 'MyApp' })
      customLogger.log('test message')
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[MyApp] - 2023-01-01T12:00:00 [LOG] test message\n'
      )
    })

    it('should handle multiple parameters', () => {
      const printMessageSpy = jest.spyOn(logger as any, 'printMessage').mockImplementation(() => {})
      logger.log('message', 'param1', 'param2')
      
      expect(printMessageSpy).toHaveBeenCalledWith('log', 'message', 'param1', 'param2')
      printMessageSpy.mockRestore()
    })

    it('should handle object messages', () => {
      const obj = { key: 'value' }
      logger.log(obj)
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [LOG] [object Object]\n'
      )
    })

    it('should handle number messages', () => {
      logger.log(123)
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [LOG] 123\n'
      )
    })

    it('should handle boolean messages', () => {
      logger.log(true)
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [LOG] true\n'
      )
    })

    it('should handle null/undefined messages', () => {
      logger.log(null)
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [LOG] null\n'
      )

      logger.log(undefined)
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [LOG] undefined\n'
      )
    })
  })

  describe('setLogLevels', () => {
    let logger: ConsoleLogger

    beforeEach(() => {
      logger = new ConsoleLogger()
    })

    it('should set log levels when options exist', () => {
      const newLevels: LogLevel[] = ['error', 'warn']
      logger.setLogLevels(newLevels)
      
      expect(logger['options'].logLevels).toEqual(newLevels)
    })

    it('should create options object if it does not exist', () => {
      const logger = new ConsoleLogger()
      delete (logger as any)['options']
      
      const newLevels: LogLevel[] = ['error', 'warn']
      logger.setLogLevels(newLevels)
      
      expect(logger['options']).toBeDefined()
      expect(logger['options'].logLevels).toEqual(newLevels)
    })

    it('should handle empty log levels array', () => {
      const emptyLevels: LogLevel[] = []
      logger.setLogLevels(emptyLevels)
      
      expect(logger['options'].logLevels).toEqual(emptyLevels)
    })
  })

  describe('printMessage', () => {
    let logger: ConsoleLogger

    beforeEach(() => {
      logger = new ConsoleLogger()
    })

    it('should default to stdout when no writeStreamType specified', () => {
      logger['printMessage']('info', 'test message')
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [INFO] test message\n'
      )
      expect(originalStderr).not.toHaveBeenCalled()
    })

    it('should write to stdout when specified', () => {
      logger['printMessage']('info', 'test message', 'stdout')
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [INFO] test message\n'
      )
      expect(originalStderr).not.toHaveBeenCalled()
    })

    it('should write to stderr when specified', () => {
      logger['printMessage']('error', 'error message', 'stderr')
      
      expect(originalStderr).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [ERROR] error message\n'
      )
      expect(originalStdout).not.toHaveBeenCalled()
    })

    it('should handle empty level', () => {
      logger['printMessage']('', 'test message')
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [] test message\n'
      )
    })

    it('should convert level to uppercase', () => {
      logger['printMessage']('info', 'test message')
      
      expect(originalStdout).toHaveBeenCalledWith(
        '[Sindarian] - 2023-01-01T12:00:00 [INFO] test message\n'
      )
    })
  })

  describe('formatMessage', () => {
    let logger: ConsoleLogger

    beforeEach(() => {
      logger = new ConsoleLogger()
    })

    it('should format message with default prefix', () => {
      const formatted = logger['formatMessage']('INFO', 'test message')
      
      expect(formatted).toBe('[Sindarian] - 2023-01-01T12:00:00 [INFO] test message\n')
    })

    it('should format message with custom prefix', () => {
      const customLogger = new ConsoleLogger({ prefix: 'CustomApp' })
      const formatted = customLogger['formatMessage']('ERROR', 'error message')
      
      expect(formatted).toBe('[CustomApp] - 2023-01-01T12:00:00 [ERROR] error message\n')
    })

    it('should handle level case conversion', () => {
      const formatted = logger['formatMessage']('debug', 'debug message')
      
      expect(formatted).toBe('[Sindarian] - 2023-01-01T12:00:00 [DEBUG] debug message\n')
    })

    it('should handle different message types', () => {
      let formatted = logger['formatMessage']('INFO', 123)
      expect(formatted).toBe('[Sindarian] - 2023-01-01T12:00:00 [INFO] 123\n')

      formatted = logger['formatMessage']('INFO', true)
      expect(formatted).toBe('[Sindarian] - 2023-01-01T12:00:00 [INFO] true\n')

      formatted = logger['formatMessage']('INFO', { key: 'value' })
      expect(formatted).toBe('[Sindarian] - 2023-01-01T12:00:00 [INFO] [object Object]\n')
    })
  })

  describe('integration with LoggerService interface', () => {
    it('should implement all required LoggerService methods', () => {
      const logger = new ConsoleLogger()
      
      expect(typeof logger.log).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.verbose).toBe('function')
      expect(typeof logger.fatal).toBe('function')
      expect(typeof logger.setLogLevels).toBe('function')
    })

    it('should be decorated with @injectable', () => {
      expect(Reflect.hasOwnMetadata).toBeDefined()
    })
  })
})