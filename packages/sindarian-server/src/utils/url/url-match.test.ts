import { urlMatch } from './url-match'

describe('urlMatch', () => {
  describe('exact matches', () => {
    it('should match exact static routes', () => {
      expect(urlMatch('/users', '/users').matched).toBe(true)
      expect(urlMatch('/api/users', '/api/users').matched).toBe(true)
      expect(urlMatch('/users/profile', '/users/profile').matched).toBe(true)
    })

    it('should match root route', () => {
      expect(urlMatch('/', '/').matched).toBe(true)
    })

    it('should match routes with special characters', () => {
      expect(urlMatch('/users-list', '/users-list').matched).toBe(true)
      expect(urlMatch('/users_profile', '/users_profile').matched).toBe(true)
      expect(urlMatch('/users.json', '/users.json').matched).toBe(true)
    })

    it('should not match different static routes', () => {
      expect(urlMatch('/users', '/posts').matched).toBe(false)
      expect(urlMatch('/api/users', '/api/posts').matched).toBe(false)
      expect(urlMatch('/users/profile', '/users/settings').matched).toBe(false)
    })
  })

  describe('parameter routes', () => {
    it('should match routes with single parameter', () => {
      expect(urlMatch('/users/123', '/users/:id').matched).toBe(true)
      expect(urlMatch('/users/abc', '/users/:id').matched).toBe(true)
      expect(urlMatch('/users/user-123', '/users/:id').matched).toBe(true)
    })

    it('should match routes with multiple parameters', () => {
      expect(
        urlMatch('/users/123/posts/456', '/users/:userId/posts/:postId').matched
      ).toBe(true)
      expect(
        urlMatch(
          '/api/v1/users/abc/posts/def',
          '/api/v1/users/:userId/posts/:postId'
        ).matched
      ).toBe(true)
    })

    it('should match routes with parameters at different positions', () => {
      expect(urlMatch('/123/users', '/:id/users').matched).toBe(true)
      expect(
        urlMatch('/api/123/users/456', '/api/:orgId/users/:userId').matched
      ).toBe(true)
    })

    it('should not match routes with missing parameter segments', () => {
      expect(urlMatch('/users', '/users/:id').matched).toBe(false)
      expect(urlMatch('/users/', '/users/:id').matched).toBe(false)
    })

    it('should not match routes with extra segments', () => {
      expect(urlMatch('/users/123/extra', '/users/:id').matched).toBe(false)
      expect(
        urlMatch('/users/123/posts/456/extra', '/users/:userId/posts/:postId')
          .matched
      ).toBe(false)
    })
  })

  describe('advanced parameter patterns', () => {
    it('should match routes with multiple parameters', () => {
      expect(
        urlMatch('/users/123/posts/456', '/users/:userId/posts/:postId').matched
      ).toBe(true)
      expect(
        urlMatch(
          '/api/v1/users/john/profile',
          '/api/:version/users/:name/profile'
        ).matched
      ).toBe(true)
    })

    it('should not match routes with incorrect parameter count', () => {
      expect(
        urlMatch('/users/123', '/users/:userId/posts/:postId').matched
      ).toBe(false)
      expect(
        urlMatch('/users/123/posts', '/users/:userId/posts/:postId').matched
      ).toBe(false)
    })

    it('should handle complex parameter patterns', () => {
      expect(
        urlMatch(
          '/api/v1/users/123/posts/456/comments/789',
          '/api/:version/users/:userId/posts/:postId/comments/:commentId'
        ).matched
      ).toBe(true)
      expect(
        urlMatch(
          '/files/documents/reports/2023',
          '/files/:category/:type/:year'
        ).matched
      ).toBe(true)
    })
  })

  describe('flexible parameter patterns', () => {
    it('should match routes with named parameters', () => {
      expect(urlMatch('/api/v1', '/api/:version').matched).toBe(true)
      expect(urlMatch('/api/v2', '/api/:version').matched).toBe(true)
      expect(urlMatch('/api/beta', '/api/:version').matched).toBe(true)
    })

    it('should match routes with parameters in the middle', () => {
      expect(urlMatch('/api/v1/users', '/api/:version/users').matched).toBe(
        true
      )
      expect(urlMatch('/api/v2/users', '/api/:version/users').matched).toBe(
        true
      )
      expect(urlMatch('/api/beta/users', '/api/:version/users').matched).toBe(
        true
      )
    })

    it('should not match routes with incorrect structure', () => {
      expect(urlMatch('/different/path', '/api/:version').matched).toBe(false)
      expect(urlMatch('/users/123', '/api/:version').matched).toBe(false)
    })
  })

  describe('complex patterns', () => {
    it('should match routes with multiple consecutive parameters', () => {
      expect(
        urlMatch('/users/123/posts/456', '/users/:userId/posts/:postId').matched
      ).toBe(true)
      expect(
        urlMatch('/api/v1/users/john', '/api/:version/users/:name').matched
      ).toBe(true)
    })

    it('should handle various parameter naming patterns', () => {
      expect(
        urlMatch(
          '/categories/tech/articles/ai',
          '/categories/:category/articles/:topic'
        ).matched
      ).toBe(true)
      expect(
        urlMatch('/files/documents/report.pdf', '/files/:type/:filename')
          .matched
      ).toBe(true)
    })

    it('should match complex nested patterns', () => {
      expect(
        urlMatch(
          '/api/v1/organizations/123/users/456',
          '/api/:version/organizations/:orgId/users/:userId'
        ).matched
      ).toBe(true)
      expect(
        urlMatch(
          '/api/v2/organizations/abc/users/def',
          '/api/:version/organizations/:orgId/users/:userId'
        ).matched
      ).toBe(true)
    })

    it('should handle long parameter chains', () => {
      expect(
        urlMatch('/a/b/c/d/e/f', '/a/:param1/c/:param2/e/:param3').matched
      ).toBe(true)
      expect(
        urlMatch(
          '/api/v1/org/123/team/456/user/789',
          '/api/:version/org/:orgId/team/:teamId/user/:userId'
        ).matched
      ).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      expect(urlMatch('', '').matched).toBe(true)
      expect(urlMatch('', '/').matched).toBe(false)
      expect(urlMatch('/', '').matched).toBe(true)
    })

    it('should handle routes with trailing slashes', () => {
      expect(urlMatch('/users/', '/users/').matched).toBe(true)
      expect(urlMatch('/users', '/users').matched).toBe(true)
      // Should match with or without trailing slash (Next.js trailingSlash support)
      expect(urlMatch('/users/', '/users').matched).toBe(true)
      expect(urlMatch('/users', '/users/').matched).toBe(true)
      expect(urlMatch('/organizations/', '/organizations').matched).toBe(true)
      expect(urlMatch('/api/users/', '/api/users').matched).toBe(true)
    })

    it('should handle routes with query parameters in pathname', () => {
      expect(urlMatch('/users?name=john', '/users').matched).toBe(false)
      expect(urlMatch('/users/123?tab=profile', '/users/:id').matched).toBe(
        true
      )
    })

    it('should handle routes with hash fragments in pathname', () => {
      expect(urlMatch('/users#section', '/users').matched).toBe(false)
      expect(urlMatch('/users/123#profile', '/users/:id').matched).toBe(true)
    })

    it('should handle encoded characters in pathname', () => {
      expect(urlMatch('/users/john%20doe', '/users/:name').matched).toBe(true)
      expect(urlMatch('/users/test%2Buser', '/users/:name').matched).toBe(true)
    })

    it('should handle reasonably long paths', () => {
      const longPath =
        '/api/v1/organizations/123/teams/456/users/789/profile/settings'
      const longPattern =
        '/api/:version/organizations/:orgId/teams/:teamId/users/:userId/profile/:section'
      expect(urlMatch(longPath, longPattern).matched).toBe(true)
    })
  })

  describe('case sensitivity', () => {
    it('should handle parameter values as-is', () => {
      expect(urlMatch('/users/ABC', '/users/:id').matched).toBe(true)
      expect(urlMatch('/users/lowercase', '/users/:id').matched).toBe(true)
      expect(urlMatch('/users/123', '/users/:id').matched).toBe(true)
    })
  })

  describe('validated route patterns', () => {
    it('should match parameter routes correctly', () => {
      expect(urlMatch('/api/users', '/api/:resource').matched).toBe(true)
      expect(urlMatch('/api/posts', '/api/:resource').matched).toBe(true)
      expect(urlMatch('/files/document.pdf', '/files/:filename').matched).toBe(
        true
      )
    })

    it('should handle nested parameter routes', () => {
      expect(
        urlMatch(
          '/categories/tech/articles/123',
          '/categories/:category/articles/:id'
        ).matched
      ).toBe(true)
      expect(
        urlMatch('/users/john/posts/456', '/users/:username/posts/:postId')
          .matched
      ).toBe(true)
    })
  })

  describe('real-world API patterns', () => {
    it('should match typical REST API routes', () => {
      // GET /api/v1/users
      expect(urlMatch('/api/v1/users', '/api/v1/users').matched).toBe(true)

      // GET /api/v1/users/:id
      expect(urlMatch('/api/v1/users/123', '/api/v1/users/:id').matched).toBe(
        true
      )

      // GET /api/v1/users/:id/posts
      expect(
        urlMatch('/api/v1/users/123/posts', '/api/v1/users/:id/posts').matched
      ).toBe(true)

      // GET /api/v1/users/:id/posts/:postId
      expect(
        urlMatch(
          '/api/v1/users/123/posts/456',
          '/api/v1/users/:id/posts/:postId'
        ).matched
      ).toBe(true)
    })

    it('should match nested resource routes', () => {
      expect(
        urlMatch(
          '/organizations/123/users/456/permissions',
          '/organizations/:orgId/users/:userId/permissions'
        ).matched
      ).toBe(true)
      expect(
        urlMatch(
          '/projects/abc/tasks/def/comments/ghi',
          '/projects/:projectId/tasks/:taskId/comments/:commentId'
        ).matched
      ).toBe(true)
    })

    it('should match file serving routes', () => {
      expect(urlMatch('/static/avatar.png', '/static/:filename').matched).toBe(
        true
      )
      expect(
        urlMatch('/uploads/report.pdf', '/uploads/:filename').matched
      ).toBe(true)
    })

    it('should match versioned API routes', () => {
      expect(urlMatch('/api/v1/users', '/api/:version/users').matched).toBe(
        true
      )
      expect(urlMatch('/api/v2/users', '/api/:version/users').matched).toBe(
        true
      )
      expect(urlMatch('/api/beta/users', '/api/:version/users').matched).toBe(
        true
      )
    })
  })
  describe('captures', () => {
    it('should return the captures of a multi-parameter route', () => {
      expect(
        urlMatch('/users/123/posts/456', '/users/:userId/posts/:postId')
      ).toEqual({ matched: true, params: { userId: '123', postId: '456' } })
    })

    it('should return the captures of a nested resource route', () => {
      expect(
        urlMatch(
          '/organizations/org_1/ledgers/led_2/accounts',
          '/organizations/:id/ledgers/:ledgerId/accounts'
        ).params
      ).toEqual({ id: 'org_1', ledgerId: 'led_2' })
    })

    it('should return an empty params object for a static route', () => {
      expect(urlMatch('/api/users', '/api/users')).toEqual({
        matched: true,
        params: {}
      })
    })

    it('should return no captures when the route does not match', () => {
      expect(urlMatch('/users/123', '/posts/:id')).toEqual({
        matched: false,
        params: {}
      })
    })

    it('should decode percent-encoded captures', () => {
      expect(urlMatch('/users/john%20doe', '/users/:name').params).toEqual({
        name: 'john doe'
      })
      expect(urlMatch('/users/test%2Buser', '/users/:name').params).toEqual({
        name: 'test+user'
      })
    })

    it('should keep a malformed percent escape raw instead of throwing', () => {
      expect(urlMatch('/users/%ZZ', '/users/:id')).toEqual({
        matched: true,
        params: { id: '%ZZ' }
      })
    })

    it('should join a wildcard capture into a single string', () => {
      expect(urlMatch('/files/a/b/c', '/files/*rest').params).toEqual({
        rest: 'a/b/c'
      })
    })

    it('should return a plain object rather than a null-prototype one', () => {
      const { params } = urlMatch('/users/123', '/users/:id')

      expect(Object.getPrototypeOf(params)).toBe(Object.prototype)
    })
  })
})
