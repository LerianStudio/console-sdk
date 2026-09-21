import { Module } from '@lerianstudio/sindarian-server'
import { LedgerController } from './ledger-controller'
import { TestController } from './test-controller'
import { TestService } from './test-service'
import { ThrowingController } from './throwing-controller'

@Module({
  providers: [TestService],
  controllers: [TestController, ThrowingController, LedgerController]
})
export class TestModule {}
