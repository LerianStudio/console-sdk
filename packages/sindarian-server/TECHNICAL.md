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
7. **Pipe System**: Data transformation and validation pipeline
8. **Zod Integration**: Schema-based validation with automatic DTO generation

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
7. **Parameter Extraction**: Extracts parameters using route handler decorators
8. **Pipe Processing**: Validates and transforms parameters through registered pipes
9. **Method Execution**: Calls actual controller method with processed parameters
10. **Exception Handling**: Catches and processes errors through filter chain

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
- Supports JSON, form-data, and text parsing
- Integrates with pipe system for validation
- Preserves parameter type metadata for Zod validation

**@Request()** (`request-decorator.ts`)
- Injects raw Next.js request object
- Provides access to headers, URL, etc.

#### Parameter Resolution Process
The framework processes parameters through a multi-stage pipeline:

1. **Route Decoration**: Route decorators store parameter type metadata using `design:paramtypes`
2. **Parameter Extraction**: Parameter decorators extract raw values from request
3. **Pipe Processing**: Registered pipes validate and transform parameter values
4. **Method Invocation**: Processed parameters are passed to controller method
5. **Response Wrapping**: Return value is auto-wrapped in NextResponse.json if needed

**Note**: Route decorators no longer handle parameter processing directly. This is now handled by the ServerFactory during request processing for better separation of concerns.

### 5. Exception Handling System (`src/exceptions/`)

#### Exception Hierarchy
```typescript
// Base exception class. `getResponse()` reads the message off the exception
// rather than taking it, because `Error.message` is writable: what a route
// wrote after construction is bounded and reduced to a sentence here, at the
// last frame before an application renders it
export class HttpException extends Error {
  constructor(message: string, status?: number)
  getStatus(): number
  getResponse(): { message: string }
}

// Adds the classification a caller reads, and coerces the message to a
// bounded string: an upstream body handed in here keeps only its title or code.
// `metadata` is spread UNDER the three named fields, and every value this body
// answers is read rather than taken, `code` and `title` included: see the
// metadata and classification paragraphs below
export class ApiException extends HttpException {
  constructor(code: string, title: string, message: unknown, status?: HttpStatus, metadata?: any)
  getResponse(): { code: string; title: string; message: string }
}

export class ValidationApiException extends ApiException // 400
export class NotFoundApiException extends ApiException  // 404
```

#### Exception Filter System
```typescript
export abstract class ExceptionFilter {
  abstract catch(exception: any, host: ArgumentsHost): Promise<NextResponse | void>
}
```

**Built-in BaseExceptionFilter** (`base-exception-filter.ts`):
- Answers an `ApiException` with its own message, at its own status, read through `readWireStatus` rather than taken from `getStatus()` (see the two bullets below)
- Answers anything else, an unexpected error, with `500 {"message":"Internal server error","code":"0004"}`: the thrown value's own text never reaches the response, and a status it carried of its own is not read (a plain `HttpException` is answered 500)
- Writes the thrown value to the operator log at error level instead, as ONE physical line: the label `Unhandled exception` followed by `{ name, message, value }` serialised as JSON, every string it carries bounded at 2000 characters, as a KEY as much as a value and at any depth. The transport's two failure logs, `Request failed` and `Request error`, are written the same way, so a line-oriented collector receives one parseable event per failure. The bound is per string and not on their number: a record with ten thousand fields is ten thousand bounded fields, and an override that returns an upstream's own field map is what decides that width
- **The record is unredacted.** It carries the whole thrown value within that bound, so a route that rethrows an upstream body puts that body, taxpayer ids and internal hosts included, into the operator log. This package redacts nothing there on purpose: it is the last remaining copy of what broke, and a projection would have to guess which key holds the incident. Redaction is the log pipeline's job. The cheaper fix is at the throw site: name what failed, not whose record it was
- Answers an `ApiException` whose `message` was written after construction with the status-specific fallback sentence the constructor substitutes for a body that classifies nothing (`Upstream error body carried no problem details (status 404)`), never with the object, the missing field or the megabyte it was given. A message that IS a string is still the one the caller is told, bounded at 2000 characters. The same read happens on `HttpException.getResponse()`, which `ApiException` inherits rather than repeating, so an application rendering its own envelope gets the same guarantee from a plain `HttpException` and from every typed subclass
- Reads the status the same way: a `getStatus()` that throws, or that returns a status no response can carry a BODY with, answers 500 rather than taking the route's whole response down. Two sets of those, and neither is exotic: anything outside 200 to 599, which the runtime refuses with a `RangeError`, and the null-body statuses 204, 205 and 304, which it accepts as statuses and refuses with a `TypeError` the moment a body is attached. All three of the second set are members of this package's `HttpStatus` enum and type-legal in `ApiException`'s constructor

