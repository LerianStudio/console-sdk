# Sindarian Server Technical Guide

## Overview

Sindarian Server is a lightweight, NestJS-inspired framework designed specifically for Next.js applications. While it mimics NestJS's decorator-based architecture and dependency injection patterns, it has fundamental differences in its underlying mechanisms and is optimized for Next.js's serverless environment.

**Key Differences from NestJS:**
- Built on Inversify instead of a custom DI container
- Designed for stateless serverless functions
- Simplified module system without complex lifecycle hooks
- Direct Next.js Request/Response integration
- Lightweight implementation focused on essential features

## Architecture Overview

### Core Components

1. **ServerFactory**: Main application factory and request handler
2. **Container**: Inversify-based dependency injection wrapper
3. **Module System**: Hierarchical module organization with providers and controllers
4. **Decorator System**: Metadata-driven routing, validation, and middleware
5. **Exception System**: Centralized error handling with filters
6. **Interceptor System**: Request/response middleware pipeline

## Core System Components

### 1. ServerFactory (`src/server/server-factory.ts`)

The `ServerFactory` is the heart of the framework, responsible for:

#### Initialization Process
```typescript
// Static factory method
ServerFactory.create(AppModule, options)
```

**Steps:**
1. Creates new Inversify container
2. Registers optional logger service
3. Loads module metadata and dependencies
4. Processes route definitions from controllers
5. Returns configured ServerFactory instance

#### Request Handling Pipeline
```typescript
async handler(request: NextRequest, { params })
```

**Request Processing Flow:**
1. **Request Binding**: Binds current request to container for this lifecycle
2. **Route Resolution**: Matches URL pattern and HTTP method to registered routes
3. **Controller Resolution**: Retrieves controller instance from DI container
4. **Handler Resolution**: Gets method handler from controller
5. **Execution Context**: Creates context with controller class, method, and arguments
6. **Interceptor Chain**: Executes interceptors in configured order
7. **Method Execution**: Calls actual controller method
8. **Exception Handling**: Catches and processes errors through filter chain

#### Global Configuration
- `setGlobalPrefix(prefix)`: Sets URL prefix for all routes
- `useGlobalFilters(...filters)`: Registers global exception filters
- `useGlobalInterceptors(...interceptors)`: Registers global interceptors

### 2. Dependency Injection System (`src/dependency-injection/container.ts`)

#### Container Architecture
The framework uses a wrapper around Inversify's container:

```typescript
export class Container {
  public container: InversifyContainer
  private loadedModules: Set<ContainerModule> = new Set()
}
```

**Key Features:**
- **Module Loading**: Prevents circular dependencies with visited tracking
- **Hierarchical Registration**: Child modules register in parent container
- **Lifecycle Management**: Handles both sync and async resolution
- **Service Binding**: Supports multiple binding strategies

#### ContainerModule System
```typescript
export class ContainerModule {
  public registry: ContainerModuleRegistry
  constructor(registry: (container: Container) => void)
}
```

**Module Registry Process:**
1. Validates module has registry method
2. Checks for circular dependencies
3. Executes module's registry function
4. Recursively loads imported modules

### 3. Module System (`src/modules/module-decorator.ts`)

#### Module Decorator
```typescript
@Module({
  imports?: Class[],      // Other modules to import
  controllers?: Class[],  // Controllers to register
  providers?: Provider[]  // Services to register
})
```

#### Provider Types
1. **Class Providers**: `providers: [MyService]`
2. **Factory Providers**: 
   ```typescript
   {
     provide: TOKEN,
     useFactory: (context) => new Service(context.get(DEP))
   }
   ```
3. **Value Providers**: `{ provide: TOKEN, useValue: instance }`
4. **Class-to-Class**: `{ provide: Interface, useClass: Implementation }`

#### Route Collection Process
The `moduleHandler` function recursively processes modules:

1. **Circular Prevention**: Tracks visited modules
2. **Import Processing**: Recursively handles imported modules
3. **Controller Processing**: Extracts routes from each controller
4. **Route Metadata**: Combines controller and method metadata

### 4. Decorator System

#### Controller Decorators (`src/controllers/decorators/`)

**@Controller(path)** (`controller-decorator.ts:53`)
- Marks class as injectable controller
- Defines base path for all routes
- Triggers route metadata compilation

**Route Decorators** (`route-decorator.ts:21`)
- `@Get(path)`, `@Post(path)`, `@Put(path)`, `@Patch(path)`, `@Delete(path)`
- Defines HTTP method and route pattern
- Wraps original method with parameter injection logic

