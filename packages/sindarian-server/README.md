# Sindarian Server

A lightweight, NestJS-inspired framework designed specifically for Next.js applications. Build scalable APIs with familiar decorator-based architecture while leveraging Next.js's serverless capabilities.

## ( Features

- =� **NestJS-like API** - Familiar decorators and patterns
- � **Next.js Optimized** - Built for serverless environments
- =� **Dependency Injection** - Powered by Inversify
- =� **Decorator-based Routing** - Clean, declarative route definitions
- =' **Middleware Support** - Interceptors and exception filters
- =� **TypeScript First** - Full type safety out of the box
- <� **Lightweight** - Minimal overhead for fast cold starts

## =� Quick Start

### Installation

```bash
npm install @lerianstudio/sindarian-server reflect-metadata inversify
```

### Basic Setup

1. **Create your first controller:**

```typescript
// controllers/user.controller.ts
import { Controller, Get, Post, Param, Body, BaseController } from '@lerianstudio/sindarian-server'

@Controller('/users')
export class UserController extends BaseController {
  @Get()
  async findAll() {
    return { users: [] }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { id, name: 'John Doe' }
  }

  @Post()
  async create(@Body() userData: any) {
    return { id: 1, ...userData }
  }
}
```

2. **Create a service:**

```typescript
// services/user.service.ts
import { injectable } from 'inversify'

@injectable()
export class UserService {
  async findAll() {
    return [{ id: 1, name: 'John' }]
  }
}
```

3. **Set up your module:**

```typescript
// app.module.ts
import { Module } from '@lerianstudio/sindarian-server'
import { UserController } from './controllers/user.controller'
import { UserService } from './services/user.service'

@Module({
  controllers: [UserController],
  providers: [UserService]
})
export class AppModule {}
```

4. **Create the application:**

```typescript
// app.ts
import 'reflect-metadata'
import { ServerFactory } from '@lerianstudio/sindarian-server'
import { AppModule } from './app.module'

export const app = ServerFactory.create(AppModule)

// Optional: Configure global settings
app.setGlobalPrefix('/api/v1')
```

5. **Set up Next.js API routes:**

```typescript
// pages/api/[...slug].ts (Pages Router)
// or app/api/[...slug]/route.ts (App Router)
import { app } from './app'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: any) {
  return app.handler(request, context)
}

export async function POST(request: NextRequest, context: any) {
  return app.handler(request, context)
}

export async function PUT(request: NextRequest, context: any) {
  return app.handler(request, context)
}

export async function DELETE(request: NextRequest, context: any) {
  return app.handler(request, context)
}

export async function PATCH(request: NextRequest, context: any) {
  return app.handler(request, context)
}
```

## =� Core Concepts

### Controllers

Controllers handle incoming requests and return responses:

```typescript
@Controller('/posts')
export class PostController extends BaseController {
  constructor(
    @inject(PostService) private postService: PostService
  ) {
    super()
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.postService.findAll(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postService.findById(id)
  }

  @Post()
  async create(@Body() createPostDto: any) {
    return this.postService.create(createPostDto)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updatePostDto: any) {
    return this.postService.update(id, updatePostDto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.postService.remove(id)
  }
}
```

### Dependency Injection

Use Inversify's powerful DI system:

```typescript
@injectable()
export class PostService {
  constructor(
    @inject(DatabaseService) private db: DatabaseService,
    @inject(LoggerService) private logger: LoggerService
  ) {}

  async findAll() {
    this.logger.log('Fetching all posts')
    return this.db.posts.findMany()
  }
}
```

### Modules

Organize your application with modules:

```typescript
@Module({
  imports: [DatabaseModule], // Import other modules
  controllers: [PostController],
  providers: [
    PostService,
    {
      provide: 'CONFIG',
      useValue: { apiKey: process.env.API_KEY }
    },
    {
      provide: CacheService,
      useFactory: () => new CacheService({ ttl: 3600 })
    }
  ]
})
export class PostModule {}
```