**If your application renders its own envelope, build the status with `readWireStatus`.**
An application filter that spreads `exception.getResponse()` into its own body is reading a message this package has already guarded. The STATUS is the other half and it is not guarded from inside the object: `getStatus()` belongs to the subclass, and the frame that builds the response is yours, so that is where an unusable one costs you the response.

```typescript
import { readWireStatus } from '@lerianstudio/sindarian-server'

const status = readWireStatus(exception) // never exception.getStatus() here

return NextResponse.json({ ...envelope, ...exception.getResponse() }, { status })
```

The TYPE that body is emitted with keeps an index signature next to the three named fields, because metadata keys are part of it: `getResponse().details` compiles, as `unknown`. On `1.x` the return was inferred as `any`, so a consumer reading THROUGH such a key with no cast compiled and now does not: `const body = e.getResponse(); body.details.requestId` reads `TS18046: 'body.details' is of type 'unknown'`, and the one-step form `e.getResponse().details.requestId` reads `TS2571: Object is of type 'unknown'`. Narrow it once where you receive it. It is not the only type-level change in the 2.x line, only the one a consumer READING this body meets. Against the source at `sindarian-server-v1.4.0-beta.1`: `ApiException`'s constructor takes `message: unknown` where 1.x declared `public readonly message: string`, so handing an upstream body in as the message is no longer a compile error (the constructor reduces it to a sentence instead, which is what this line exists for), and the class no longer declares `message` itself; `HttpService` has two protected members, `onRequestFailure` and `describeRequestError`, that a subclass declaring either name must now match. The pass-3 security review's declarations diff also reports `BaseExceptionFilter.catch` emitting `{ message: string }` where 1.x emitted `any`; that one is reported, not re-measured here.

`readWireMessage(source, fallback)` is exported beside it, for a filter that reads a message off something that is not one of this package's exceptions at all. Neither can throw, and both answer the fallback rather than the failure. `noProblemDetails(status)` is exported with them, and it is the fallback they take: use it rather than inventing a sentence, so the same failed read does not read one way from this package's filter and another from yours.

**Metadata a route attaches is read, not taken.** `ApiException.getResponse()` spreads the constructor's fifth parameter under the three named fields, and a spread is a READ: it invokes every own enumerable accessor the route attached. A getter that throws produced no body at all, and a value `JSON.stringify` refuses, a `bigint`, which is what a pg driver hands back for an int64 amount, produced one that failed where the response is serialised. Both left the route with no Response, which is the same zero-byte failure a null-body status caused, reached through the recipe above. The metadata is now taken as a JSON round trip: every accessor runs exactly once, inside a guard, and what comes back cannot be refused. For metadata whose ROOT is a plain object carrying no `toJSON` of its own, which is every shape this package and Console pass, the bytes on the wire are unchanged, because the response is serialised with `JSON.stringify` anyway and it drops the same functions, `undefined`s and symbols in the same key order. What a caller reading `getResponse()` in memory loses is live references: a class instance arrives as its data. Three roots are not that shape, and every one of them was measured on a pre-fix build of this package against this one, through a real `Response`. A root carrying a `toJSON` now DECIDES the body, and what that replaces depends on where the `toJSON` sits. On the PROTOTYPE, which is where an ordinary class puts it, the spread copied the instance's own DATA and left the method behind: a money class passed as the whole metadata served `{"cents":1500,...}` and serves `{"amount":15,...}` now, so a consumer reading `cents` reads nothing after this release. As an OWN ENUMERABLE property, the spread copied the FUNCTION onto the body and the serialiser then called it, so what it returned became the WHOLE response: `{"amount":15}`, with the application's envelope and all three named fields gone. That shape is repaired rather than changed. The third root is one the round trip turns into something that is not an object, a `Date` becoming its ISO string, which then spreads by index and serves numbered character keys where it served nothing before. A `toJSON` on a value INSIDE the metadata is honoured on both builds. None of the three is a shape this package produces, and the last is left as it is rather than guarded, because refusing a non-object root would also change what a plain string root has always served. When the round trip fails, the answer carries `code`, `title` and `message` alone and the drop is written to the operator log as `Exception metadata dropped`, with its bounded reason.

