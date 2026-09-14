import { LoggerModule } from './logger-module'
import { LoggerAggregator } from '@/aggregator/logger-aggregator'
import { LoggerRepository } from '@/repositories/logger-repository'
import { AggregatedLog } from '@/types/log-event'

// The @Module decorator parks the provider list on the class prototype under
// this key. Going through it runs the real factory, which is the only place
// the environment is turned into aggregator options.
const PROVIDERS_PROPERTY = '__providers__'

type ProviderEntry = {
  provide: unknown
  useFactory?: (context: { get: (token: unknown) => unknown }) => unknown
}

class MockLoggerRepository extends LoggerRepository {
  calls: AggregatedLog[] = []

  info(log: AggregatedLog): void {
    this.calls.push(log)
  }
  error(log: AggregatedLog): void {
    this.calls.push(log)
  }
  warn(log: AggregatedLog): void {
    this.calls.push(log)
  }
  debug(log: AggregatedLog): void {
    this.calls.push(log)
  }
  audit(log: AggregatedLog): void {
    this.calls.push(log)
  }
}

const buildAggregator = (repository: LoggerRepository): LoggerAggregator => {
  const providers = (LoggerModule.prototype as Record<string, unknown>)[
    PROVIDERS_PROPERTY
  ] as ProviderEntry[] | undefined

  if (!providers) {
    throw new Error(
      `LoggerModule exposes no providers under ${PROVIDERS_PROPERTY}`
    )
  }

  const provider = providers.find((entry) => entry.provide === LoggerAggregator)

  if (!provider?.useFactory) {
    throw new Error('LoggerModule provides no LoggerAggregator factory')
  }

  return provider.useFactory({ get: () => repository }) as LoggerAggregator
}

describe('LoggerModule', () => {
  const previous = process.env.LOG_IGNORE_PATHS
  let repository: MockLoggerRepository

  beforeEach(() => {
    repository = new MockLoggerRepository()
    delete process.env.LOG_IGNORE_PATHS
  })

  afterAll(() => {
    if (previous === undefined) {
      delete process.env.LOG_IGNORE_PATHS
    } else {
      process.env.LOG_IGNORE_PATHS = previous
    }
  })

  it('should log every path when LOG_IGNORE_PATHS is unset', async () => {
    const aggregator = buildAggregator(repository)

    await aggregator.runWithContext('/api/csp-report', 'POST', {}, async () => {
      aggregator.info('csp', 'violation received')
    })

    expect(repository.calls).toHaveLength(1)
  })

  it('should silence the paths named in LOG_IGNORE_PATHS', async () => {
    process.env.LOG_IGNORE_PATHS = '/api/csp-report,/api/admin/health/*'
    const aggregator = buildAggregator(repository)

    await aggregator.runWithContext(
      '/api/csp-report',
      'POST',
      {},
      async () => {}
    )
    await aggregator.runWithContext(
      '/api/admin/health/alive',
      'GET',
      {},
      async () => {}
    )
    await aggregator.runWithContext('/api/ledgers', 'GET', {}, async () => {})

    expect(repository.calls.map((log) => log.path)).toEqual(['/api/ledgers'])
  })

  it('should trim entries and drop the blanks', async () => {
    process.env.LOG_IGNORE_PATHS = ' /api/csp-report ,, /api/admin/health/* ,'
    const aggregator = buildAggregator(repository)

    await aggregator.runWithContext(
      '/api/csp-report',
      'POST',
      {},
      async () => {}
    )
    await aggregator.runWithContext(
      '/api/admin/health/readyz',
      'GET',
      {},
      async () => {}
    )

    expect(repository.calls).toHaveLength(0)
  })

  it('should silence nothing when LOG_IGNORE_PATHS is empty', async () => {
    process.env.LOG_IGNORE_PATHS = '   '
    const aggregator = buildAggregator(repository)

    await aggregator.runWithContext(
      '/api/csp-report',
      'POST',
      {},
      async () => {}
    )

    expect(repository.calls).toHaveLength(1)
  })

  it('should still write an error raised under an ignored path', async () => {
    process.env.LOG_IGNORE_PATHS = '/api/csp-report'
    const aggregator = buildAggregator(repository)

    await expect(
      aggregator.runWithContext('/api/csp-report', 'POST', {}, async () => {
        throw new Error('sink is down')
      })
    ).rejects.toThrow('sink is down')

    expect(repository.calls).toHaveLength(1)
    expect(repository.calls[0].level).toBe('error')
  })
})
