import { Module } from '@lerianstudio/sindarian-server'
import { TestModule } from './controllers/test-module'
import { LoggerModule } from './logger/logger-module'

@Module({
  imports: [LoggerModule, TestModule]
})
export class AppModule {}