**What the round trip costs, and where.** The guard is on the ERROR path only, and it is not free: answering an exception now serialises the metadata and parses it back before the response is serialised at all, which is a full extra pass over a value the caller sized and a second peak copy of it in memory. Measured on this build with the 4.1 MB `{ errors: [...] }` a rejected form produces, `getResponse()` costs roughly 18 ms (18.4 and 18.9 in two runs, each the mean of five calls on a shared box) against 0.001 ms for the spread it replaced, on top of the 6.5 ms the response serialisation always cost. Read the magnitude, not the digits: this is a timing on one machine. The bytes on the wire are what they were, so nothing downstream moves; what moved is CPU and peak memory per exception answered, on a path a caller can trigger cheaply by sending a body that fails validation. A route that attaches a megabyte to metadata now pays for it twice.

**The classification a route wrote is read, not taken.** `code` and `title` are the other two fields `ApiException.getResponse()` answers, and they were handed over exactly as written until the change described here, which lands in the next release off `develop`. Both are read once now, inside the same guard family as the message, and bounded at `PROBLEM_FIELD_MAX_LENGTH`, which is the ceiling this package already applies to an upstream's own classification. A PRIMITIVE is stringified rather than replaced, because the value is fine and only its type is not: a pg `INT` code of `5` served `{"code":5}` before and serves `{"code":"5"}` now, and a `bigint`, which used to cost the route its whole response where the body is serialised, reads as its digits. A `code` that is not a primitive at all answers `0004`, the code this library gives a failure it cannot classify; a `title` in the same state answers the reason phrase of the status the response actually carries, which is the title seven of the eight typed exceptions here use for their own status. The eighth is `ValidationApiException`, 'Validation Error' at a status whose phrase is 'Bad Request', so a rejected form whose title was overwritten is told 'Bad Request'. Neither field needs an override to go wrong: both are declared `string` and both are satisfied with no cast by the `any` a database row is, so `new ApiException(row.code, row.title, ...)` compiles. Writing either AFTER construction does need a cast, both being `readonly`, which is the one thing `message` never needed. Measured through a real handler: a `code` getter that threw left the route with NO Response at all and wrote no line either, and a `title` a route had written an upstream body into carried that body, internal host included, to the browser. A drop is announced as `Exception classification dropped`, naming the field and the status; the fields that still read are untouched. Two shapes here answered a caller before and answer differently now, both measured on a pre-fix build: a `code` or `title` past 200 characters is truncated, and one that is an object, an array or `null` is replaced by the fallback, its own value surviving in neither the body nor the operator log, which names the field and not what was in it. A `code` that is `undefined`, a function or a symbol served NO `code` key at all before, because `JSON.stringify` drops all three, and serves the fallback now. The primitive rule is the classification's alone: `message` keeps the text rule `2.0.0-beta.5` shipped, so a number written into it still answers the fallback sentence, because a message is a sentence and a code is an identifier.

**A change for log consumers, shipped in 2.0.0-beta.5.** The second argument of every `console.error` this package writes, the exception filter's `Unhandled exception` and the transport's `Request failed` and `Request error`, is now a JSON STRING and no longer a record OBJECT. The release matters, and the two releases around it are measured rather than remembered: this arrived with PR #191, which shipped as `2.0.0-beta.5`, and NOT with #190, which shipped as `2.0.0-beta.4`. Neither of them opened the 2.0.0 line; that was `2.0.0-beta.1`, released on 2026-09-09, which left the line six days and three releases old (`beta.1`, `beta.2`, `beta.3`) by the time #190 merged. A consumer pinned to `2.0.0-beta.3` or `2.0.0-beta.4` still receives the object and has nothing to change yet. A consumer that read that argument as an object, a test asserting `toHaveBeenCalledWith('Request failed', { method: 'GET' })` or a console-to-structured-logger bridge forwarding it onward, reads a string now and parses it with `JSON.parse`. What a line-oriented collector receives is unchanged in content and is now one event instead of several.

#### Filter Registration
1. **Global Filters**: `app.useGlobalFilters(filter)`
2. **Controller Filters**: `@UseFilters(filter)` decorator
3. **Service Registration**: Bind to `APP_FILTER` token (supports multiple bindings)

**Multiple APP_FILTER Providers**:
You can register multiple exception filters using the `APP_FILTER` token:

```typescript
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    }
  ]
})
export class AppModule {}
```

**Execution Order**: Filters are executed in **reverse registration order** (last registered executes first). This allows more specific filters to handle exceptions before more general ones:
- `GlobalExceptionFilter` executes first (last registered)
- `DatabaseExceptionFilter` executes second
- `ValidationExceptionFilter` executes last (first registered)

