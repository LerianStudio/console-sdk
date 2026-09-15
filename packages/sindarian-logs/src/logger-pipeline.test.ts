import 'reflect-metadata'
import {
  Controller,
  Get,
  Inject,
  Module,
  ServerFactory
} from '@lerianstudio/sindarian-server'
import { NextRequest, NextResponse } from 'next/server'
import { LoggerAggregator } from '@/aggregator/logger-aggregator'
import { LoggerModule } from '@/logger-module'
import { LoggerRepository } from '@/repositories/logger-repository'
import { AggregatedLog } from '@/types/log-event'

// Every entry the aggregator writes, whatever its level, in order.
class RecordingLoggerRepository extends LoggerRepository {
  entries: AggregatedLog[] = []

  info(log: AggregatedLog): void {
    this.entries.push(log)
  }
  error(log: AggregatedLog): void {
    this.entries.push(log)
  }
  warn(log: AggregatedLog): void {
    this.entries.push(log)
  }
  debug(log: AggregatedLog): void {
    this.entries.push(log)
  }
  audit(log: AggregatedLog): void {
    this.entries.push(log)
  }
}

const repository = new RecordingLoggerRepository()

@Controller('/admin/health')
class HealthController {
  constructor(
    @Inject(LoggerAggregator) private readonly logger: LoggerAggregator
  ) {}

  @Get('alive')
  public alive() {
    return { status: 'ok' }
  }

  // The shape Product Console's readyz has: record the reason, answer 503.
  // Nothing throws, so the only signal is the warn event and the status.
  @Get('readyz')
  public readyz() {
    this.logger.warn('HealthController', 'MongoDB is disconnected')
    return NextResponse.json({ status: 'unhealthy' }, { status: 503 })
  }

  @Get('boom')
  public boom() {
    throw new Error('mongo connection pool exhausted')
  }

  @Get('rejected')
  public rejected() {
    return NextResponse.json({ message: 'bad probe token' }, { status: 401 })
  }
}

@Module({
  imports: [LoggerModule],
  controllers: [HealthController],
  // Last provider wins, so this replaces LoggerModule's pino repository and
  // leaves its aggregator factory, the one place LOG_IGNORE_PATHS is read,
  // exactly as a consumer gets it.
  providers: [{ provide: LoggerRepository, useValue: repository }]
})
class AppModule {}

/**
 * The only route a request takes in production: ServerFactory.handler ->
 * MiddlewareHandler -> TraceMiddleware -> _handleRequest. Driving the
 * aggregator directly skips the framework's catch-all, which turns every
 * controller throw into a Response before the aggregator can see it.
 */
describe('a silenced route over the real server pipeline', () => {
  const previous = process.env.LOG_IGNORE_PATHS
  let app: ReturnType<typeof ServerFactory.create>

  const get = (path: string) =>
    app.handler(
      new NextRequest(`http://localhost:3000${path}`, { method: 'GET' }),
      { params: Promise.resolve({}) }
    )

  beforeAll(() => {
    process.env.LOG_IGNORE_PATHS = '/api/admin/health/*'
    app = ServerFactory.create(AppModule)
    app.setGlobalPrefix('/api')
  })

  afterAll(() => {
    if (previous === undefined) {
      delete process.env.LOG_IGNORE_PATHS
    } else {
      process.env.LOG_IGNORE_PATHS = previous
    }
  })

  beforeEach(() => {
    repository.entries = []
  })

  it('should write no entry when a silenced route answers 200', async () => {
    const response = await get('/api/admin/health/alive')

    expect(response.status).toBe(200)
    expect(repository.entries).toHaveLength(0)
  })

  it('should write no entry when a silenced route answers 4xx', async () => {
    const response = await get('/api/admin/health/rejected')

    // The caller sent something wrong; the route did its job. Silence here is
    // the whole point, and it is what keeps the bound worth setting on a sink
    // that rejects malformed payloads all day.
    expect(response.status).toBe(401)
    expect(repository.entries).toHaveLength(0)
  })

  it('should write the entry when a silenced route answers 503', async () => {
    const response = await get('/api/admin/health/readyz')

    expect(response.status).toBe(503)
    expect(repository.entries).toHaveLength(1)

    const entry = repository.entries[0]
    expect(entry.path).toBe('/api/admin/health/readyz')
    expect(entry.statusCode).toBe(503)
    expect(entry.events.map((event) => event.message)).toEqual([
      'MongoDB is disconnected'
    ])
  })

  it('should write the entry when a controller on a silenced route throws', async () => {
    const response = await get('/api/admin/health/boom')

    expect(response.status).toBe(500)
    expect(repository.entries).toHaveLength(1)

    const entry = repository.entries[0]
    expect(entry.path).toBe('/api/admin/health/boom')
    expect(entry.statusCode).toBe(500)
    // Pinned, not incidental: the framework converts the throw to a Response
    // before the aggregator sees it, so no error event is ever recorded and
    // the entry stays at `info`. The 500 is the whole signal, which is why the
    // guard has to read the status and not only the escalated level.
    expect(entry.level).toBe('info')
    expect(entry.events).toHaveLength(0)
  })
})
