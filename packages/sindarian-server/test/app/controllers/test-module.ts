import { Module } from '@lerianstudio/sindarian-server'
import { TestController } from './test-controller'
import { TestService } from './test-service'

@Module({
  providers: [TestService],
  controllers: [TestController]
})
export class TestModule {}
