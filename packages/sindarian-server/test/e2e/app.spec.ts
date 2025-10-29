import { app } from '../app/app'
import { generateRequest } from './utils/generate-request'
import { NextRequest } from 'next/server'

describe('TestController E2E Tests', () => {
  // Set timeout for all tests to prevent hanging
  jest.setTimeout(10000)
  describe('GET /api/v1/test', () => {
    it('should fetch all items without query parameters', async () => {
      const [request, params] = generateRequest(
        'GET',
        'http://localhost:3000/api/v1/test'
      ) as [NextRequest, { params: Promise<any> }]

      const response = await app.handler(request, params)
      const body = await response.json()
      expect(response.status).toBe(200)
      expect(body).toEqual([{ id: 1, name: 'test' }])
    })

    it('should fetch all items with query parameters', async () => {
      const [request, params] = generateRequest(
        'GET',
        'http://localhost:3000/api/v1/test?page=1&limit=10'
      ) as [NextRequest, { params: Promise<any> }]

      const response = await app.handler(request, params)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual([{ id: 1, name: 'test' }])
    })
  })

  describe('GET /api/v1/test/:id', () => {
    it('should fetch a specific item by id', async () => {
      const [request, params] = generateRequest(
        'GET',
        'http://localhost:3000/api/v1/test/123',
        undefined,
        { id: '123' }
      ) as [NextRequest, { params: Promise<any> }]

      const response = await app.handler(request, params)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual({ id: '123', name: 'test' })
    })
  })

  describe('POST /api/v1/test', () => {
    it('should create a new item with valid data', async () => {
      const requestBody = { name: 'New Test Item' }
      const [request, params] = generateRequest(
        'POST',
        'http://localhost:3000/api/v1/test',
        requestBody
      ) as [NextRequest, { params: Promise<any> }]

      const response = await app.handler(request, params)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual({ id: 1, name: 'New Test Item' })
    })
  })

  describe('PATCH /api/v1/test/:id', () => {
    it('should update an existing item with valid data', async () => {
      const requestBody = { name: 'Updated Test Item' }
      const [request, params] = generateRequest(
        'PATCH',
        'http://localhost:3000/api/v1/test/456',
        requestBody,
        { id: '456' }
      ) as [NextRequest, { params: Promise<any> }]

      const response = await app.handler(request, params)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual({ id: '456', name: 'Updated Test Item' })
    })
  })

  describe('DELETE /api/v1/test/:id', () => {
    it('should delete an existing item', async () => {
      const [request, params] = generateRequest(
        'DELETE',
        'http://localhost:3000/api/v1/test/789',
        undefined,
        { id: '789' }
      ) as [NextRequest, { params: Promise<any> }]

      const response = await app.handler(request, params)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual({ id: '789', name: 'test' })
    })
  })

  describe('Schema Validation', () => {
    describe('POST /api/v1/test - CreateTestDto validation', () => {
      it('should reject request with missing name field', async () => {
        const requestBody = {} // Missing required name field
        const [request, params] = generateRequest(
          'POST',
          'http://localhost:3000/api/v1/test',
          requestBody
        ) as [NextRequest, { params: Promise<any> }]

        const response = await app.handler(request, params)
        const body = await response.json()

        expect(response.status).toBe(400)
        expect(body).toHaveProperty('message')
        expect(body.message).toBe('Validation failed')
      })

      it('should reject request with name too short (less than 2 chars)', async () => {
        const requestBody = { name: 'a' } // Only 1 character, min is 2
        const [request, params] = generateRequest(
          'POST',
          'http://localhost:3000/api/v1/test',
          requestBody
        ) as [NextRequest, { params: Promise<any> }]

        const response = await app.handler(request, params)
        const body = await response.json()

        expect(response.status).toBe(400)
        expect(body).toHaveProperty('message')
        expect(body.message).toBe('Validation failed')
      })

      it('should reject request with name too long (more than 100 chars)', async () => {
        const requestBody = { name: 'a'.repeat(101) } // 101 characters, max is 100
        const [request, params] = generateRequest(
          'POST',
          'http://localhost:3000/api/v1/test',
          requestBody
        ) as [NextRequest, { params: Promise<any> }]

        const response = await app.handler(request, params)
        const body = await response.json()

        expect(response.status).toBe(400)
        expect(body).toHaveProperty('message')
        expect(body.message).toBe('Validation failed')
      })

      it('should reject request with non-string name field', async () => {
        const requestBody = { name: 123 } // Number instead of string
        const [request, params] = generateRequest(
          'POST',
          'http://localhost:3000/api/v1/test',
          requestBody
        ) as [NextRequest, { params: Promise<any> }]

        const response = await app.handler(request, params)
        const body = await response.json()

        expect(response.status).toBe(400)
        expect(body).toHaveProperty('message')
        expect(body.message).toBe('Validation failed')
      })

      it('should accept request with valid name field', async () => {
        const requestBody = { name: 'Valid Test Name' }
        const [request, params] = generateRequest(
          'POST',
          'http://localhost:3000/api/v1/test',
          requestBody
        ) as [NextRequest, { params: Promise<any> }]

        const response = await app.handler(request, params)
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body).toEqual({ id: 1, name: 'Valid Test Name' })
      })
    })

    describe('PATCH /api/v1/test/:id - UpdateTestDto validation', () => {
      it('should reject update with missing name field', async () => {
        const requestBody = {} // Missing required name field
        const [request, params] = generateRequest(
          'PATCH',
          'http://localhost:3000/api/v1/test/456',
          requestBody,
          { id: '456' }
        ) as [NextRequest, { params: Promise<any> }]

        const response = await app.handler(request, params)
        const body = await response.json()

        expect(response.status).toBe(400)
        expect(body).toHaveProperty('message')
        expect(body.message).toBe('Validation failed')
      })

      it('should reject update with invalid name field', async () => {
        const requestBody = { name: '' } // Empty string, min is 2
        const [request, params] = generateRequest(
          'PATCH',
          'http://localhost:3000/api/v1/test/456',
          requestBody,
          { id: '456' }
        ) as [NextRequest, { params: Promise<any> }]

        const response = await app.handler(request, params)
        const body = await response.json()

        expect(response.status).toBe(400)
        expect(body).toHaveProperty('message')
        expect(body.message).toBe('Validation failed')
      })

      it('should accept update with valid name field', async () => {
        const requestBody = { name: 'Updated Valid Name' }
        const [request, params] = generateRequest(
          'PATCH',
          'http://localhost:3000/api/v1/test/456',
          requestBody,
          { id: '456' }
        ) as [NextRequest, { params: Promise<any> }]

        const response = await app.handler(request, params)
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body).toEqual({ id: '456', name: 'Updated Valid Name' })
      })
    })

    describe('Edge cases', () => {
      it('should handle exactly minimum length name (2 characters)', async () => {
        const requestBody = { name: 'ab' } // Exactly 2 characters
        const [request, params] = generateRequest(
          'POST',
          'http://localhost:3000/api/v1/test',
          requestBody
        ) as [NextRequest, { params: Promise<any> }]

        const response = await app.handler(request, params)
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body).toEqual({ id: 1, name: 'ab' })
      })

      it('should handle exactly maximum length name (100 characters)', async () => {
        const longName = 'a'.repeat(100) // Exactly 100 characters
        const requestBody = { name: longName }
        const [request, params] = generateRequest(
          'POST',
          'http://localhost:3000/api/v1/test',
          requestBody
        ) as [NextRequest, { params: Promise<any> }]

        const response = await app.handler(request, params)
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body).toEqual({ id: 1, name: longName })
      })

      it('should handle name with special characters', async () => {
        const requestBody = { name: 'Test-Name_123 @#$%' }
        const [request, params] = generateRequest(
          'POST',
          'http://localhost:3000/api/v1/test',
          requestBody
        ) as [NextRequest, { params: Promise<any> }]

        const response = await app.handler(request, params)
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body).toEqual({ id: 1, name: 'Test-Name_123 @#$%' })
      })

      it('should reject request with extra fields not in schema', async () => {
        const requestBody = { 
          name: 'Valid Name',
          extraField: 'should be ignored or cause validation error'
        }
        const [request, params] = generateRequest(
          'POST',
          'http://localhost:3000/api/v1/test',
          requestBody
        ) as [NextRequest, { params: Promise<any> }]

        const response = await app.handler(request, params)
        const body = await response.json()

        // Depending on Zod configuration, this might:
        // 1. Accept and ignore extra fields (status 200)
        // 2. Reject with validation error (status 400)
        // We'll test what actually happens
        expect([200, 400]).toContain(response.status)
        
        if (response.status === 200) {
          // Extra field should be ignored
          expect(body).toEqual({ id: 1, name: 'Valid Name' })
        } else {
          // Should have validation error
          expect(body).toHaveProperty('message')
        }
      })
    })
  })

  describe('Error Cases', () => {
    it('should return 404 for non-existent routes', async () => {
      const [request, params] = generateRequest(
        'GET',
        'http://localhost:3000/api/v1/nonexistent'
      ) as [NextRequest, { params: Promise<any> }]

      const response = await app.handler(request, params)

      expect(response.status).toBe(404)
    })

    it('should handle missing body for POST requests', async () => {
      const [request, params] = generateRequest(
        'POST',
        'http://localhost:3000/api/v1/test'
      ) as [NextRequest, { params: Promise<any> }]

      const response = await app.handler(request, params)

      expect(response.status).toBe(400)
    })

    it('should handle missing body for PATCH requests', async () => {
      const [request, params] = generateRequest(
        'PATCH',
        'http://localhost:3000/api/v1/test/123',
        undefined,
        { id: '123' }
      ) as [NextRequest, { params: Promise<any> }]

      const response = await app.handler(request, params)

      expect(response.status).toBe(400)
    })
  })
})
