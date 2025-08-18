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
