import 'reflect-metadata'
import { Container } from 'inversify'
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
        return new Promise<boolean>((resolve) => setTimeout(resolve, 10, true))
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

  it('should not copy the class list onto each method', () => {
    const guard = new MockGuard('class-guard')

    @UseGuards(guard)
    class TestClass {
      method1() {}
      method2() {}
    }

    // `GuardHandler.fetch` reads the class list on its own, so a copy here
    // would resolve the same guard twice for every method, and — because the
    // class decorator runs AFTER the method decorators — would overwrite a
    // method-level `@UseGuards` outright.
    expect(
      Reflect.getOwnMetadata(GUARD_KEY, TestClass.prototype, 'method1')
    ).toBeUndefined()
    expect(
      Reflect.getOwnMetadata(GUARD_KEY, TestClass.prototype, 'method2')
    ).toBeUndefined()
  })

  it('keeps a method-level guard when the class carries one too', () => {
    const classGuard = new MockGuard('class-guard')
    const methodGuard = new MockGuard('method-guard')

    @UseGuards(classGuard)
    class TestClass {
      @UseGuards(methodGuard)
      guardedMethod() {}
      plainMethod() {}
    }

    expect(Reflect.getOwnMetadata(GUARD_KEY, TestClass)).toEqual({
      guards: [classGuard]
    })
    expect(
      Reflect.getOwnMetadata(GUARD_KEY, TestClass.prototype, 'guardedMethod')
    ).toEqual({ guards: [methodGuard] })
    // A method with no decorator of its own carries nothing; its guards come
    // from the class entry `fetch` reads separately.
    expect(
      Reflect.getOwnMetadata(GUARD_KEY, TestClass.prototype, 'plainMethod')
    ).toBeUndefined()
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

describe('GuardHandler.fetch, resolved the way the framework resolves it', () => {
  // Every other case in this file writes GUARD_KEY by hand, so none of them
  // observes what the real class decorator leaves behind. These drive
  // `@UseGuards` itself and then read the list `ServerFactory._fetchGuards`
  // would hand to `GuardHandler.execute`.
  let container: Container

  beforeEach(() => {
    container = new Container()
  })

  it('resolves a class-level guard exactly once for a method', async () => {
    @UseGuards(MockGuardClass)
    class TestController {
      remove() {}
    }
    container.bind(MockGuardClass).toSelf().inSingletonScope()

    const guards = await GuardHandler.fetch(
      container,
      new TestController(),
      'remove'
    )

    expect(guards).toHaveLength(1)
    expect(guards[0]).toBeInstanceOf(MockGuardClass)
  })

  it('runs a method-level guard after the class-level one', async () => {
    class ReadGuard implements CanActivate {
      async canActivate(): Promise<boolean> {
        return true
      }
    }
    class AdminGuard implements CanActivate {
      async canActivate(): Promise<boolean> {
        return true
      }
    }

    @UseGuards(ReadGuard)
    class TestController {
      @UseGuards(AdminGuard)
      remove() {}
    }
    container.bind(ReadGuard).toSelf().inSingletonScope()
    container.bind(AdminGuard).toSelf().inSingletonScope()

    const guards = await GuardHandler.fetch(
      container,
      new TestController(),
      'remove'
    )

    expect(guards).toHaveLength(2)
    expect(guards[0]).toBeInstanceOf(ReadGuard)
    expect(guards[1]).toBeInstanceOf(AdminGuard)
  })

  it('consults each guard exactly once when the list is executed', async () => {
    const classCalls = jest.fn()
    const methodCalls = jest.fn()

    class ReadGuard implements CanActivate {
      async canActivate(): Promise<boolean> {
        classCalls()
        return true
      }
    }
    class AdminGuard implements CanActivate {
      async canActivate(): Promise<boolean> {
        methodCalls()
        return true
      }
    }

    @UseGuards(ReadGuard)
    class TestController {
      @UseGuards(AdminGuard)
      remove() {}
    }
    container.bind(ReadGuard).toSelf().inSingletonScope()
    container.bind(AdminGuard).toSelf().inSingletonScope()

    const guards = await GuardHandler.fetch(
      container,
      new TestController(),
      'remove'
    )
    await GuardHandler.execute(
      new ExecutionContext(TestController, () => {}, []),
      guards
    )

    expect(classCalls).toHaveBeenCalledTimes(1)
    expect(methodCalls).toHaveBeenCalledTimes(1)
  })

  it('registers a method-level guard on a class that carries one', () => {
    class ReadGuard implements CanActivate {
      async canActivate(): Promise<boolean> {
        return true
      }
    }
    class AdminGuard implements CanActivate {
      async canActivate(): Promise<boolean> {
        return true
      }
    }

    @UseGuards(ReadGuard)
    class TestController {
      @UseGuards(AdminGuard)
      remove() {}
    }

    GuardHandler.register(container, TestController)

    expect(container.isBound(ReadGuard)).toBe(true)
    expect(container.isBound(AdminGuard)).toBe(true)
  })
})
