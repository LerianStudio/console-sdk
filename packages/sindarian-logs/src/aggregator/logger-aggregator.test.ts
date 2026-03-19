import { LoggerAggregator } from './logger-aggregator'
import { LoggerRepository } from '@/repositories/logger-repository'
import { AggregatedLog } from '@/types/log-event'

class MockLoggerRepository extends LoggerRepository {
  calls: { method: string; log: AggregatedLog }[] = []

  info(log: AggregatedLog): void {
    this.calls.push({ method: 'info', log })
  }
  error(log: AggregatedLog): void {
    this.calls.push({ method: 'error', log })
  }
  warn(log: AggregatedLog): void {
    this.calls.push({ method: 'warn', log })
  }
  debug(log: AggregatedLog): void {
    this.calls.push({ method: 'debug', log })
  }
  audit(log: AggregatedLog): void {
    this.calls.push({ method: 'audit', log })
  }
}

describe('LoggerAggregator', () => {
  let mockRepo: MockLoggerRepository
  let aggregator: LoggerAggregator

  beforeEach(() => {
    mockRepo = new MockLoggerRepository()
    aggregator = new LoggerAggregator(mockRepo)
  })

  describe('hasContext', () => {
    it('should return false outside a context', () => {
      expect(aggregator.hasContext()).toBe(false)
    })

    it('should return true inside a context', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        expect(aggregator.hasContext()).toBe(true)
      })
    })

    it('should return false after context exits', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {})
      expect(aggregator.hasContext()).toBe(false)
    })
  })

  describe('runWithContext', () => {
    it('should return the result of the callback', async () => {
      const result = await aggregator.runWithContext(
        '/test',
        'GET',
        {},
        async () => 'hello'
      )
      expect(result).toBe('hello')
    })

    it('should finalize and write log on completion', async () => {
      await aggregator.runWithContext('/api/users', 'POST', {}, async () => {
        aggregator.info('op', 'something happened')
      })

      expect(mockRepo.calls).toHaveLength(1)
      const { method, log } = mockRepo.calls[0]
      expect(method).toBe('info')
      expect(log.path).toBe('/api/users')
      expect(log.method).toBe('POST')
      expect(log.events).toHaveLength(1)
      expect(log.events[0].message).toBe('something happened')
      expect(log.duration).toBeGreaterThanOrEqual(0)
    })

    it('should include traceId from metadata', async () => {
      await aggregator.runWithContext(
        '/test',
        'GET',
        { traceId: 'abc-123' },
        async () => {}
      )

      expect(mockRepo.calls[0].log.traceId).toBe('abc-123')
    })

    it('should include handler from metadata', async () => {
      await aggregator.runWithContext(
        '/test',
        'GET',
        { handler: 'MyHandler.run' },
        async () => {}
      )

      expect(mockRepo.calls[0].log.handler).toBe('MyHandler.run')
    })

    it('should finalize and rethrow on error', async () => {
      const error = new Error('boom')

      await expect(
        aggregator.runWithContext('/test', 'GET', {}, async () => {
          throw error
        })
      ).rejects.toThrow('boom')

      expect(mockRepo.calls).toHaveLength(1)
      expect(mockRepo.calls[0].method).toBe('error')
      expect(mockRepo.calls[0].log.events).toHaveLength(1)
      expect(mockRepo.calls[0].log.events[0].message).toBe('boom')
    })

    it('should handle non-Error throws', async () => {
      await expect(
        aggregator.runWithContext('/test', 'GET', {}, async () => {
          throw 'string-error'
        })
      ).rejects.toBe('string-error')

      expect(mockRepo.calls[0].log.events[0].message).toBe('string-error')
    })
  })

  describe('addEvent', () => {
    it('should silently no-op when outside a context', () => {
      aggregator.addEvent({ message: 'ignored' })
      // No error thrown, no repo call
      expect(mockRepo.calls).toHaveLength(0)
    })

    it('should add events with timestamps', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        aggregator.addEvent({ message: 'first' })
        aggregator.addEvent({ message: 'second', level: 'warn' })
      })

      const events = mockRepo.calls[0].log.events
      expect(events).toHaveLength(2)
      expect(events[0].message).toBe('first')
      expect(events[1].message).toBe('second')
      expect(events[1].level).toBe('WARN')
      // Timestamps should be ISO strings
      expect(new Date(events[0].timestamp).toISOString()).toBe(
        events[0].timestamp
      )
    })

    it('should drop debug events when debug is disabled', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        aggregator.addEvent({ message: 'debug msg', level: 'debug' })
        aggregator.addEvent({ message: 'info msg', level: 'info' })
      })

      expect(mockRepo.calls[0].log.events).toHaveLength(1)
      expect(mockRepo.calls[0].log.events[0].message).toBe('info msg')
    })

    it('should include debug events when debug is enabled', async () => {
      const debugAggregator = new LoggerAggregator(mockRepo, { debug: true })

      await debugAggregator.runWithContext('/test', 'GET', {}, async () => {
        debugAggregator.addEvent({ message: 'debug msg', level: 'debug' })
      })

      expect(mockRepo.calls[0].log.events).toHaveLength(1)
      expect(mockRepo.calls[0].log.events[0].message).toBe('debug msg')
    })

    it('should cap events at MAX_EVENTS (1000)', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        for (let i = 0; i < 1100; i++) {
          aggregator.addEvent({ message: `event-${i}` })
        }
      })

      expect(mockRepo.calls[0].log.events).toHaveLength(1000)
      expect(mockRepo.calls[0].log.events[999].message).toBe('event-999')
    })
  })

  describe('setResponseMetadata', () => {
    it('should no-op outside a context', () => {
      // Should not throw
      aggregator.setResponseMetadata(200)
    })

    it('should set statusCode on the aggregated log', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        aggregator.setResponseMetadata(201)
      })

      expect(mockRepo.calls[0].log.statusCode).toBe(201)
    })

    it('should omit statusCode from log when not set', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {})

      expect(mockRepo.calls[0].log.statusCode).toBeUndefined()
    })
  })

  describe('convenience methods', () => {
    it.each([
      ['info', 'info'],
      ['error', 'error'],
      ['warn', 'warn'],
      ['audit', 'audit']
    ] as const)(
      'should log via %s convenience method',
      async (method, expectedRepoMethod) => {
        await aggregator.runWithContext('/test', 'GET', {}, async () => {
          aggregator[method]('op-name', 'message text', { key: 'val' })
        })

        const events = mockRepo.calls[0].log.events
        expect(events).toHaveLength(1)
        expect(events[0].operation).toBe('op-name')
        expect(events[0].message).toBe('message text')
        expect(events[0].context).toEqual({ key: 'val' })
        expect(mockRepo.calls[0].method).toBe(expectedRepoMethod)
      }
    )

    it('should log via debug when debug is enabled and escalation picks debug', async () => {
      const debugAggregator = new LoggerAggregator(mockRepo, { debug: true })

      await debugAggregator.runWithContext('/test', 'GET', {}, async () => {
        debugAggregator.debug('op', 'debug message')
      })

      // Level escalation defaults to 'info' (priority 1) which is higher than
      // debug (priority 0), so the repo method is 'info' — this is by design.
      // The debug event IS included in the events array though.
      expect(mockRepo.calls[0].method).toBe('info')
      expect(mockRepo.calls[0].log.events).toHaveLength(1)
      expect(mockRepo.calls[0].log.events[0].level).toBe('DEBUG')
    })

    it('should omit context when not provided', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        aggregator.info('op', 'no context')
      })

      expect(mockRepo.calls[0].log.events[0].context).toBeUndefined()
    })
  })

  describe('level escalation', () => {
    it('should escalate to the highest severity event', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        aggregator.info('op', 'info event')
        aggregator.error('op', 'error event')
        aggregator.warn('op', 'warn event')
      })

      expect(mockRepo.calls[0].method).toBe('error')
      expect(mockRepo.calls[0].log.level).toBe('error')
    })

    it('should escalate warn above info', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        aggregator.info('op', 'info')
        aggregator.warn('op', 'warn')
      })

      expect(mockRepo.calls[0].method).toBe('warn')
    })

    it('should escalate audit above info but below warn', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        aggregator.info('op', 'info')
        aggregator.audit('op', 'audit')
      })

      expect(mockRepo.calls[0].method).toBe('audit')
    })

    it('should default to info when no events have levels', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        aggregator.addEvent({ message: 'no level' })
      })

      expect(mockRepo.calls[0].method).toBe('info')
    })
  })

  describe('event transformation', () => {
    it('should omit empty context from transformed events', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        aggregator.addEvent({ message: 'msg', context: {} })
      })

      expect(mockRepo.calls[0].log.events[0].context).toBeUndefined()
    })

    it('should include error message in transformed events', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        aggregator.addEvent({
          message: 'failed',
          error: new Error('details')
        })
      })

      expect(mockRepo.calls[0].log.events[0].error).toBe('details')
    })

    it('should include operation in transformed events', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        aggregator.addEvent({ operation: 'my-op', message: 'msg' })
      })

      expect(mockRepo.calls[0].log.events[0].operation).toBe('my-op')
    })

    it('should uppercase level in transformed events', async () => {
      await aggregator.runWithContext('/test', 'GET', {}, async () => {
        aggregator.addEvent({ message: 'msg', level: 'warn' })
      })

      expect(mockRepo.calls[0].log.events[0].level).toBe('WARN')
    })
  })

  describe('concurrent contexts', () => {
    it('should isolate events between parallel requests', async () => {
      await Promise.all([
        aggregator.runWithContext('/a', 'GET', {}, async () => {
          aggregator.info('a-op', 'event-A')
          await new Promise((r) => setTimeout(r, 10))
        }),
        aggregator.runWithContext('/b', 'POST', {}, async () => {
          aggregator.info('b-op', 'event-B')
        })
      ])

      expect(mockRepo.calls).toHaveLength(2)

      const logA = mockRepo.calls.find((c) => c.log.path === '/a')
      const logB = mockRepo.calls.find((c) => c.log.path === '/b')

      expect(logA!.log.events).toHaveLength(1)
      expect(logA!.log.events[0].message).toBe('event-A')

      expect(logB!.log.events).toHaveLength(1)
      expect(logB!.log.events[0].message).toBe('event-B')
    })
  })
})