This follows NestJS's behavior where filters bound at the controller level take precedence over global filters.

#### Exception Processing Flow
1. **Filter Collection**: Gathers global + controller + APP_FILTER filters
2. **Order Reversal**: Filters are reversed to prioritize more specific handlers
3. **Type Matching**: Matches exception type to filter metadata
4. **Filter Execution**: Calls first matching filter
5. **Response Handling**: Returns filter response or fallback error

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
3. **Service**: Bind to `APP_INTERCEPTOR` token (supports multiple bindings)

**Multiple APP_INTERCEPTOR Providers**:
```typescript
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    }
  ]
})
export class AppModule {}
```

**Execution Order**: Interceptors execute in **reverse registration order** (last registered executes first), matching the filter behavior.

### 7. Pipe System (`src/pipes/`)

The Pipe System provides data transformation and validation capabilities that process parameters before they reach controller methods.

#### Pipe Interface
```typescript
export interface PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any
}

export interface ArgumentMetadata {
  readonly type: 'body' | 'param' | 'query' | 'custom'
  readonly metatype?: Function | undefined
  readonly data?: any
}
```

#### Built-in Pipes

**ZodValidationPipe** (`src/zod/zod-validation-pipe.ts`)
- Validates parameters using Zod schemas
- Works with DTOs created via `createZodDto()`
- Throws `ValidationApiException` on validation failures
- Automatically detects ZodDto classes via `isZodDto` property

#### Pipe Execution Process (`src/pipes/decorators/use-pipes.ts`)

The `PipeHandler.execute` function processes all parameters through registered pipes:

1. **Metadata Collection**: Gathers route parameter metadata from `design:paramtypes`
2. **Parameter Processing**: Processes each parameter through the pipe chain
3. **Type Information**: Uses `paramType` or `paramTypes[parameterIndex]` for validation
4. **Sequential Execution**: Pipes are applied in registration order
5. **Error Handling**: Validation errors are propagated as exceptions

```typescript
static async execute(
  target: object,
  propertyKey: string | symbol,
  pipes: PipeTransform[],
  args: RouteContext[]
): Promise<any[]>
```

#### Pipe Registration

1. **Global Pipes**:
   ```typescript
   @Module({
     providers: [
       { provide: APP_PIPE, useClass: ZodValidationPipe },
       { provide: APP_PIPE, useClass: TransformPipe }
     ]
   })
   ```

   Multiple `APP_PIPE` providers are supported and execute in **reverse registration order** (last registered executes first).

2. **Controller Pipes**: `@UsePipes(ValidationPipe)` class decorator

3. **Method Pipes**: `@UsePipes(ValidationPipe)` method decorator

#### Parameter Type Detection

The pipe system uses TypeScript's `emitDecoratorMetadata` to detect parameter types:

- **Route Metadata**: Parameter types captured during route decoration
- **Design Types**: Fallback to `design:paramtypes` reflection metadata
- **Body Parameters**: Special handling for request body with DTO type detection

### 8. Zod Integration (`src/zod/`)

The framework provides seamless integration with Zod for schema validation and DTO generation.

#### createZodDto Function (`src/zod/create-zod-dto.ts`)

Converts Zod schemas into DTO classes compatible with the validation pipeline:

```typescript
export function createZodDto<TSchema extends UnknownSchema>(
  schema: TSchema
): ZodDto<TSchema> {
  class AugmentedZodDto {
    public static readonly isZodDto = true
    public static readonly schema = schema
    
    public static create(input: unknown) {
      return this.schema.parse(input)
    }
  }
  
  return AugmentedZodDto as unknown as ZodDto<TSchema>
}
```

#### ZodDto Interface
```typescript
export interface ZodDto<TSchema extends UnknownSchema> {
  new (): ReturnType<TSchema['parse']>
  isZodDto: true
  schema: TSchema
  create(input: unknown): ReturnType<TSchema['parse']>
}
```

#### Usage Pattern
```typescript
// Define Zod schema
const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().min(18).optional()
})

// Create DTO class
export class CreateUserDto extends createZodDto(CreateUserSchema) {}

// Use in controller
@Controller('/users')
export class UsersController {
  @Post()
  async createUser(@Body() userData: CreateUserDto) {
    // userData is automatically validated and typed
    return this.usersService.create(userData)
  }
}
```

#### Validation Pipeline Integration

