# Sindarian Logs

A unified logging and tracing system for Sindarian Server applications. Every HTTP request produces one structured JSON log entry — all events within the request are aggregated and written together when the request completes.

## ✨ Features

- 📋 **Request-scoped aggregation** — all log events within a single request are collected and flushed as one structured entry
- 🔗 **Automatic trace IDs** — UUID trace IDs generated per request via `AsyncLocalStorage` for concurrent isolation
- 📈 **Level escalation** — final log level is the highest severity event in the request (`debug` < `info` < `audit` < `warn` < `error`)
- 🎯 **Decorator-based tracing** — use `@Traceable()` on class methods for automatic operation naming
- ⚡ **Non-class support** — use `withTrace()` for NextAuth callbacks, cron jobs, and other non-class code
- 🌐 **HTTP service logging** — built-in `@LogHttpCall()` decorator and `LoggableHttpService` base class
- 🔧 **Zero configuration** — import `LoggerModule` and start logging

## 🚀 Quick start

### Installation

```bash
npm install @lerianstudio/sindarian-logs pino
```

Peer dependencies:

```bash
npm install @lerianstudio/sindarian-server inversify next reflect-metadata
```

For pretty-printed logs in development (optional):

```bash
npm install -D pino-pretty
```

### Module setup

Register `LoggerModule` in your application module. This auto-registers all logging providers (`RequestIdRepository`, `LoggerRepository`, `LoggerAggregator`, and `TraceMiddleware`).

```typescript
// app.module.ts
import { Module } from '@lerianstudio/sindarian-server'
import { LoggerModule } from '@lerianstudio/sindarian-logs'
import { UserController } from './controllers/user.controller'

@Module({
  imports: [LoggerModule],
  controllers: [UserController]
})
export class AppModule {}
```

That's it. The `TraceMiddleware` generates a trace ID for each request, wraps the request in a logging context, and flushes all aggregated events when the request completes.

## 📖 Usage

### Logging in handlers

Inject `LoggerAggregator` into your controllers and services. Call `.info()`, `.error()`, `.warn()`, `.debug()`, or `.audit()` to record events.

```typescript
// user.controller.ts
import { Controller, Post, Body, Inject } from '@lerianstudio/sindarian-server'
import { LoggerAggregator } from '@lerianstudio/sindarian-logs'

@Controller('/users')
export class UserController {
  constructor(@Inject(LoggerAggregator) private logger: LoggerAggregator) {}

  @Post()
  async create(@Body() body: any) {
    this.logger.info('UserController.create', 'Creating user', {
      email: body.email,
      name: body.name
    })

    // ... business logic ...

    this.logger.info('UserController.create', 'User created', { userId: '123' })
    return { id: '123' }
  }
}
```

All `.info()` and `.error()` calls within the same request are collected. When the request finishes, a single aggregated log is written with every event, the highest severity level, duration, and trace ID.

### Using `@Traceable()` on class methods

The `@Traceable()` decorator wraps a method with automatic tracing. The operation name is derived as `ClassName.methodName`.

```typescript
import { Traceable } from '@lerianstudio/sindarian-logs'

export class UserService {
  @Traceable()
  async create(data: CreateUserDto) {
    // Automatically traced as "UserService.create"
    // If called outside a request context, a root context is created automatically
    return this.repository.save(data)
  }
}
```

Use `@Traceable()` when you want tracing without manually passing operation names. It works both inside request contexts (events are aggregated) and outside them (a standalone context is created).

### Using `withTrace()` for non-class code

For functions that live outside classes — NextAuth callbacks, cron jobs, standalone utilities — use `withTrace()`.

```typescript
import { withTrace, LoggerAggregator } from '@lerianstudio/sindarian-logs'

// In a NextAuth callback
async function handleSignIn(user: User, logger: LoggerAggregator) {
  return withTrace(logger, 'auth.signIn', async () => {
    logger.info('auth.signIn', 'User signing in', { userId: user.id })
    // ... authentication logic
    logger.info('auth.signIn', 'Sign-in complete')
    return true
  })
}
```

### HTTP service logging

Extend `LoggableHttpService` to get automatic before/after logging on HTTP calls, or use the `@LogHttpCall()` decorator on individual methods.

```typescript
import { LoggableHttpService } from '@lerianstudio/sindarian-logs'

export class ExternalApiService extends LoggableHttpService {
  async fetchUsers() {
    // HTTP calls are automatically logged with request/response details
    return this.get('/api/users')
  }
}
```

## ⚙️ Configuration

| Environment variable | Effect |
| --- | --- |
| `ENABLE_DEBUG=true` | Includes debug-level events in the aggregated output |
| `NODE_ENV=development` | Enables `pino-pretty` formatted output for readability |
| `NODE_ENV=test` | Disables `@Traceable()` decorator to avoid noise in tests |

## 📋 Output format

Each request produces a single structured JSON log entry:

```json
{
  "level": "info",
  "method": "POST",
  "path": "/api/users",
  "statusCode": 201,
  "duration": 0.125,
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "handler": "UserController.create",
  "events": [
    {
      "timestamp": "2025-02-15T10:30:45.123Z",
      "operation": "UserService.create",
      "message": "User created successfully",
      "level": "INFO",
      "context": { "userId": "123" }
    }
  ]
}
```

Key characteristics of the output:

- **One entry per request** — no matter how many `.info()`, `.error()`, or `.warn()` calls happen, the result is a single log line
- **Level escalation** — the top-level `level` reflects the highest severity event in the request
- **Transformed events** — timestamps are ISO strings, levels are uppercase
- **Trace ID** — a UUID that ties all events to the same request, useful for filtering in log aggregation tools

## 📦 Exports

| Export | Description |
| --- | --- |
| `LoggerModule` | Sindarian `@Module` that auto-registers all providers |
| `LoggerAggregator` | Core service with `.info()`, `.error()`, `.warn()`, `.debug()`, `.audit()`, `.runWithContext()`, `.setResponseMetadata()`, `.hasContext()` |
| `@Traceable(options?)` | Method decorator — auto-derives operation name as `ClassName.methodName` |
| `@LogHttpCall()` | Method decorator for HTTP service hooks |
| `withTrace(logger, name, fn)` | Wraps non-class functions with tracing |
| `LoggableHttpService` | Base class extending sindarian-server's `HttpService` with auto-logging |
| `RequestIdRepository` | Trace ID management (`.generate()`, `.get()`, `.runWith()`) |
| `TraceMiddleware` | Middleware that generates trace IDs and wraps requests in context |

### Types

| Type | Description |
| --- | --- |
| `LogLevel` | Severity levels: `debug`, `info`, `audit`, `warn`, `error` |
| `LogEvent` | Individual log event within a request |
| `AggregatedLog` | Final structured output written via Pino |
| `TransformedEvent` | Event after transformation (ISO timestamps, uppercase levels) |
| `RequestContext` | Request-scoped context holding aggregated events |

## 🔗 How it works

1. **Request arrives** — `TraceMiddleware` generates a UUID trace ID and creates a `RequestContext` via `AsyncLocalStorage`
2. **Code executes** — your `.info()`, `.error()`, `.warn()`, `.debug()`, and `.audit()` calls push `LogEvent` entries into the context
3. **Request completes** — the context is finalized, events are transformed, and a single `AggregatedLog` is written through Pino
4. **Level is escalated** — the final log level is the highest severity event recorded during the request

## 📄 License

ISC
