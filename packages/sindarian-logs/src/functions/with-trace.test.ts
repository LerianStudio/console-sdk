import { withTrace } from './with-trace'
import { LoggerAggregator } from '@/aggregator/logger-aggregator'

describe('withTrace', () => {
  let mockLogger: jest.Mocked<Pick<LoggerAggregator, 'runWithContext'>>

  beforeEach(() => {
    mockLogger = {
      runWithContext: jest.fn((_path, _method, _meta, fn) => fn())
    }
  })

  it('should delegate to logger.runWithContext with INTERNAL method', async () => {
    await withTrace(mockLogger as any, 'my-cron-job', async () => 'result')

    expect(mockLogger.runWithContext).toHaveBeenCalledWith(
      'my-cron-job',
      'INTERNAL',
      { handler: 'my-cron-job' },
      expect.any(Function)
    )
  })

  it('should return the callback result', async () => {
    mockLogger.runWithContext.mockImplementation(async (_p, _m, _meta, fn) =>
      fn()
    )

    const result = await withTrace(mockLogger as any, 'task', async () => 42)
    expect(result).toBe(42)
  })

  it('should propagate errors from the callback', async () => {
    mockLogger.runWithContext.mockImplementation(async (_p, _m, _meta, fn) =>
      fn()
    )

    await expect(
      withTrace(mockLogger as any, 'task', async () => {
        throw new Error('task failed')
      })
    ).rejects.toThrow('task failed')
  })
})