1. **Parameter Extraction**: `@Body()` decorator extracts request body
2. **Type Detection**: Pipe system detects `CreateUserDto` as parameter type
3. **Validation**: `ZodValidationPipe` validates using the embedded Zod schema
4. **Error Handling**: Invalid data throws `ValidationApiException`
5. **Type Safety**: Valid data is strongly typed according to schema

#### Error Response Format
```json
{
  "message": "Validation failed",
  "statusCode": 400,
  "error": "Bad Request"
}
```

#### Advanced Zod Features

**Nested Objects**:
```typescript
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string().regex(/^\d{5}$/)
})

const UserSchema = z.object({
  name: z.string(),
  address: AddressSchema
})
```

**Array Validation**:
```typescript
const CreateUsersSchema = z.object({
  users: z.array(UserSchema).min(1).max(10)
})
```

**Custom Validation**:
```typescript
const UserSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith('@company.com'),
    { message: 'Must be company email' }
  )
})
```

### 9. Request Lifecycle Management (`src/services/request.ts`)

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

#### URL Matching (`url-match.ts:50`)
Uses `path-to-regexp` for pattern matching, and answers what it captured:
```typescript
export function urlMatch(pathname: string, route: string): UrlMatch {
  const result = match(route, { decode: decodeCapture })(pathname)

  if (!result) {
    return { matched: false, params: {} }
  }

  return { matched: true, params: /* plain Record<string, string> */ }
}
```

`decodeCapture` degrades to the raw text instead of throwing, so a malformed
percent escape (`%ZZ`) still resolves its route rather than costing the request
a 500. `ServerFactory._fetchRoute` returns `{ route, params }`, so the captures
reach the handler arguments without being recomputed.

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
8. **Parameter Extraction**: Extract parameters from request using decorators
9. **Pipe Processing**: Validate and transform parameters through registered pipes
10. **Method Execution**: Call controller method with processed parameters
11. **Response Processing**: Auto-wrap response if needed
12. **Error Handling**: Process any exceptions through filter chain

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

### TypeScript Configuration Requirements

For the pipe system and Zod validation to work correctly, ensure your TypeScript configuration includes:

```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "types": ["reflect-metadata"]
  }
}
```

**Critical**: The `emitDecoratorMetadata: true` setting is essential for parameter type detection in the pipe system. Without this, Zod validation will not receive proper type information.

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

### Custom Pipes
Create data transformation and validation logic:
```typescript
@injectable()
export class ParseIntPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): number {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed)) {
      throw new ValidationApiException(`Invalid integer: ${value}`)
    }
    return parsed
  }
}

// Usage
@Get(':id')
async findOne(@Param('id') @UsePipes(ParseIntPipe) id: number) {
  return this.service.findOne(id)
}
```

### Custom Zod DTOs
Create reusable validation schemas:
```typescript
// Base schemas
const TimestampSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date()
})

// Composed schemas
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email()
}).merge(TimestampSchema)

// Generated DTO
export class UserDto extends createZodDto(UserSchema) {}

// Partial updates
const UpdateUserSchema = UserSchema.partial().omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
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

### Validation and Pipes
- Use Zod schemas for all input validation
- Create reusable DTO classes with `createZodDto()`
- Register `ZodValidationPipe` globally for consistent validation
- Use custom pipes for data transformation (e.g., parsing, normalization)
- Keep validation logic in schemas, not in controllers

### Schema Design
- Define schemas at module level for better type inference
- Use schema composition with `.merge()` for reusability
- Leverage Zod's built-in validation methods (`.email()`, `.uuid()`, etc.)
- Create separate schemas for create/update operations using `.partial()` and `.omit()`
- Use `.refine()` for custom business logic validation

### Performance
- Minimize global interceptors
- Use factory providers only when necessary
- Keep route patterns simple for faster matching

This framework provides a solid foundation for building scalable Next.js APIs while maintaining the familiar NestJS development experience with necessary adaptations for the serverless environment.

## Recent Updates

### Pipe System and Zod Integration (v1.0.0-beta.1+)
The framework now includes a comprehensive pipe system with built-in Zod validation support:

- **Automatic Validation**: DTOs created with `createZodDto()` are automatically validated
- **Type Safety**: Full TypeScript integration with schema-based type inference  
- **NestJS-Compatible**: Follows NestJS patterns for pipes and validation
- **Extensible**: Support for custom pipes and transformation logic
- **Performance Optimized**: Efficient parameter processing pipeline

This brings the framework closer to feature parity with NestJS while maintaining its lightweight, serverless-optimized design.