#### Parameter Decorators

**@Param(name)** (`param-decorator.ts:67`)
- Extracts URL parameters using Next.js params object
- Validates parameter presence
- Throws ValidationApiException if missing

**@Query()** (`query-decorator.ts`)
- Extracts query string parameters from request URL
- Optional parameter extraction

**@Body()** (`body-decorator.ts`)
- Extracts and parses request body
- Supports JSON parsing with error handling

**@Request()** (`request-decorator.ts`)
- Injects raw Next.js request object
- Provides access to headers, URL, etc.

#### Parameter Resolution Process
Route decorators wrap methods to:
1. Process all parameter decorators in order
2. Extract parameters from request/context
3. Sort by parameter index
4. Call original method with resolved parameters
5. Auto-wrap response in NextResponse.json if needed

### 5. Exception Handling System (`src/exceptions/`)

#### Exception Hierarchy
```typescript
// Base exception class
export class ApiException extends Error {
  constructor(message: string, private readonly statusCode: number)
  getStatus(): number
}

// HTTP-specific exceptions
export class HttpException extends ApiException
export class ValidationApiException extends ApiException // 400
export class NotFoundApiException extends ApiException  // 404
```

#### Exception Filter System
```typescript
export abstract class ExceptionFilter {
  abstract catch(exception: any, host: ArgumentsHost): Promise<NextResponse | void>
}
```

**Built-in BaseExceptionFilter** (`base-exception-filter.ts:4`):
- Handles any unhandled exception
- Extracts status code via `getStatus()` method
- Returns standardized JSON error response

#### Filter Registration
1. **Global Filters**: `app.useGlobalFilters(filter)`
2. **Controller Filters**: `@UseFilters(filter)` decorator
3. **Service Registration**: Bind to `APP_FILTER` token

#### Exception Processing Flow
1. **Filter Collection**: Gathers global + controller filters
2. **Type Matching**: Matches exception type to filter metadata
3. **Filter Execution**: Calls first matching filter
4. **Response Handling**: Returns filter response or fallback error

### 6. Interceptor System (`src/interceptor/`)

#### Interceptor Interface
```typescript
export abstract class Interceptor {
  abstract intercept(context: ExecutionContext, next: CallHandler): Promise<any>
}
```

#### CallHandler Interface
```typescript
export interface CallHandler {
  handle(): Promise<any>
}
```

#### Execution Chain (`use-interceptor-decorator.ts:7`)
The `interceptorExecute` function creates a middleware chain:

1. **Chain Setup**: Creates recursive CallHandler chain
2. **Sequential Execution**: Each interceptor can call `next.handle()`
3. **Error Handling**: Skips to next interceptor on error
4. **Final Handler**: Eventually calls the actual controller method

#### Interceptor Registration
1. **Global**: `app.useGlobalInterceptors(interceptor)`
2. **Controller**: `@UseInterceptors(interceptor)` class decorator
3. **Service**: Bind to `APP_INTERCEPTOR` token

### 7. Request Lifecycle Management (`src/services/request.ts`)

#### Request Binding Strategy
Since Next.js functions are stateless, the framework uses:

1. **Per-Request Binding**: Each request binds itself to container
2. **Global Reference**: Maintains current request reference
3. **Container Integration**: Injects request via `REQUEST` token
4. **Cleanup**: Automatic cleanup between requests

```typescript
export function bindRequest(container: Container, request: NextRequest) {
  currentRequest = request
  if (container.isBound(REQUEST)) {
    container.unbind(REQUEST)
  }
  container.bind(REQUEST).toConstantValue(request)
}
```

### 8. Route Resolution (`src/utils/url/`)

#### URL Matching (`url-match.ts:9`)
Uses `path-to-regexp` for pattern matching:
```typescript
export function urlMatch(pathname: string, route: string) {
  const { regexp } = pathToRegexp(route)
  return regexp.test(pathname)
}
```

Supports patterns like:
- `/users` - exact match
- `/users/:id` - parameter capture
- `/users/:id/posts` - nested parameters

#### URL Building (`url-join.ts`)
Safely combines controller and method paths:
- Handles leading/trailing slashes
- Normalizes path segments
- Prevents double slashes

## Data Flow

### Application Startup
1. **Module Registration**: `ServerFactory.create(AppModule)`
2. **Container Setup**: New Inversify container created
3. **Module Loading**: Recursive module registration
4. **Route Compilation**: Extract all controller routes
5. **Service Registration**: Bind all providers

