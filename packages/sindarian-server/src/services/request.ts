import { Container } from '@/dependency-injection/container'
import { NextRequest } from 'next/server'

export const REQUEST = Symbol('REQUEST')

// Global reference to the current request (for the current request lifecycle)
let currentRequest: NextRequest | null = null

export function bindRequest(container: Container, request: NextRequest) {
  // Store the current request globally for this request lifecycle
  currentRequest = request

  // Check if REQUEST is already bound and rebind it
  if (container.isBound(REQUEST)) {
    container.unbind(REQUEST)
  }

  // Bind the current request as a constant value
  container.bind(REQUEST).toConstantValue(request)
}

export function getRequest(container?: Container): NextRequest {
  if (container && container.isBound(REQUEST)) {
    return container.get<NextRequest>(REQUEST)
  }

  if (currentRequest) {
    return currentRequest
  }

  throw new Error(
    'Request is not available. Make sure bindRequest is called before accessing the request.'
  )
}

export function getCurrentRequest(): NextRequest | null {
  return currentRequest
}
