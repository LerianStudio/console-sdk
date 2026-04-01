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
          debug: process.env.ENABLE_DEBUG === 'true'
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
