export type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'audit'

export type LogEvent = {
  timestamp: number
  operation?: string
  message: string
  level?: LogLevel
  context?: Record<string, any>
  error?: Error
}

export type AggregatedLog = {
  level: LogLevel
  method: string
  path: string
  statusCode?: number
  duration: number
  traceId?: string
  handler?: string
  events: TransformedEvent[]
}

export type TransformedEvent = {
  timestamp: string
  operation?: string
  message: string
  level?: string
  context?: Record<string, any>
  error?: string
}

export type RequestContext = {
  startTime: number
  path: string
  method: string
  metadata: Record<string, any>
  events: LogEvent[]
  statusCode?: number
  responseSize?: number
}
