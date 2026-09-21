import { Module } from '@lerianstudio/sindarian-server'
import { AdminGuard, GuardedController, ReadGuard } from './guarded-controller'
import { LedgerController } from './ledger-controller'
import { TestController } from './test-controller'
import { TestService } from './test-service'
import { ThrowingController } from './throwing-controller'

@Module({
  // The framework never calls `GuardHandler.register`, so a guard resolved
  // from the container is one the module bound itself.
  providers: [TestService, ReadGuard, AdminGuard],
  controllers: [
    TestController,
    ThrowingController,
    LedgerController,
    GuardedController
  ]
})
export class TestModule {}