### Exception Handling

Create custom exception filters:

```typescript
@Catch(ValidationError)
export class ValidationFilter implements ExceptionFilter {
  async catch(exception: ValidationError, host: ArgumentsHost) {
    return NextResponse.json(
      {
        message: 'Validation failed',
        errors: exception.errors
      },
      { status: 400 }
    )
  }
}

// Apply globally via app
app.useGlobalFilters(new ValidationFilter())

// Or register via module providers (supports multiple filters)
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: ValidationFilter
    },
    {
      provide: APP_FILTER,
      useClass: DatabaseErrorFilter
    }
  ]
})
export class AppModule {}

// Or on specific controllers
@Controller('/users')
@UseFilters(ValidationFilter)
export class UserController extends BaseController {}
```

**Note**: When registering multiple filters via `APP_FILTER`, they execute in reverse order (last registered runs first), allowing more specific filters to handle exceptions before general ones.

### Interceptors

Add cross-cutting concerns with interceptors:

```typescript
export class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const start = Date.now()
    const result = await next.handle()
    const duration = Date.now() - start
    
    console.log(`${context.getClass().name}.${context.getHandler().name} - ${duration}ms`)
    return result
  }
}

// Apply globally
app.useGlobalInterceptors(new LoggingInterceptor())

// Or on specific controllers
@Controller('/users')
@UseInterceptors(LoggingInterceptor)
export class UserController extends BaseController {}
```

## <� Parameter Decorators

Extract data from requests with decorators:

```typescript
@Controller('/users')
export class UserController extends BaseController {
  @Get(':id/posts')
  async getUserPosts(
    @Param('id') userId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Request() req: NextRequest
  ) {
    return this.userService.getPosts(userId, { page, limit })
  }

  @Post()
  async createUser(
    @Body() userData: CreateUserDto,
    @Request() req: NextRequest
  ) {
    return this.userService.create(userData)
  }
}
```

## =' Advanced Configuration

### Custom Providers

```typescript
@Module({
  providers: [
    // Class provider
    UserService,
    
    // Value provider
    {
      provide: 'DATABASE_URL',
      useValue: process.env.DATABASE_URL
    },
    
    // Factory provider
    {
      provide: DatabaseService,
      useFactory: (context: ResolutionContext) => {
        const url = context.container.get('DATABASE_URL')
        return new DatabaseService(url)
      }
    },
    
    // Class-to-class provider
    {
      provide: 'IUserRepository',
      useClass: PostgresUserRepository
    }
  ]
})
export class AppModule {}
```

### Request Injection

Access the current request anywhere in your application:

```typescript
@injectable()
export class AuthService {
  constructor(@inject(REQUEST) private request: NextRequest) {}

  getCurrentUser() {
    const token = this.request.headers.get('authorization')
    // Decode token and return user
  }
}
```

## =� Documentation

- **[Technical Guide](./TECHNICAL.md)** - Deep dive into the framework's architecture and implementation details
- **[API Reference](./docs/api.md)** - Complete API documentation
- **[Examples](./examples/)** - Working examples and use cases

## > Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## =� License

This project is licensed under the ISC License - see the [LICENSE](./LICENSE) file for details.

## =O Acknowledgments

- Inspired by [NestJS](https://nestjs.com/) - A progressive Node.js framework
- Built on [Inversify](https://inversify.io/) - A powerful IoC container for TypeScript
- Designed for [Next.js](https://nextjs.org/) - The React framework for production

## =� What's Next?

- [ ] Validation pipes with Zod integration
- [ ] Built-in authentication guards
- [ ] WebSocket support
- [ ] GraphQL integration
- [ ] CLI tools for scaffolding
- [ ] More built-in interceptors and filters

---

**Sindarian Server** - Building the future of Next.js APIs, one decorator at a time. =