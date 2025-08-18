import { getBreadcrumbPaths } from './get-breadcrumb-paths'
import { BreadcrumbPath } from './index'

type BreadcrumbPathTabs = (BreadcrumbPath & {
  active?: () => boolean
})[]

describe('getBreadcrumbPaths', () => {
  describe('when paths have no active property', () => {
    it('should return all paths unchanged', () => {
      const paths: BreadcrumbPathTabs = [
        { name: 'Home', href: '/' },
        { name: 'Products', href: '/products' },
        { name: 'Details' }
      ]

      const result = getBreadcrumbPaths(paths)

      expect(result).toEqual([
        { name: 'Home', href: '/' },
        { name: 'Products', href: '/products' },
        { name: 'Details' }
      ])
    })

    it('should return empty array when input is empty', () => {
      const paths: BreadcrumbPathTabs = []

      const result = getBreadcrumbPaths(paths)

      expect(result).toEqual([])
    })
  })

  describe('when paths have active property', () => {
    it('should include paths where active returns true', () => {
      const paths: BreadcrumbPathTabs = [
        { name: 'Home', href: '/', active: () => true },
        { name: 'Products', href: '/products', active: () => true },
        { name: 'Details', active: () => false }
      ]

      const result = getBreadcrumbPaths(paths)

      expect(result).toEqual([
        { name: 'Home', href: '/' },
        { name: 'Products', href: '/products' }
      ])
    })

    it('should exclude paths where active returns false', () => {
      const paths: BreadcrumbPathTabs = [
        { name: 'Home', href: '/', active: () => false },
        { name: 'Products', href: '/products', active: () => false },
        { name: 'Details', active: () => false }
      ]

      const result = getBreadcrumbPaths(paths)

      expect(result).toEqual([])
    })

    it('should remove active property from returned paths', () => {
      const activeFn = jest.fn(() => true)
      const paths: BreadcrumbPathTabs = [
        { name: 'Home', href: '/', active: activeFn }
      ]

      const result = getBreadcrumbPaths(paths)

      expect(result).toEqual([{ name: 'Home', href: '/' }])
      expect(result[0]).not.toHaveProperty('active')
    })

    it('should call active function for each path that has it', () => {
      const activeFn1 = jest.fn(() => true)
      const activeFn2 = jest.fn(() => false)
      const activeFn3 = jest.fn(() => true)

      const paths: BreadcrumbPathTabs = [
        { name: 'Home', href: '/', active: activeFn1 },
        { name: 'Products', href: '/products', active: activeFn2 },
        { name: 'Details', active: activeFn3 }
      ]

      getBreadcrumbPaths(paths)

      expect(activeFn1).toHaveBeenCalledTimes(1)
      expect(activeFn2).toHaveBeenCalledTimes(1)
      expect(activeFn3).toHaveBeenCalledTimes(1)
    })
  })

  describe('when paths have mixed active properties', () => {
    it('should handle paths with and without active property correctly', () => {
      const paths: BreadcrumbPathTabs = [
        { name: 'Home', href: '/' }, // no active property
        { name: 'Products', href: '/products', active: () => true },
        { name: 'Category', href: '/category' }, // no active property
        { name: 'Details', active: () => false }
      ]

      const result = getBreadcrumbPaths(paths)

      expect(result).toEqual([
        { name: 'Home', href: '/' },
        { name: 'Products', href: '/products' },
        { name: 'Category', href: '/category' }
      ])
    })

    it('should handle null and undefined active properties correctly', () => {
      const paths: BreadcrumbPathTabs = [
        { name: 'Home', href: '/', active: undefined },
        { name: 'Products', href: '/products', active: null as any },
        { name: 'Details', active: () => true }
      ]

      const result = getBreadcrumbPaths(paths)

      expect(result).toEqual([
        { name: 'Home', href: '/' },
        { name: 'Products', href: '/products' },
        { name: 'Details' }
      ])
    })
  })

  describe('edge cases', () => {
    it('should handle paths with only name property', () => {
      const paths: BreadcrumbPathTabs = [
        { name: 'Home' },
        { name: 'Current Page', active: () => true }
      ]

      const result = getBreadcrumbPaths(paths)

      expect(result).toEqual([{ name: 'Home' }, { name: 'Current Page' }])
    })

    it('should handle paths with empty name', () => {
      const paths: BreadcrumbPathTabs = [
        { name: '', href: '/' },
        { name: '', active: () => true }
      ]

      const result = getBreadcrumbPaths(paths)

      expect(result).toEqual([{ name: '', href: '/' }, { name: '' }])
    })

    it('should handle active function that throws error', () => {
      const throwingActive = jest.fn(() => {
        throw new Error('Test error')
      })

      const paths: BreadcrumbPathTabs = [
        { name: 'Home', href: '/' },
        { name: 'Throwing', active: throwingActive }
      ]

      expect(() => getBreadcrumbPaths(paths)).toThrow('Test error')
      expect(throwingActive).toHaveBeenCalledTimes(1)
    })

    it('should preserve original array and not mutate input', () => {
      const originalPaths: BreadcrumbPathTabs = [
        { name: 'Home', href: '/', active: () => true },
        { name: 'Products', href: '/products', active: () => false }
      ]
      const pathsCopy = JSON.parse(JSON.stringify(originalPaths))

      getBreadcrumbPaths(originalPaths)

      // Verify original array is not mutated (except for function references)
      expect(originalPaths.length).toBe(pathsCopy.length)
      expect(originalPaths[0].name).toBe(pathsCopy[0].name)
      expect(originalPaths[0].href).toBe(pathsCopy[0].href)
      expect(originalPaths[1].name).toBe(pathsCopy[1].name)
      expect(originalPaths[1].href).toBe(pathsCopy[1].href)
    })
  })

  describe('performance and behavior', () => {
    it('should maintain order of paths', () => {
      const paths: BreadcrumbPathTabs = [
        { name: 'Third', active: () => true },
        { name: 'First', active: () => true },
        { name: 'Second', active: () => true }
      ]

      const result = getBreadcrumbPaths(paths)

      expect(result[0].name).toBe('Third')
      expect(result[1].name).toBe('First')
      expect(result[2].name).toBe('Second')
    })

    it('should work with large arrays', () => {
      const largePaths: BreadcrumbPathTabs = Array.from(
        { length: 1000 },
        (_, i) => ({
          name: `Path ${i}`,
          href: `/path-${i}`,
          active: () => i % 2 === 0 // Include only even indexed paths
        })
      )

      const result = getBreadcrumbPaths(largePaths)

      expect(result.length).toBe(500) // Half of 1000
      expect(result[0].name).toBe('Path 0')
      expect(result[1].name).toBe('Path 2')
      expect(result[499].name).toBe('Path 998')
    })
  })
})
