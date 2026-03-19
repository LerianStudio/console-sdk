import { AggregatedLog } from '@/types/log-event'

const mockInfo = jest.fn()
const mockError = jest.fn()
const mockWarn = jest.fn()
const mockDebug = jest.fn()
const mockPino = jest.fn(() => ({
  info: mockInfo,
  error: mockError,
  warn: mockWarn,
  debug: mockDebug
}))
;(mockPino as any).stdTimeFunctions = { isoTime: jest.fn() }

jest.mock('pino', () => ({
  __esModule: true,
  default: mockPino
}))

import { PinoLoggerRepository } from './pino-logger-repository'

describe('PinoLoggerRepository', () => {
  const originalEnv = process.env.NODE_ENV

  const sampleLog: AggregatedLog = {
    level: 'info',
    method: 'GET',
    path: '/api/test',
    duration: 0.5,
    events: [
      {
        timestamp: '2024-01-01T00:00:00.000Z',
        message: 'test event'
      }
    ]
  }

  afterEach(() => {
    jest.clearAllMocks()
    process.env.NODE_ENV = originalEnv
  })

  describe('constructor', () => {
    it('should initialize pino with info level by default', () => {
      new PinoLoggerRepository()

      expect(mockPino).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'info' })
      )
    })

    it('should initialize pino with debug level when debug option is true', () => {
      new PinoLoggerRepository({ debug: true })

      expect(mockPino).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'debug' })
      )
    })

    it('should pass formatters.level that uppercases the label', () => {
      new PinoLoggerRepository()

      const options = mockPino.mock.calls[0][0] as any
      expect(options.formatters.level('info')).toEqual({ level: 'INFO' })
      expect(options.formatters.level('error')).toEqual({ level: 'ERROR' })
    })

    it('should set base.env to NODE_ENV or production', () => {
      process.env.NODE_ENV = 'staging'
      new PinoLoggerRepository()

      const options = mockPino.mock.calls[0][0] as any
      expect(options.base.env).toBe('staging')
    })

    it('should default base.env to production when NODE_ENV is unset', () => {
      delete process.env.NODE_ENV
      new PinoLoggerRepository()

      const options = mockPino.mock.calls[0][0] as any
      expect(options.base.env).toBe('production')
    })
  })

  describe('development mode with pino-pretty', () => {
    it('should try to load pino-pretty in development', () => {
      process.env.NODE_ENV = 'development'

      // pino-pretty won't be available in test env, so it falls through
      // to MODULE_NOT_FOUND catch, then creates pino without pretty
      new PinoLoggerRepository()

      // pino should still be called (falls through to default)
      expect(mockPino).toHaveBeenCalled()
    })
  })

  describe('info', () => {
    it('should call pino.info with JSON-stringified log', () => {
      const repo = new PinoLoggerRepository()
      repo.info(sampleLog)
      expect(mockInfo).toHaveBeenCalledWith(JSON.stringify(sampleLog))
    })
  })

  describe('error', () => {
    it('should call pino.error with JSON-stringified log', () => {
      const repo = new PinoLoggerRepository()
      repo.error(sampleLog)
      expect(mockError).toHaveBeenCalledWith(JSON.stringify(sampleLog))
    })
  })

  describe('warn', () => {
    it('should call pino.warn with JSON-stringified log', () => {
      const repo = new PinoLoggerRepository()
      repo.warn(sampleLog)
      expect(mockWarn).toHaveBeenCalledWith(JSON.stringify(sampleLog))
    })
  })

  describe('debug', () => {
    it('should call pino.debug with JSON-stringified log', () => {
      const repo = new PinoLoggerRepository()
      repo.debug(sampleLog)
      expect(mockDebug).toHaveBeenCalledWith(JSON.stringify(sampleLog))
    })
  })

  describe('audit', () => {
    it('should route to pino.info (no audit level in pino)', () => {
      const repo = new PinoLoggerRepository()
      repo.audit(sampleLog)
      expect(mockInfo).toHaveBeenCalledWith(JSON.stringify(sampleLog))
    })
  })
})
