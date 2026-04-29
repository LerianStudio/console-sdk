import {
  Middleware,
  MiddlewareNext,
  Injectable,
  Inject
} from '@lerianstudio/sindarian-server'
import { NextRequest } from 'next/server'
import { LoggerAggregator } from '@/aggregator/logger-aggregator'
import { RequestIdRepository } from '@/request-id/request-id-repository'

@Injectable()
export class TraceMiddleware extends Middleware {
  constructor(
    @Inject(LoggerAggregator) private readonly logger: LoggerAggregator,
    @Inject(RequestIdRepository)
    private readonly requestIdRepository: RequestIdRepository
  ) {
    super()
  }

  async use(request: NextRequest, next: MiddlewareNext): Promise<Response> {
    const traceId = this.requestIdRepository.generate()

    // Wrap in RequestIdRepository's AsyncLocalStorage so consumers
    // calling requestIdRepository.get() get the correct trace ID
    return this.requestIdRepository.runWith(traceId, () =>
      this.logger.runWithContext(
        new URL(request.url).pathname,
        request.method,
        { traceId },
        async () => {
          const response = await next()

          this.logger.setResponseMetadata(
            response.status,
            Number(response.headers.get('content-length')) || undefined
          )

          return response
        }
      )
    )
  }
}
