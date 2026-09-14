import { Module, APP_MIDDLEWARE } from '@lerianstudio/sindarian-server'
import { ResolutionContext } from 'inversify'
import { LoggerAggregator } from '@/aggregator/logger-aggregator'
import { TraceMiddleware } from '@/middleware/trace-middleware'
import { LoggerRepository } from '@/repositories/logger-repository'
import { PinoLoggerRepository } from '@/repositories/pino-logger-repository'
import { RequestIdRepository } from '@/request-id/request-id-repository'

@Module({
  providers: [
    RequestIdRepository,
    {
      provide: LoggerRepository,
      useValue: new PinoLoggerRepository({
        debug: process.env.ENABLE_DEBUG === 'true'
      })
    },
    {
      provide: LoggerAggregator,
      useFactory: (context: ResolutionContext) => {
        const loggerRepository = context.get<LoggerRepository>(LoggerRepository)
        return new LoggerAggregator(loggerRepository, {
          debug: process.env.ENABLE_DEBUG === 'true',
          // Which routes are noise is an operational property, not a code one:
          // it changes with traffic, not with a release. Comma-separated, so
          // LOG_IGNORE_PATHS=/api/csp-report,/api/admin/health/*
          ignorePaths: (process.env.LOG_IGNORE_PATHS ?? '')
            .split(',')
            .map((path) => path.trim())
            .filter(Boolean)
        })
      }
    },
    {
      provide: APP_MIDDLEWARE,
      useClass: TraceMiddleware
    }
  ]
})
export class LoggerModule {}
