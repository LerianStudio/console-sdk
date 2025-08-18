import { urlJoin } from './url-join'

describe('urlJoin', () => {
  describe('basic functionality', () => {
    it('should join simple path segments', () => {
      expect(urlJoin('api', 'users', 'profile')).toBe('/api/users/profile')
    })

    it('should join two path segments', () => {
      expect(urlJoin('api', 'users')).toBe('/api/users')
    })

    it('should handle single path segment', () => {
      expect(urlJoin('api')).toBe('/api')
    })

    it('should join multiple path segments', () => {
      expect(urlJoin('api', 'v1', 'users', 'profile', 'settings')).toBe(
        '/api/v1/users/profile/settings'
      )
    })
  })

  describe('handling leading slashes', () => {
    it('should remove leading slashes from all segments', () => {
      expect(urlJoin('/api', '/users', '/profile')).toBe('/api/users/profile')
    })

    it('should handle mixed segments with and without leading slashes', () => {
      expect(urlJoin('/api', 'users', '/profile')).toBe('/api/users/profile')
    })

    it('should handle single segment with leading slash', () => {
      expect(urlJoin('/api')).toBe('/api')
    })
  })

  describe('handling trailing slashes', () => {
    it('should remove trailing slashes from all segments', () => {
      expect(urlJoin('api/', 'users/', 'profile/')).toBe('/api/users/profile')
    })

    it('should handle mixed segments with and without trailing slashes', () => {
      expect(urlJoin('api/', 'users', 'profile/')).toBe('/api/users/profile')
    })

    it('should handle single segment with trailing slash', () => {
      expect(urlJoin('api/')).toBe('/api')
    })
  })

  describe('handling both leading and trailing slashes', () => {
    it('should remove both leading and trailing slashes from all segments', () => {
      expect(urlJoin('/api/', '/users/', '/profile/')).toBe(
        '/api/users/profile'
      )
    })

    it('should handle mixed segments with various slash combinations', () => {
      expect(urlJoin('/api', 'users/', '/profile', 'settings/')).toBe(
        '/api/users/profile/settings'
      )
    })

    it('should handle single segment with both leading and trailing slashes', () => {
      expect(urlJoin('/api/')).toBe('/api')
    })
  })

  describe('edge cases', () => {
    it('should handle no arguments', () => {
      expect(urlJoin()).toBe('/')
    })

    it('should handle empty string arguments', () => {
      expect(urlJoin('', 'api', '', 'users')).toBe('/api/users')
    })

    it('should handle only empty strings', () => {
      expect(urlJoin('', '', '')).toBe('/')
    })

    it('should handle single empty string', () => {
      expect(urlJoin('')).toBe('/')
    })

    it('should handle segments with only slashes', () => {
      expect(urlJoin('/', '//', '///')).toBe('/')
    })
  })

  describe('special characters and complex scenarios', () => {
    it('should preserve internal slashes within segments', () => {
      expect(urlJoin('api//users', 'profile')).toBe('/api//users/profile')
    })

    it('should handle segments with special characters', () => {
      expect(urlJoin('api', 'users-list', 'user_profile')).toBe(
        '/api/users-list/user_profile'
      )
    })

    it('should handle segments with numbers', () => {
      expect(urlJoin('api', 'v1', 'users', '123', 'profile')).toBe(
        '/api/v1/users/123/profile'
      )
    })

    it('should handle segments with dots', () => {
      expect(urlJoin('api', 'users.json', 'profile.xml')).toBe(
        '/api/users.json/profile.xml'
      )
    })

    it('should handle very long paths', () => {
      const segments = Array.from({ length: 10 }, (_, i) => `segment${i}`)
      const expected = '/' + segments.join('/')
      expect(urlJoin(...segments)).toBe(expected)
    })
  })

  describe('real-world scenarios', () => {
    it('should handle typical API paths', () => {
      expect(urlJoin('/api/v1/', '/users/', '/123/')).toBe('/api/v1/users/123')
    })

    it('should handle nested resource paths', () => {
      expect(
        urlJoin('organizations', '456', 'users', '123', 'permissions')
      ).toBe('/organizations/456/users/123/permissions')
    })

    it('should handle file paths', () => {
      expect(urlJoin('/static/', '/images/', '/avatar.png')).toBe(
        '/static/images/avatar.png'
      )
    })

    it('should handle query-like paths', () => {
      expect(urlJoin('search', 'users', 'filter')).toBe('/search/users/filter')
    })
  })
})
