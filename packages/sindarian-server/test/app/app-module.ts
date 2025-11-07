import {
  APP_PIPE,
  Module,
  ZodValidationPipe
} from '@lerianstudio/sindarian-server'
import { TestModule } from './controllers/test-module'
import { LoggerModule } from './logger/logger-module'

@Module({
  imports: [LoggerModule, TestModule],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe
    }
  ]
})
export class AppModule {}
