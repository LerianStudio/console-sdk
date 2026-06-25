## Sindarian Logs

Request-scoped log aggregation for sindarian-server. One structured log entry per HTTP request with automatic trace IDs via AsyncLocalStorage.

### Architecture

- `TraceMiddleware` creates request context via `AsyncLocalStorage`
- `LoggerAggregator` collects events during request lifecycle
- `@Traceable()` decorator adds method-level events to current context
- On completion: events aggregated, level escalated to highest severity, flushed via Pino

### Public API

**Decorators:**
- `@Traceable(options?)` — Method decorator. Auto-derives operation as `ClassName.methodName`. Creates or joins request context.
- `@LogHttpCall()` — For HTTP service hooks (`onBeforeFetch`, `onAfterFetch`, `catch`)

**Functions:**
- `withTrace(logger, name, fn)` — For non-class code (NextAuth callbacks, cron jobs, queue handlers)

**Services:**
- `LoggableHttpService` — Extends sindarian-server's `HttpService` with automatic HTTP call logging
- `LoggerModule` — DI module providing all logging services + `TraceMiddleware` as `APP_MIDDLEWARE`

### Key Patterns

- Level escalation: final log level = highest severity event (`error > warn > audit > info > debug`)
- Events capped at 1000 per request context
- Debug events only recorded when `ENABLE_DEBUG=true`
- `@Traceable()` disabled in `NODE_ENV=test`
- `RequestIdRepository` generates UUID trace IDs via `AsyncLocalStorage`

### Integration

Peer dependency on `@lerianstudio/sindarian-server`. Add `LoggerModule` to your app:

```typescript
@Module({ imports: [LoggerModule], ... })
class AppModule {}
```

### Testing

- Mock `LoggerAggregator`: `jest.Mocked<Pick<LoggerAggregator, 'runWithContext'>>`
- Mock impl: `jest.fn((_path, _method, _meta, fn) => fn())`
- Test files colocated: `{name}.test.ts`
