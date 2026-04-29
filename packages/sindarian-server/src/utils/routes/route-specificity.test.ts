import {
  sortRoutesBySpecificity,
  calculateRouteSpecificity
} from './route-specificity'
import { ModuleMetadata } from '@/modules/module-decorator'
import { HttpMethods } from '@/constants/http-methods'

describe('route-specificity', () => {
  describe('calculateRouteSpecificity', () => {
    it('should score static routes higher than parameter routes', () => {
      const staticScore = calculateRouteSpecificity('/users/active')
      const paramScore = calculateRouteSpecificity('/users/:id')

      expect(staticScore).toBeGreaterThan(paramScore)
    })

    it('should score parameter routes higher than wildcard routes', () => {
      const paramScore = calculateRouteSpecificity('/users/:id')
      const wildcardScore = calculateRouteSpecificity('/users/*')

      expect(paramScore).toBeGreaterThan(wildcardScore)
    })

    it('should score longer static paths higher', () => {
      const longerScore = calculateRouteSpecificity('/api/v1/users/active')
      const shorterScore = calculateRouteSpecificity('/api/users')

      expect(longerScore).toBeGreaterThan(shorterScore)
    })

    it('should score mixed routes with more static segments higher', () => {
      const moreStaticScore = calculateRouteSpecificity(
        '/users/:id/posts/recent'
      )
      const lessStaticScore = calculateRouteSpecificity(
        '/users/:id/posts/:postId'
      )

      expect(moreStaticScore).toBeGreaterThan(lessStaticScore)
    })

    it('should handle root path', () => {
      const score = calculateRouteSpecificity('/')
      expect(score).toBeGreaterThan(0)
    })

    it('should handle paths with trailing slashes', () => {
      const withSlash = calculateRouteSpecificity('/users/')
      const withoutSlash = calculateRouteSpecificity('/users')

      // Should score the same after normalization
      expect(withSlash).toBe(withoutSlash)
    })

    it('should score the NestJS example correctly', () => {
      // This is the exact example from the user
      const withAssets = calculateRouteSpecificity(
        '/organizations/:id/ledgers/with-assets'
      )
      const withParam = calculateRouteSpecificity(
        '/organizations/:id/ledgers/:ledgerId'
      )

      expect(withAssets).toBeGreaterThan(withParam)
    })
  })

  describe('sortRoutesBySpecificity', () => {
    const createRoute = (
      path: string,
      method: HttpMethods = HttpMethods.GET
    ): ModuleMetadata => ({
      path,
      method,
      methodName: 'test',
      controller: class {}
    })

    it('should sort static routes before parameter routes', () => {
      const routes = [
        createRoute('/users/:id'),
        createRoute('/users/active'),
        createRoute('/users/admin')
      ]

      const sorted = sortRoutesBySpecificity(routes)

      expect(sorted[0].path).toBe('/users/active')
      expect(sorted[1].path).toBe('/users/admin')
      expect(sorted[2].path).toBe('/users/:id')
    })

    it('should sort the NestJS example correctly', () => {
      const routes = [
        createRoute('/organizations/:id/ledgers/:ledgerId'),
        createRoute('/organizations/:id/ledgers/with-assets')
      ]

      const sorted = sortRoutesBySpecificity(routes)

      // More specific route (with-assets) should come first
      expect(sorted[0].path).toBe('/organizations/:id/ledgers/with-assets')
      expect(sorted[1].path).toBe('/organizations/:id/ledgers/:ledgerId')
    })

    it('should handle complex route ordering', () => {
      const routes = [
        createRoute('/api/:version/users/:id/posts/:postId'),
        createRoute('/api/v1/users/:id/posts/recent'),
        createRoute('/api/v1/users/active'),
        createRoute('/api/:version/users/:id'),
        createRoute('/api/v1/users/:id/posts'),
        createRoute('/api/*')
      ]

      const sorted = sortRoutesBySpecificity(routes)

      // Most specific to least specific
      expect(sorted[0].path).toBe('/api/v1/users/active')
      expect(sorted[1].path).toBe('/api/v1/users/:id/posts/recent')
      expect(sorted[2].path).toBe('/api/v1/users/:id/posts')
      expect(sorted[3].path).toBe('/api/:version/users/:id/posts/:postId')
      expect(sorted[4].path).toBe('/api/:version/users/:id')
      expect(sorted[5].path).toBe('/api/*')
    })

    it('should maintain relative order for routes with same specificity', () => {
      const routes = [
        createRoute('/users/:id', HttpMethods.GET),
        createRoute('/users/:userId', HttpMethods.POST),
        createRoute('/users/:name', HttpMethods.PUT)
      ]

      const sorted = sortRoutesBySpecificity(routes)

      // All have same specificity, order should be stable
      expect(sorted.map((r) => r.method)).toEqual([
        HttpMethods.GET,
        HttpMethods.POST,
        HttpMethods.PUT
      ])
    })

    it('should not mutate original array', () => {
      const routes = [createRoute('/users/:id'), createRoute('/users/active')]

      const original = [...routes]
      sortRoutesBySpecificity(routes)

      expect(routes).toEqual(original)
    })

    it('should handle empty array', () => {
      const sorted = sortRoutesBySpecificity([])
      expect(sorted).toEqual([])
    })

    it('should handle single route', () => {
      const routes = [createRoute('/users')]
      const sorted = sortRoutesBySpecificity(routes)

      expect(sorted).toEqual(routes)
    })

    it('should handle real-world API patterns', () => {
      const routes = [
        createRoute('/organizations/:id/users/:userId/permissions/:permId'),
        createRoute('/organizations/:id/users/:userId/permissions'),
        createRoute('/organizations/:id/users/invited'),
        createRoute('/organizations/:id/users/:userId'),
        createRoute('/organizations/:id/settings/billing'),
        createRoute('/organizations/:id/settings'),
        createRoute('/organizations/search'),
        createRoute('/organizations/:id')
      ]

      const sorted = sortRoutesBySpecificity(routes)

      // Verify most specific comes first (all static segments)
      expect(sorted[0].path).toBe('/organizations/search')

      // Verify routes with same specificity (2 static + 1 param) are grouped together
      // These two routes have identical specificity, so either order is valid
      const twoStaticOneParam = sorted.slice(1, 3).map((r) => r.path)
      expect(twoStaticOneParam).toContain('/organizations/:id/settings/billing')
      expect(twoStaticOneParam).toContain('/organizations/:id/users/invited')

      // Verify least specific come last
      expect(sorted[sorted.length - 1].path).toBe('/organizations/:id')
    })
  })
})
