import { getClassMethods } from './get-class-methods'

describe('getClassMethods', () => {
  it('should return method names from a class with multiple methods', () => {
    class _TestClass {
      constructor() {}

      methodA() {
        return 'a'
      }

      methodB() {
        return 'b'
      }

      methodC() {
        return 'c'
      }
    }

    const methods = getClassMethods(_TestClass)

    expect(methods).toEqual(['methodA', 'methodB', 'methodC'])
    expect(methods).toHaveLength(3)
  })

  it('should exclude the constructor from the returned methods', () => {
    class _TestClass {
      constructor() {}

      testMethod() {
        return 'test'
      }
    }

    const methods = getClassMethods(_TestClass)

    expect(methods).not.toContain('constructor')
    expect(methods).toEqual(['testMethod'])
  })

  it('should return empty array for a class with no methods', () => {
    class _EmptyClass {
      constructor() {}
    }

    const methods = getClassMethods(_EmptyClass)

    expect(methods).toEqual([])
    expect(methods).toHaveLength(0)
  })

  it('should exclude properties and getters/setters, only include functions', () => {
    class _TestClass {
      property: string

      constructor() {
        this.property = 'value'
      }

      get getter() {
        return this.property
      }

      set setter(value: string) {
        this.property = value
      }

      regularMethod() {
        return 'method'
      }
    }

    const methods = getClassMethods(_TestClass)

    // Should only include actual function methods, not getters/setters
    expect(methods).not.toContain('getter')
    expect(methods).not.toContain('setter')
    expect(methods).toContain('regularMethod')
    expect(methods).toEqual(['regularMethod'])
  })

  it('should not include static methods', () => {
    class _TestClass {
      constructor() {}

      static staticMethod() {
        return 'static'
      }

      instanceMethod() {
        return 'instance'
      }
    }

    const methods = getClassMethods(_TestClass)

    expect(methods).not.toContain('staticMethod')
    expect(methods).toEqual(['instanceMethod'])
  })

  it('should only return own methods, not inherited ones', () => {
    class _BaseClass {
      baseMethod() {
        return 'base'
      }
    }

    class _DerivedClass extends _BaseClass {
      derivedMethod() {
        return 'derived'
      }
    }

    const methods = getClassMethods(_DerivedClass)

    // Should only include methods from the derived class, not inherited ones
    expect(methods).toEqual(['derivedMethod'])
    expect(methods).not.toContain('baseMethod')
  })

  it('should handle async methods', () => {
    class _TestClass {
      constructor() {}

      async asyncMethod() {
        return Promise.resolve('async')
      }

      syncMethod() {
        return 'sync'
      }
    }

    const methods = getClassMethods(_TestClass)

    expect(methods).toContain('asyncMethod')
    expect(methods).toContain('syncMethod')
    expect(methods).toHaveLength(2)
  })

  it('should handle arrow function methods', () => {
    class _TestClass {
      arrowMethod: () => string

      constructor() {
        // Arrow functions assigned in constructor are instance properties, not prototype methods
        this.arrowMethod = () => 'arrow'
      }

      regularMethod() {
        return 'regular'
      }
    }

    const methods = getClassMethods(_TestClass)

    // Arrow functions in constructor are not on prototype, so shouldn't be included
    expect(methods).not.toContain('arrowMethod')
    expect(methods).toEqual(['regularMethod'])
  })

  it('should handle methods with different parameter signatures', () => {
    class _TestClass {
      constructor() {}

      noParams() {
        return 'no params'
      }

      oneParam(param: string) {
        return param
      }

      multipleParams(a: string, b: number, c: boolean) {
        return { a, b, c }
      }

      optionalParams(required: string, optional?: number) {
        return { required, optional }
      }
    }

    const methods = getClassMethods(_TestClass)

    expect(methods).toEqual([
      'noParams',
      'oneParam',
      'multipleParams',
      'optionalParams'
    ])
    expect(methods).toHaveLength(4)
  })

  it('should maintain method order as they appear in the class', () => {
    class _TestClass {
      constructor() {}

      firstMethod() {
        return 'first'
      }

      secondMethod() {
        return 'second'
      }

      thirdMethod() {
        return 'third'
      }
    }

    const methods = getClassMethods(_TestClass)

    // Note: Object.getOwnPropertyNames preserves definition order
    expect(methods).toEqual(['firstMethod', 'secondMethod', 'thirdMethod'])
  })
})
