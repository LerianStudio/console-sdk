import 'reflect-metadata'
import {
  InterceptorHandler,
  UseInterceptors,
  InterceptorMetadata
} from './use-interceptor-decorator'
import { INTERCEPTOR_KEY } from '../../constants/keys'
import { Interceptor } from '../interceptor'
import { CallHandler } from '../call-handler'
import { ExecutionContext } from '../../context/execution-context'

class MockInterceptor extends Interceptor {
  constructor(
    private name: string,
    private shouldThrow = false
  ) {
    super()
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    if (this.shouldThrow) {
      throw new Error(`${this.name} error`)
    }
    const result = await next.handle()
    return `${this.name}(${result})`
  }
}

class MockInterceptorClass extends Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const result = await next.handle()
    return `class(${result})`
  }
}

describe('InterceptorHandler.execute', () => {
  let mockContext: ExecutionContext

  beforeEach(() => {
    mockContext = new ExecutionContext(class {}, () => {}, [])
  })

  it('should execute action directly when no middlewares', async () => {
    const action = jest.fn().mockResolvedValue('result')
    const result = await InterceptorHandler.execute(mockContext, [], action)

    expect(result).toBe('result')
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('should execute single interceptor', async () => {
    const interceptor = new MockInterceptor('test')
    const action = jest.fn().mockResolvedValue('result')

    const result = await InterceptorHandler.execute(
      mockContext,
      [interceptor],
      action
    )

    expect(result).toBe('test(result)')
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('should execute multiple interceptors in order', async () => {
    const interceptor1 = new MockInterceptor('first')
    const interceptor2 = new MockInterceptor('second')
    const action = jest.fn().mockResolvedValue('result')

    const result = await InterceptorHandler.execute(
      mockContext,
      [interceptor1, interceptor2],
      action
    )

    expect(result).toBe('first(second(result))')
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('should continue to next interceptor when one throws', async () => {
    const interceptor1 = new MockInterceptor('first', true)
    const interceptor2 = new MockInterceptor('second')
    const action = jest.fn().mockResolvedValue('result')

    const result = await InterceptorHandler.execute(
      mockContext,
      [interceptor1, interceptor2],
      action
    )

    expect(result).toBe('second(result)')
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('should execute action when all interceptors throw', async () => {
    const interceptor1 = new MockInterceptor('first', true)
    const interceptor2 = new MockInterceptor('second', true)
    const action = jest.fn().mockResolvedValue('result')

    const result = await InterceptorHandler.execute(
      mockContext,
      [interceptor1, interceptor2],
      action
    )

    expect(result).toBe('result')
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('should handle async action', async () => {
    const interceptor = new MockInterceptor('test')
    const action = jest
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve('async-result'), 10)
          )
      )

    const result = await InterceptorHandler.execute(
      mockContext,
      [interceptor],
      action
    )

    expect(result).toBe('test(async-result)')
    expect(action).toHaveBeenCalledTimes(1)
  })
})

describe('InterceptorHandler.getMetadata', () => {
  it('should return empty array when no interceptors defined', () => {
    class TestClass {}

    const interceptors = InterceptorHandler.getMetadata(TestClass)

    expect(interceptors).toEqual({ interceptors: [] })
  })

  it('should return interceptors when defined', () => {
    class TestClass {}
    const mockInterceptor = new MockInterceptor('test')
    Reflect.defineMetadata(INTERCEPTOR_KEY, [mockInterceptor], TestClass)

    const interceptors = InterceptorHandler.getMetadata(TestClass)

    expect(interceptors).toEqual({ interceptors: [mockInterceptor] })
  })

  it('should return interceptors from prototype', () => {
    class TestClass {}
    const mockInterceptor = new MockInterceptor('test')
    Reflect.defineMetadata(
      INTERCEPTOR_KEY,
      [mockInterceptor],
      TestClass.prototype
    )

    const interceptors = InterceptorHandler.getMetadata(TestClass.prototype)

    expect(interceptors).toEqual({ interceptors: [mockInterceptor] })
  })
})

describe('UseInterceptors', () => {
  it('should add interceptor instances to metadata', () => {
    const interceptor1 = new MockInterceptor('test1')
    const interceptor2 = new MockInterceptor('test2')

    @UseInterceptors(interceptor1, interceptor2)
    class TestClass {}

    const metadata = Reflect.getMetadata(INTERCEPTOR_KEY, TestClass)
    expect(metadata).toEqual([interceptor1, interceptor2])
  })

  it('should add interceptor classes to metadata', () => {
    @UseInterceptors(MockInterceptorClass)
    class TestClass {}

    const metadata = Reflect.getMetadata(INTERCEPTOR_KEY, TestClass)
    expect(metadata).toEqual([MockInterceptorClass])
  })

  it('should merge with existing interceptors', () => {
    const existingInterceptor = new MockInterceptor('existing')
    const newInterceptor = new MockInterceptor('new')

    class TestClass {}
    Reflect.defineMetadata(INTERCEPTOR_KEY, [existingInterceptor], TestClass)

    UseInterceptors(newInterceptor)(TestClass)

    const metadata = Reflect.getMetadata(INTERCEPTOR_KEY, TestClass)
    expect(metadata).toEqual([existingInterceptor, newInterceptor])
  })

  it('should handle mixed interceptor instances and classes', () => {
    const interceptorInstance = new MockInterceptor('instance')

    @UseInterceptors(interceptorInstance, MockInterceptorClass)
    class TestClass {}

    const metadata = Reflect.getMetadata(INTERCEPTOR_KEY, TestClass)
    expect(metadata).toEqual([interceptorInstance, MockInterceptorClass])
  })

  it('should work with multiple decorator applications', () => {
    const interceptor1 = new MockInterceptor('first')
    const interceptor2 = new MockInterceptor('second')
    const interceptor3 = new MockInterceptor('third')

    @UseInterceptors(interceptor3)
    @UseInterceptors(interceptor1, interceptor2)
    class TestClass {}

    const metadata = Reflect.getMetadata(INTERCEPTOR_KEY, TestClass)
    expect(metadata).toEqual([interceptor1, interceptor2, interceptor3])
  })

  it('should work with no interceptors', () => {
    @UseInterceptors()
    class TestClass {}

    const metadata = Reflect.getMetadata(INTERCEPTOR_KEY, TestClass)
    expect(metadata).toEqual([])
  })

  it('should preserve metadata type correctly', () => {
    const interceptorInstance = new MockInterceptor('test')

    @UseInterceptors(interceptorInstance, MockInterceptorClass)
    class TestClass {}

    const metadata: InterceptorMetadata[] = Reflect.getMetadata(
      INTERCEPTOR_KEY,
      TestClass
    )

    expect(metadata).toHaveLength(2)
    expect(metadata[0]).toBeInstanceOf(MockInterceptor)
    expect(metadata[1]).toBe(MockInterceptorClass)
  })
})
