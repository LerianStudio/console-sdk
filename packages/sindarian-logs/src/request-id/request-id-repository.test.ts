import { RequestIdRepository } from './request-id-repository'

describe('RequestIdRepository', () => {
  let repository: RequestIdRepository

  beforeEach(() => {
    repository = new RequestIdRepository()
  })

  describe('generate', () => {
    it('should return a valid UUID', () => {
      const id = repository.generate()
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should return unique values on each call', () => {
      const ids = new Set(
        Array.from({ length: 100 }, () => repository.generate())
      )
      expect(ids.size).toBe(100)
    })
  })

  describe('get', () => {
    it('should return undefined when outside a context', () => {
      expect(repository.get()).toBeUndefined()
    })
  })

  describe('runWith', () => {
    it('should make the ID available via get() inside the callback', () => {
      const traceId = 'test-trace-id'

      repository.runWith(traceId, () => {
        expect(repository.get()).toBe(traceId)
      })
    })

    it('should return undefined after the callback exits', () => {
      repository.runWith('some-id', () => {})
      expect(repository.get()).toBeUndefined()
    })

    it('should return the callback result', () => {
      const result = repository.runWith('id', () => 42)
      expect(result).toBe(42)
    })

    it('should support async callbacks', async () => {
      const result = await repository.runWith('id', async () => {
        return 'async-result'
      })
      expect(result).toBe('async-result')
    })

    it('should isolate concurrent contexts', async () => {
      const results: string[] = []

      await Promise.all([
        repository.runWith('id-A', async () => {
          await new Promise((r) => setTimeout(r, 10))
          results.push(`A:${repository.get()}`)
        }),
        repository.runWith('id-B', async () => {
          results.push(`B:${repository.get()}`)
        })
      ])

      expect(results).toContain('A:id-A')
      expect(results).toContain('B:id-B')
    })

    it('should support nested contexts', () => {
      repository.runWith('outer', () => {
        expect(repository.get()).toBe('outer')

        repository.runWith('inner', () => {
          expect(repository.get()).toBe('inner')
        })

        expect(repository.get()).toBe('outer')
      })
    })
  })
})
