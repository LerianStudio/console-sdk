import { Module } from '@lerianstudio/sindarian-server'
import { ResolutionContext } from 'inversify'
import {
  LoggerAggregator,
  LoggerRepository,
  PinoLoggerRepository
} from '@lerianstudio/lib-logs'

@Module({
  providers: [
    {
      provide: LoggerRepository,
      useValue: new PinoLoggerRepository({
        debug: Boolean(process.env.ENABLE_DEBUG)
      })
    },
    {
      provide: LoggerAggregator,
      useFactory: (context: ResolutionContext) => {
        const loggerRepository = context.get<LoggerRepository>(LoggerRepository)
        return new LoggerAggregator(loggerRepository, {
          debug: Boolean(process.env.ENABLE_DEBUG)
        })
      }
    }
  ]
})
export class LoggerModule {}
