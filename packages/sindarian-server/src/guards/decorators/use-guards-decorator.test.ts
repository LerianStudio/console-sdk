import 'reflect-metadata'
import { GuardHandler, UseGuards, GuardMetadata } from './use-guards-decorator'
import { GUARD_KEY } from '../../constants/keys'
import { CanActivate } from '../can-activate'
import { ExecutionContext } from '../../context/execution-context'
import { ForbiddenApiException } from '../../exceptions/api-exception'

class MockGuard implements CanActivate {
  constructor(
    private name: string,
    private shouldAllow: boolean = true
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.shouldAllow
  }
}

class MockGuardClass implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    return true
  }
}

describe('GuardHandler.execute', () => {
  let mockContext: ExecutionContext

  beforeEach(() => {
    mockContext = new ExecutionContext(class {}, () => {}, [])
  })

  it('should return true when no guards', async () => {
    const result = await GuardHandler.execute(mockContext, [])

    expect(result).toBe(true)
  })

  it('should return true when single guard allows', async () => {
    const guard = new MockGuard('test', true)

    const result = await GuardHandler.execute(mockContext, [guard])

    expect(result).toBe(true)
  })

  it('should throw ForbiddenApiException when single guard denies', async () => {
    const guard = new MockGuard('test', false)

    await expect(GuardHandler.execute(mockContext, [guard])).rejects.toThrow(
      ForbiddenApiException
    )
  })

  it('should execute multiple guards in sequence', async () => {
    const executionOrder: string[] = []

    class OrderTrackingGuard implements CanActivate {
      constructor(private name: string) {}
      async canActivate(): Promise<boolean> {
        executionOrder.push(this.name)
        return true
      }
    }

    const guard1 = new OrderTrackingGuard('first')
    const guard2 = new OrderTrackingGuard('second')
    const guard3 = new OrderTrackingGuard('third')

    await GuardHandler.execute(mockContext, [guard1, guard2, guard3])

    expect(executionOrder).toEqual(['first', 'second', 'third'])
  })

  it('should stop execution when a guard denies', async () => {
    const executionOrder: string[] = []

    class OrderTrackingGuard implements CanActivate {
      constructor(
        private name: string,
        private shouldAllow: boolean
      ) {}
      async canActivate(): Promise<boolean> {
        executionOrder.push(this.name)
        return this.shouldAllow
      }
    }

    const guard1 = new OrderTrackingGuard('first', true)
    const guard2 = new OrderTrackingGuard('second', false)
    const guard3 = new OrderTrackingGuard('third', true)

    await expect(
      GuardHandler.execute(mockContext, [guard1, guard2, guard3])
    ).rejects.toThrow(ForbiddenApiException)

    expect(executionOrder).toEqual(['first', 'second'])
  })

  it('should handle async guards', async () => {
    class AsyncGuard implements CanActivate {
      async canActivate(): Promise<boolean> {
        return new Promise((resolve) =>
          setTimeout(() => resolve(true), 10)
        )
      }
    }

    const guard = new AsyncGuard()

    const result = await GuardHandler.execute(mockContext, [guard])

    expect(result).toBe(true)
  })

  it('should propagate exceptions thrown by guards', async () => {
    class ThrowingGuard implements CanActivate {
      async canActivate(): Promise<boolean> {
        throw new Error('Custom guard error')
      }
    }

    const guard = new ThrowingGuard()

    await expect(GuardHandler.execute(mockContext, [guard])).rejects.toThrow(
      'Custom guard error'
    )
  })
})

describe('GuardHandler.getClassMetadata', () => {
  it('should return undefined when no guards defined', () => {
    class TestClass {}

    const metadata = GuardHandler.getClassMetadata(TestClass)

    expect(metadata).toBeUndefined()
  })

  it('should return guards when defined', () => {
    class TestClass {}
    const mockGuard = new MockGuard('test')
    Reflect.defineMetadata(GUARD_KEY, { guards: [mockGuard] }, TestClass)

    const metadata = GuardHandler.getClassMetadata(TestClass)

    expect(metadata).toEqual({ guards: [mockGuard] })
  })
})

describe('GuardHandler.getMethodMetadata', () => {
  it('should return undefined when no guards defined', () => {
    class TestClass {
      testMethod() {}
    }

    const metadata = GuardHandler.getMethodMetadata(
      TestClass.prototype,
      'testMethod'
    )

    expect(metadata).toBeUndefined()
  })

  it('should return guards when defined on method', () => {
    class TestClass {
      testMethod() {}
    }
    const mockGuard = new MockGuard('test')
    Reflect.defineMetadata(
      GUARD_KEY,
      { guards: [mockGuard] },
      TestClass.prototype,
      'testMethod'
    )

    const metadata = GuardHandler.getMethodMetadata(
      TestClass.prototype,
      'testMethod'
    )

    expect(metadata).toEqual({ guards: [mockGuard] })
  })
})

describe('UseGuards', () => {
  it('should add guard instances to class metadata', () => {
    const guard1 = new MockGuard('test1')
    const guard2 = new MockGuard('test2')

    @UseGuards(guard1, guard2)
    class TestClass {}

    const metadata = Reflect.getOwnMetadata(GUARD_KEY, TestClass)
    expect(metadata).toEqual({ guards: [guard1, guard2] })
  })

  it('should add guard classes to metadata', () => {
    @UseGuards(MockGuardClass)
    class TestClass {}

    const metadata = Reflect.getOwnMetadata(GUARD_KEY, TestClass)
    expect(metadata).toEqual({ guards: [MockGuardClass] })
  })

  it('should handle mixed guard instances and classes', () => {
    const guardInstance = new MockGuard('instance')

    @UseGuards(guardInstance, MockGuardClass)
    class TestClass {}

    const metadata = Reflect.getOwnMetadata(GUARD_KEY, TestClass)
    expect(metadata).toEqual({ guards: [guardInstance, MockGuardClass] })
  })

  it('should work with no guards', () => {
    @UseGuards()
    class TestClass {}

    const metadata = Reflect.getOwnMetadata(GUARD_KEY, TestClass)
    expect(metadata).toEqual({ guards: [] })
  })

  it('should apply guards to method when used as method decorator', () => {
    const guard = new MockGuard('method-guard')

    class TestClass {
      @UseGuards(guard)
      testMethod() {}
    }

    const metadata = Reflect.getOwnMetadata(
      GUARD_KEY,
      TestClass.prototype,
      'testMethod'
    )
    expect(metadata).toEqual({ guards: [guard] })
  })

  it('should apply class guards to all methods', () => {
    const guard = new MockGuard('class-guard')

    @UseGuards(guard)
    class TestClass {
      method1() {}
      method2() {}
    }

    const method1Metadata = Reflect.getOwnMetadata(
      GUARD_KEY,
      TestClass.prototype,
      'method1'
    )
    const method2Metadata = Reflect.getOwnMetadata(
      GUARD_KEY,
      TestClass.prototype,
      'method2'
    )

    expect(method1Metadata).toEqual({ guards: [guard] })
    expect(method2Metadata).toEqual({ guards: [guard] })
  })

  it('should preserve metadata type correctly', () => {
    const guardInstance = new MockGuard('test')

    @UseGuards(guardInstance, MockGuardClass)
    class TestClass {}

    const metadata: GuardMetadata = Reflect.getOwnMetadata(GUARD_KEY, TestClass)

    expect(metadata.guards).toHaveLength(2)
    expect(metadata.guards[0]).toBeInstanceOf(MockGuard)
    expect(metadata.guards[1]).toBe(MockGuardClass)
  })
})
