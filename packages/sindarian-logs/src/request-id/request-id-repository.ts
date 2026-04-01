import { Injectable } from '@lerianstudio/sindarian-server'
import { AsyncLocalStorage } from 'async_hooks'
import { randomUUID } from 'crypto'

@Injectable()
export class RequestIdRepository {
  private storage = new AsyncLocalStorage<string>()

  generate(): string {
    return randomUUID()
  }

  get(): string | undefined {
    return this.storage.getStore()
  }

  /**
   * Runs a function within a trace ID context.
   * The trace ID is isolated per async context — safe under concurrent requests.
   */
  runWith<T>(id: string, fn: () => T): T {
    return this.storage.run(id, fn)
  }
}
