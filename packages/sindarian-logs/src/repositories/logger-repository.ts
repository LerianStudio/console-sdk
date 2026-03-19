import { AggregatedLog } from '@/types/log-event'

export abstract class LoggerRepository {
  abstract info(log: AggregatedLog): void
  abstract error(log: AggregatedLog): void
  abstract warn(log: AggregatedLog): void
  abstract debug(log: AggregatedLog): void
  abstract audit(log: AggregatedLog): void
}
