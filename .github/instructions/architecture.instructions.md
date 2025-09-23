---
applyTo: '**'
---

# NestJS: Framework, Architecture and Module Structure

## Architecture principles for code generation (Hexagonal Architecture)

- Use Hexagonal Architecture (Ports and Adapters) as the foundation
- Apply separation of concerns across all layers
- Follow dependency injection patterns consistently
- Separate the GraphQL schema from business logic
- Use a code-first approach with decorators to generate the schema
- Keep domain logic isolated from infrastructure concerns
- Organize code into feature modules following hexagonal architecture
- Keep each layer (application, domain, infrastructure) isolated
- Use proper barrel exports for each layer

## Module Structure Generation Rules

Follow this structure when generating new modules:

**Feature Module Structure**:

```
src/modules/moduleName/
├── module-name.module.ts    # Module registration (controllers + providers)
├── application/             # Application layer (use cases and DTOs)
│   ├── dto/                # Request/response DTOs with validation
│   └── use-cases/          # Business logic orchestration
├── domain/                 # Domain layer (pure business logic)
│   ├── entities/           # Domain entities
│   ├── repositories/       # Repository interfaces (contracts)
│   ├── services/           # Domain services (business rules)
│   └── types/              # Domain types and interfaces
└── infrastructure/         # Infrastructure layer (external concerns)
    ├── adapters/           # Repository implementations and external APIs
    └── controllers/        # HTTP controllers with Swagger docs
```

**Shared Module Structure**:

```
src/shared/
├── application/            # Application layer
│   ├── decorators/         # Custom decorators
│   ├── dto/               # Common DTOs
│   └── services/          # Application services (correlation, audit, etc.)
├── domain/                # Domain layer (pure business logic)
│   ├── entities/          # Shared domain entities
│   ├── enums/             # Domain enums
│   ├── interfaces/        # Domain interfaces
│   ├── types/             # Domain types
│   └── value-objects/     # Value objects
├── infrastructure/        # Infrastructure layer
│   ├── adapters/          # External system adapters (TypeORM, Redis, etc.)
│   ├── guards/            # NestJS guards
│   ├── interceptors/      # NestJS interceptors
│   ├── middleware/        # Express middleware
│   ├── services/          # Infrastructure services (external APIs)
│   └── utils/             # Infrastructure utilities (bcrypt, crypto, etc.)
├── shared.module.ts       # Shared module registration
└── index.ts              # Barrel exports
```

## Responsibilities by layer

### domain/

**Domain layer generation rules**

- Generate pure business logic code
- Create entities without dependencies on external frameworks
- Keep domain logic pure and framework-agnostic
- Implement value objects with internal validation
- Create domain services for complex business rules
- Emit domain events for business state changes
- Define domain-specific exceptions
- Define clear interfaces in the ports directory
- Use value objects for complex attributes
- Implement domain events for cross-cutting concerns
- Keep entities focused and immutable where possible
- Define clear domain errors
- Use appropriate typing for all domain objects

### application/

**Application layer generation rules**

- Implement use cases that orchestrate domain objects
- Create port interfaces for external dependencies
- Generate DTOs with validation decorators
- Define application-specific exceptions
- Create application services that implement business flows
- Implement use cases as application services
- Keep application services focused on orchestration
- Use appropriate DTOs for input/output
- Implement CQRS pattern when beneficial
- Handle domain events
- Validate inputs using class-validator
- Map between domain and DTOs using class-transformer

### infrastructure/

**Infrastructure layer generation rules**

- Generate framework-specific code (NestJS, TypeORM, GraphQL, Express)
- Create adapters that implement application ports
- Implement repositories for data persistence
- Create GraphQL resolvers, types and inputs
- Generate guards, filters and interceptors
- Create adapters for external services
- Implement repository interfaces defined in the domain
- Keep Express-specific code within infrastructure
- Implement GraphQL resolvers with Apollo Server (@nestjs/graphql)
- Use proper dependency injection
- Handle infrastructure concerns (cache, logging)
- Implement appropriate error handling
- Use proper database abstractions

### shared/

**Generation rules for `shared/`**

- Provide utilities for cross-cutting concerns
- Create common types and interfaces
- Generate decorators for reusable functionality
- Create configuration constants and types
- Must not contain business logic

### Dependency injection generation rules

- Use constructor injection for required dependencies
- Mark injected dependencies as `readonly`
- Prefer interface-based injection over concrete classes
- Use appropriate provider scopes (Singleton, Request, Transient)
- Organize providers by feature modules
- Inject domain ports, not implementations
- Use appropriate provider tokens
- Handle circular dependencies properly
- Use the correct scope (DEFAULT, REQUEST, TRANSIENT)
- Implement appropriate factory providers
- Configure providers in the infrastructure layer

## Configuration system rules

- Centralize configuration in `src/config/`, one file per concern
- Use `registerAs('<namespace>')` with a typed factory; the namespace must match the filename in lower camelCase
- Export a type per configuration and prefer `readonly` properties
- Environment variables in SCREAMING_SNAKE_CASE with explicit, scoped names
- Provide defaults only for development; never for secrets/credentials
- Explicit parsing: numbers, booleans, arrays and URLs (with validation)
- Validate at startup and fail fast; strip unknown keys (schema-based validator)
- Register with `ConfigModule.forRoot` (global, cache, load, envFilePath); in production use `ignoreEnvFile: true`
- Keep factories pure and side-effect free
- Do not log secrets; obfuscate sensitive fields
- Use typed access (`ConfigType<typeof ...>`) and avoid magic strings with `ConfigService`
- Use environment overlays via `.env` files with clear precedence
- Keep a barrel export in `src/config/index.ts`
- Document variables and handle deprecations with a temporary fallback and a single warning at startup