### Request Processing
1. **Request Arrival**: Next.js calls `app.handler(request, { params })`
2. **Request Binding**: Bind request to container
3. **Route Matching**: Find matching route pattern
4. **Controller Resolution**: Get controller from DI container
5. **Method Resolution**: Extract method handler
6. **Context Creation**: Build ExecutionContext
7. **Interceptor Chain**: Execute pre-processing interceptors
8. **Method Execution**: Call controller method with injected parameters
9. **Response Processing**: Auto-wrap response if needed
10. **Error Handling**: Process any exceptions through filter chain

### Dependency Resolution
1. **Constructor Injection**: Inversify resolves constructor dependencies
2. **Service Lookup**: Container resolves registered services
3. **Request Injection**: Current request available via REQUEST token
4. **Factory Resolution**: Dynamic factories execute with context

## Integration with Next.js

### API Route Setup
```typescript
// pages/api/[...slug].ts or app/api/[...slug]/route.ts
import { app } from './app'

export async function GET(request: NextRequest, context: any) {
  return app.handler(request, context)
}

export async function POST(request: NextRequest, context: any) {
  return app.handler(request, context)
}
// ... other HTTP methods
```

### Serverless Considerations
- **Stateless Design**: No persistent state between requests
- **Cold Start Optimization**: Minimal initialization overhead
- **Memory Efficiency**: Lightweight container and metadata
- **Request Isolation**: Each request gets isolated context

## Key Design Patterns

### 1. Factory Pattern
`ServerFactory` centralizes application configuration and provides a clean API for setup.

### 2. Decorator Pattern
Extensive use of TypeScript decorators for:
- Metadata registration
- Method interception
- Parameter injection
- Cross-cutting concerns

### 3. Chain of Responsibility
Both interceptors and exception filters use this pattern for flexible, composable behavior.

### 4. Dependency Injection
Inversify provides powerful DI with support for:
- Constructor injection
- Factory functions
- Value injection
- Async resolution

### 5. Template Method
Base classes like `BaseController` and `Interceptor` define structure while allowing customization.

## Performance Characteristics

### Initialization
- **Container Setup**: O(n) where n = number of modules/services
- **Route Compilation**: O(m) where m = number of controller methods
- **Metadata Processing**: Lazy evaluation where possible

### Request Processing
- **Route Matching**: O(r) where r = number of registered routes
- **DI Resolution**: O(d) where d = dependency depth
- **Interceptor Chain**: O(i) where i = number of interceptors

### Memory Usage
- **Metadata Storage**: Uses WeakMap for garbage collection
- **Container Overhead**: Minimal Inversify overhead
- **Request Isolation**: No memory leaks between requests

## Extension Points

### Custom Decorators
Extend the framework by creating custom decorators:
```typescript
const CUSTOM_KEY = Symbol('custom')

export function CustomDecorator(options: any): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(CUSTOM_KEY, options, target, propertyKey)
    // Custom logic here
  }
}
```

### Custom Providers
Create complex providers with factories:
```typescript
{
  provide: MyService,
  useFactory: (context: ResolutionContext) => {
    const dependency = context.container.get(Dependency)
    return new MyService(dependency, customConfig)
  }
}
```

### Custom Exception Filters
Handle specific error types:
```typescript
@Catch(SpecificError)
export class SpecificErrorFilter implements ExceptionFilter {
  async catch(exception: SpecificError, host: ArgumentsHost) {
    // Custom error handling
    return NextResponse.json({ custom: 'error' }, { status: 422 })
  }
}
```

### Custom Interceptors
Add cross-cutting concerns:
```typescript
export class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const start = Date.now()
    const result = await next.handle()
    const duration = Date.now() - start
    Logger.log(`${context.getClass().name}.${context.getHandler().name} - ${duration}ms`)
    return result
  }
}
```

## Best Practices

### Module Organization
- Keep modules focused and cohesive
- Use imports for shared functionality
- Avoid circular dependencies between modules

### Controller Design
- Extend BaseController for consistency
- Use parameter decorators for validation
- Keep business logic in services

### Service Architecture
- Use dependency injection for testability
- Create focused, single-responsibility services
- Leverage factory providers for complex initialization

### Error Handling
- Create specific exception types for different errors
- Use filters for cross-cutting error concerns
- Provide meaningful error messages

### Performance
- Minimize global interceptors
- Use factory providers only when necessary
- Keep route patterns simple for faster matching

This framework provides a solid foundation for building scalable Next.js APIs while maintaining the familiar NestJS development experience with necessary adaptations for the serverless environment.