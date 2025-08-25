import 'reflect-metadata'
import { FILTER_KEY } from '../../constants/keys'
import { Class } from '../../types/class'
import { filterHandler, UseFilters } from './use-filters-decorator'

describe('filterHandler', () => {
  class TestFilter {}
  class AnotherFilter {}

  class TestClass {}

  beforeEach(() => {
    // Clear metadata before each test
    try {
      Reflect.deleteMetadata(FILTER_KEY, TestClass)
    } catch (error) {
      // Ignore errors if metadata doesn't exist
    }
  })

  it('should return empty array when no metadata is found', () => {
    const result = filterHandler(TestClass)
    expect(result).toEqual([])
  })

  it('should return existing filters when metadata exists', () => {
    const filters = [TestFilter, AnotherFilter]
    Reflect.defineMetadata(FILTER_KEY, filters, TestClass)

    const result = filterHandler(TestClass)
    expect(result).toEqual(filters)
  })

  it('should return empty array for different target objects', () => {
    class AnotherTestClass {}

    // Set metadata on TestClass
    Reflect.defineMetadata(FILTER_KEY, [TestFilter], TestClass)

    // Query metadata on AnotherTestClass
    const result = filterHandler(AnotherTestClass)
    expect(result).toEqual([])
  })

  it('should handle complex filter arrays', () => {
    const complexFilters = [TestFilter, AnotherFilter, TestFilter] // with duplicates
    Reflect.defineMetadata(FILTER_KEY, complexFilters, TestClass)

    const result = filterHandler(TestClass)
    expect(result).toEqual(complexFilters)
  })
})

describe('UseFilters decorator', () => {
  class TestFilter {}
  class AnotherFilter {}
  class ThirdFilter {}

  class TestClass {}
  class AnotherTestClass {}

  beforeEach(() => {
    // Clear metadata before each test
    const testClasses = [TestClass, AnotherTestClass]
    testClasses.forEach((testClass) => {
      try {
        Reflect.deleteMetadata(FILTER_KEY, testClass)
      } catch (error) {
        // Ignore errors if metadata doesn't exist
      }
    })
  })

  it('should set filters metadata on target class', () => {
    const filters = [TestFilter, AnotherFilter]
    const decorator = UseFilters(filters)
    decorator(TestClass)

    const metadata = Reflect.getOwnMetadata(FILTER_KEY, TestClass)
    expect(metadata).toEqual(filters)
  })

  it('should add filters to existing metadata', () => {
    // Set initial filters
    const initialFilters = [TestFilter]
    Reflect.defineMetadata(FILTER_KEY, initialFilters, TestClass)

    // Apply decorator with additional filters
    const additionalFilters = [AnotherFilter, ThirdFilter]
    const decorator = UseFilters(additionalFilters)
    decorator(TestClass)

    const metadata = Reflect.getOwnMetadata(FILTER_KEY, TestClass)
    expect(metadata).toEqual([TestFilter, AnotherFilter, ThirdFilter])
  })

  it('should handle empty filters array', () => {
    const decorator = UseFilters([])
    decorator(TestClass)

    const metadata = Reflect.getOwnMetadata(FILTER_KEY, TestClass)
    expect(metadata).toEqual([])
  })

  it('should handle single filter', () => {
    const decorator = UseFilters([TestFilter])
    decorator(TestClass)

    const metadata = Reflect.getOwnMetadata(FILTER_KEY, TestClass)
    expect(metadata).toEqual([TestFilter])
  })

  it('should handle multiple applications of the decorator', () => {
    const decorator1 = UseFilters([TestFilter])
    const decorator2 = UseFilters([AnotherFilter])
    const decorator3 = UseFilters([ThirdFilter])

    decorator1(TestClass)
    decorator2(TestClass)
    decorator3(TestClass)

    const metadata = Reflect.getOwnMetadata(FILTER_KEY, TestClass)
    expect(metadata).toEqual([TestFilter, AnotherFilter, ThirdFilter])
  })

  it('should allow duplicate filters', () => {
    const decorator1 = UseFilters([TestFilter, AnotherFilter])
    const decorator2 = UseFilters([TestFilter]) // duplicate TestFilter

    decorator1(TestClass)
    decorator2(TestClass)

    const metadata = Reflect.getOwnMetadata(FILTER_KEY, TestClass)
    expect(metadata).toEqual([TestFilter, AnotherFilter, TestFilter])
  })

  it('should set independent metadata for different classes', () => {
    const decorator1 = UseFilters([TestFilter])
    const decorator2 = UseFilters([AnotherFilter])

    decorator1(TestClass)
    decorator2(AnotherTestClass)

    const metadata1 = Reflect.getOwnMetadata(FILTER_KEY, TestClass)
    const metadata2 = Reflect.getOwnMetadata(FILTER_KEY, AnotherTestClass)

    expect(metadata1).toEqual([TestFilter])
    expect(metadata2).toEqual([AnotherFilter])
    expect(metadata1).not.toEqual(metadata2)
  })

  it('should preserve original existing filters when adding new ones', () => {
    // Set initial filters manually
    const initialFilters = [TestFilter, AnotherFilter]
    Reflect.defineMetadata(FILTER_KEY, initialFilters, TestClass)

    // Apply decorator
    const decorator = UseFilters([ThirdFilter])
    decorator(TestClass)

    const metadata = Reflect.getOwnMetadata(FILTER_KEY, TestClass)
    expect(metadata).toEqual([TestFilter, AnotherFilter, ThirdFilter])

    // Verify the original array wasn't modified
    expect(initialFilters).toEqual([TestFilter, AnotherFilter])
  })

  it('should work with class constructors as filters', () => {
    class CustomFilter {
      handle() {}
    }

    class AnotherCustomFilter {
      process() {}
    }

    const decorator = UseFilters([CustomFilter, AnotherCustomFilter])
    decorator(TestClass)

    const metadata = Reflect.getOwnMetadata(FILTER_KEY, TestClass)
    expect(metadata).toEqual([CustomFilter, AnotherCustomFilter])
  })

  it('should maintain filter order', () => {
    const filters = [ThirdFilter, TestFilter, AnotherFilter] // specific order
    const decorator = UseFilters(filters)
    decorator(TestClass)

    const metadata = Reflect.getOwnMetadata(FILTER_KEY, TestClass)
    expect(metadata).toEqual(filters)
  })

  it('should handle large number of filters', () => {
    const manyFilters: Class[] = []
    for (let i = 0; i < 100; i++) {
      manyFilters.push(class {})
    }

    const decorator = UseFilters(manyFilters)
    decorator(TestClass)

    const metadata = Reflect.getOwnMetadata(FILTER_KEY, TestClass)
    expect(metadata).toEqual(manyFilters)
    expect(metadata).toHaveLength(100)
  })
})

describe('Integration tests', () => {
  class TestFilter {}
  class AnotherFilter {}

  class TestClass {}

  beforeEach(() => {
    // Clear metadata before each test
    try {
      Reflect.deleteMetadata(FILTER_KEY, TestClass)
    } catch (error) {
      // Ignore errors if metadata doesn't exist
    }
  })

  it('should work with filterHandler after UseFilters decoration', () => {
    const filters = [TestFilter, AnotherFilter]
    const decorator = UseFilters(filters)
    decorator(TestClass)

    const result = filterHandler(TestClass)
    expect(result).toEqual(filters)
  })

  it('should accumulate filters through multiple decorations and be readable by handler', () => {
    const decorator1 = UseFilters([TestFilter])
    const decorator2 = UseFilters([AnotherFilter])

    decorator1(TestClass)
    decorator2(TestClass)

    const result = filterHandler(TestClass)
    expect(result).toEqual([TestFilter, AnotherFilter])
  })

  it('should return empty array from handler when no decorations applied', () => {
    const result = filterHandler(TestClass)
    expect(result).toEqual([])
  })
})
