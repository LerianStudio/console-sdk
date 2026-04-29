import { APP_INTERCEPTOR, Module } from '@lerianstudio/sindarian-server'
import { LoggerInterceptor } from './logger-interceptor'

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor
    }
  ]
})
export class LoggerModule {}
