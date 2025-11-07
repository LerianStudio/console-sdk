import { urlMatch } from './url-match'

describe('urlMatch', () => {
  describe('exact matches', () => {
    it('should match exact static routes', () => {
      expect(urlMatch('/users', '/users')).toBe(true)
      expect(urlMatch('/api/users', '/api/users')).toBe(true)
      expect(urlMatch('/users/profile', '/users/profile')).toBe(true)
    })

    it('should match root route', () => {
      expect(urlMatch('/', '/')).toBe(true)
    })

    it('should match routes with special characters', () => {
      expect(urlMatch('/users-list', '/users-list')).toBe(true)
      expect(urlMatch('/users_profile', '/users_profile')).toBe(true)
      expect(urlMatch('/users.json', '/users.json')).toBe(true)
    })

    it('should not match different static routes', () => {
      expect(urlMatch('/users', '/posts')).toBe(false)
      expect(urlMatch('/api/users', '/api/posts')).toBe(false)
      expect(urlMatch('/users/profile', '/users/settings')).toBe(false)
    })
  })

  describe('parameter routes', () => {
    it('should match routes with single parameter', () => {
      expect(urlMatch('/users/123', '/users/:id')).toBe(true)
      expect(urlMatch('/users/abc', '/users/:id')).toBe(true)
      expect(urlMatch('/users/user-123', '/users/:id')).toBe(true)
    })

    it('should match routes with multiple parameters', () => {
      expect(
        urlMatch('/users/123/posts/456', '/users/:userId/posts/:postId')
      ).toBe(true)
      expect(
        urlMatch(
          '/api/v1/users/abc/posts/def',
          '/api/v1/users/:userId/posts/:postId'
        )
      ).toBe(true)
    })

    it('should match routes with parameters at different positions', () => {
      expect(urlMatch('/123/users', '/:id/users')).toBe(true)
      expect(urlMatch('/api/123/users/456', '/api/:orgId/users/:userId')).toBe(
        true
      )
    })

    it('should not match routes with missing parameter segments', () => {
      expect(urlMatch('/users', '/users/:id')).toBe(false)
      expect(urlMatch('/users/', '/users/:id')).toBe(false)
    })

    it('should not match routes with extra segments', () => {
      expect(urlMatch('/users/123/extra', '/users/:id')).toBe(false)
      expect(
        urlMatch('/users/123/posts/456/extra', '/users/:userId/posts/:postId')
      ).toBe(false)
    })
  })

  describe('advanced parameter patterns', () => {
    it('should match routes with multiple parameters', () => {
      expect(
        urlMatch('/users/123/posts/456', '/users/:userId/posts/:postId')
      ).toBe(true)
      expect(
        urlMatch(
          '/api/v1/users/john/profile',
          '/api/:version/users/:name/profile'
        )
      ).toBe(true)
    })

    it('should not match routes with incorrect parameter count', () => {
      expect(urlMatch('/users/123', '/users/:userId/posts/:postId')).toBe(false)
      expect(urlMatch('/users/123/posts', '/users/:userId/posts/:postId')).toBe(
        false
      )
    })

    it('should handle complex parameter patterns', () => {
      expect(
        urlMatch(
          '/api/v1/users/123/posts/456/comments/789',
          '/api/:version/users/:userId/posts/:postId/comments/:commentId'
        )
      ).toBe(true)
      expect(
        urlMatch(
          '/files/documents/reports/2023',
          '/files/:category/:type/:year'
        )
      ).toBe(true)
    })
  })

  describe('flexible parameter patterns', () => {
    it('should match routes with named parameters', () => {
      expect(urlMatch('/api/v1', '/api/:version')).toBe(true)
      expect(urlMatch('/api/v2', '/api/:version')).toBe(true)
      expect(urlMatch('/api/beta', '/api/:version')).toBe(true)
    })

    it('should match routes with parameters in the middle', () => {
      expect(urlMatch('/api/v1/users', '/api/:version/users')).toBe(true)
      expect(urlMatch('/api/v2/users', '/api/:version/users')).toBe(true)
      expect(urlMatch('/api/beta/users', '/api/:version/users')).toBe(true)
    })

    it('should not match routes with incorrect structure', () => {
      expect(urlMatch('/different/path', '/api/:version')).toBe(false)
      expect(urlMatch('/users/123', '/api/:version')).toBe(false)
    })
  })

  describe('complex patterns', () => {
    it('should match routes with multiple consecutive parameters', () => {
      expect(
        urlMatch('/users/123/posts/456', '/users/:userId/posts/:postId')
      ).toBe(true)
      expect(urlMatch('/api/v1/users/john', '/api/:version/users/:name')).toBe(
        true
      )
    })

    it('should handle various parameter naming patterns', () => {
      expect(
        urlMatch(
          '/categories/tech/articles/ai',
          '/categories/:category/articles/:topic'
        )
      ).toBe(true)
      expect(
        urlMatch('/files/documents/report.pdf', '/files/:type/:filename')
      ).toBe(true)
    })

    it('should match complex nested patterns', () => {
      expect(
        urlMatch(
          '/api/v1/organizations/123/users/456',
          '/api/:version/organizations/:orgId/users/:userId'
        )
      ).toBe(true)
      expect(
        urlMatch(
          '/api/v2/organizations/abc/users/def',
          '/api/:version/organizations/:orgId/users/:userId'
        )
      ).toBe(true)
    })

    it('should handle long parameter chains', () => {
      expect(urlMatch('/a/b/c/d/e/f', '/a/:param1/c/:param2/e/:param3')).toBe(
        true
      )
      expect(
        urlMatch(
          '/api/v1/org/123/team/456/user/789',
          '/api/:version/org/:orgId/team/:teamId/user/:userId'
        )
      ).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      expect(urlMatch('', '')).toBe(true)
      expect(urlMatch('', '/')).toBe(false)
      expect(urlMatch('/', '')).toBe(true)
    })

    it('should handle routes with trailing slashes', () => {
      expect(urlMatch('/users/', '/users/')).toBe(true)
      expect(urlMatch('/users', '/users')).toBe(true)
    })

    it('should handle routes with query parameters in pathname', () => {
      expect(urlMatch('/users?name=john', '/users')).toBe(false)
      expect(urlMatch('/users/123?tab=profile', '/users/:id')).toBe(true)
    })

    it('should handle routes with hash fragments in pathname', () => {
      expect(urlMatch('/users#section', '/users')).toBe(false)
      expect(urlMatch('/users/123#profile', '/users/:id')).toBe(true)
    })

    it('should handle encoded characters in pathname', () => {
      expect(urlMatch('/users/john%20doe', '/users/:name')).toBe(true)
      expect(urlMatch('/users/test%2Buser', '/users/:name')).toBe(true)
    })

    it('should handle reasonably long paths', () => {
      const longPath =
        '/api/v1/organizations/123/teams/456/users/789/profile/settings'
      const longPattern =
        '/api/:version/organizations/:orgId/teams/:teamId/users/:userId/profile/:section'
      expect(urlMatch(longPath, longPattern)).toBe(true)
    })
  })

  describe('case sensitivity', () => {
    it('should handle parameter values as-is', () => {
      expect(urlMatch('/users/ABC', '/users/:id')).toBe(true)
      expect(urlMatch('/users/lowercase', '/users/:id')).toBe(true)
      expect(urlMatch('/users/123', '/users/:id')).toBe(true)
    })
  })

  describe('validated route patterns', () => {
    it('should match parameter routes correctly', () => {
      expect(urlMatch('/api/users', '/api/:resource')).toBe(true)
      expect(urlMatch('/api/posts', '/api/:resource')).toBe(true)
      expect(urlMatch('/files/document.pdf', '/files/:filename')).toBe(true)
    })

    it('should handle nested parameter routes', () => {
      expect(
        urlMatch(
          '/categories/tech/articles/123',
          '/categories/:category/articles/:id'
        )
      ).toBe(true)
      expect(
        urlMatch('/users/john/posts/456', '/users/:username/posts/:postId')
      ).toBe(true)
    })
  })

  describe('real-world API patterns', () => {
    it('should match typical REST API routes', () => {
      // GET /api/v1/users
      expect(urlMatch('/api/v1/users', '/api/v1/users')).toBe(true)

      // GET /api/v1/users/:id
      expect(urlMatch('/api/v1/users/123', '/api/v1/users/:id')).toBe(true)

      // GET /api/v1/users/:id/posts
      expect(
        urlMatch('/api/v1/users/123/posts', '/api/v1/users/:id/posts')
      ).toBe(true)

      // GET /api/v1/users/:id/posts/:postId
      expect(
        urlMatch(
          '/api/v1/users/123/posts/456',
          '/api/v1/users/:id/posts/:postId'
        )
      ).toBe(true)
    })

    it('should match nested resource routes', () => {
      expect(
        urlMatch(
          '/organizations/123/users/456/permissions',
          '/organizations/:orgId/users/:userId/permissions'
        )
      ).toBe(true)
      expect(
        urlMatch(
          '/projects/abc/tasks/def/comments/ghi',
          '/projects/:projectId/tasks/:taskId/comments/:commentId'
        )
      ).toBe(true)
    })

    it('should match file serving routes', () => {
      expect(urlMatch('/static/avatar.png', '/static/:filename')).toBe(true)
      expect(urlMatch('/uploads/report.pdf', '/uploads/:filename')).toBe(true)
    })

    it('should match versioned API routes', () => {
      expect(urlMatch('/api/v1/users', '/api/:version/users')).toBe(true)
      expect(urlMatch('/api/v2/users', '/api/:version/users')).toBe(true)
      expect(urlMatch('/api/beta/users', '/api/:version/users')).toBe(true)
    })
  })
})
