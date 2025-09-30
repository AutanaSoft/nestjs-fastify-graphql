---
applyTo: '**'
---

# Error Handling: Creation and Management

## Error Architecture Principles

- Use a hierarchical error structure with base classes
- Extend GraphQLError for all custom errors to ensure GraphQL compatibility
- Separate errors by layer: domain errors in `domain/errors/`, infrastructure errors in `infrastructure/errors/`
- All errors must include extensions with `code` and `status` properties
- Use `HttpStatus` enum from `@nestjs/common` for the `status` property when possible
- Preserve the prototype chain using `Object.setPrototypeOf(this, new.target.prototype)`
- Set `this.name = this.constructor.name` for proper error identification
- Use barrel exports (`index.ts`) in error directories for clean imports

## Error Hierarchy

### Domain Layer Errors

**Base Error Class**:

- Create `DomainBaseError` extending `GraphQLError`
- Accept `message` and optional `GraphQLErrorOptions` parameters
- Set error name to constructor name
- Restore prototype chain for proper instanceof checks

**Domain-Specific Errors**:

- Extend from `DomainBaseError`
- Define in `src/shared/domain/errors/` for shared domain errors
- Define in `src/modules/{module}/domain/errors/` for module-specific errors
- Include semantic error codes in SCREAMING_SNAKE_CASE
- Set appropriate HTTP status using `HttpStatus` enum (HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND, etc.)
- Add contextual data to extensions when needed

**Common Domain Errors**:

- `NotFoundError`: Resource not found (HttpStatus.NOT_FOUND / 404)
- `ConflictError`: Business rule violation or duplicate resource (HttpStatus.CONFLICT / 409)
- `DataBaseError`: Database operation failures (HttpStatus.INTERNAL_SERVER_ERROR / 500)
- `ExternalServiceError`: External service failures (HttpStatus.BAD_GATEWAY / 502)

### Infrastructure Layer Errors

**Base Error Class**:

- Create `InfrastructureBaseError` extending `DomainBaseError`
- Handle framework-specific concerns (HTTP, GraphQL, NestJS)

**Infrastructure-Specific Errors**:

- Extend from `InfrastructureBaseError`
- Define in `src/shared/infrastructure/errors/`
- Map HTTP status codes to GraphQL errors

**Common Infrastructure Errors**:

- `BadRequestError`: Invalid request payload or parameters (HttpStatus.BAD_REQUEST / 400)
- `UnauthorizedError`: Authentication required (HttpStatus.UNAUTHORIZED / 401)
- `ForbiddenError`: Insufficient permissions (HttpStatus.FORBIDDEN / 403)

### Module-Specific Errors

**Creation Rules**:

- Create specific error classes for each domain concern
- Extend from `DomainBaseError` for domain errors
- Include descriptive, human-readable messages
- Accept relevant parameters to build contextual messages
- Add contextual data to extensions (e.g., userId, email, domain)
- Use default messages with optional override capability

## Error Properties Structure

### Required Properties

**message**:

- Human-readable error description
- Use English for error messages
- Be specific and actionable
- Include relevant context when possible

**extensions.code**:

- Unique error identifier in SCREAMING_SNAKE_CASE
- Follow pattern: `{ENTITY}_{ACTION}_{REASON}` or `{HTTP_ERROR_NAME}`
- Must be consistent across the application

**extensions.status**:

- HTTP status code using `HttpStatus` enum from `@nestjs/common`
- Match REST API conventions
- Use appropriate status for the error type
- Examples: HttpStatus.BAD_REQUEST (400), HttpStatus.NOT_FOUND (404), HttpStatus.INTERNAL_SERVER_ERROR (500)

### Optional Properties

**extensions.{contextualData}**:

- Include relevant business context (userId, email, entityId, etc.)
- Spread existing options.extensions to preserve custom data
- Avoid sensitive information in production

## Error Handling Strategy

### When to Create Domain Errors

- Business rule violations
- Entity not found scenarios
- Validation failures at domain level
- State transition violations
- External service communication failures

### When to Create Infrastructure Errors

- HTTP-specific concerns (authentication, authorization)
- Request validation failures
- Framework-specific errors
- Protocol-level issues

### Error Throwing Guidelines

- Throw errors at the appropriate layer
- Use specific error classes, not generic Error
- Provide sufficient context in error messages
- Include relevant data in extensions
- Let errors bubble up to be caught by filters

## Error Filter and Transformation

### GraphQL Exception Filter

**Responsibilities**:

- Catch all exceptions in GraphQL resolvers
- Transform errors to GraphQL-compatible format
- Log errors appropriately based on type
- Preserve error extensions and metadata
- Normalize unknown errors to prevent information leakage

**Error Transformation Rules**:

- Domain and Infrastructure errors: pass through with logging
- GraphQL errors: preserve as-is with warning log
- HTTP exceptions: normalize to GraphQL format
- Unknown errors: wrap in generic INTERNAL_SERVER_ERROR

### Logging Strategy

**Domain Errors**:

- Do not log (business logic, expected scenarios)
- Only warn level for specific cases

**Infrastructure Errors**:

- Log with appropriate level (warn/error)
- Include stack trace when available
- Omit sensitive information

**Unknown Errors**:

- Always log with error level
- Include full stack trace
- Add timestamp and error type

## Error Creation Best Practices

### Constructor Patterns

- Accept specific parameters needed for message construction
- Provide optional `GraphQLErrorOptions` parameter
- Build descriptive messages using parameters
- Merge custom extensions with base extensions
- Preserve existing extensions using spread operator
- Always restore prototype chain

### Message Construction

- Use template literals for dynamic messages
- Include entity names and identifiers
- Be specific about what failed
- Avoid technical jargon when possible
- Use action-oriented language

### Code Naming

- Use entity/module prefix for domain errors
- Use HTTP status name for infrastructure errors
- Keep codes concise but descriptive
- Maintain consistency across similar errors

### StatusCode Selection

Use `HttpStatus` enum from `@nestjs/common`:

- HttpStatus.BAD_REQUEST (400): Client-side validation, bad input
- HttpStatus.UNAUTHORIZED (401): Authentication required or failed
- HttpStatus.FORBIDDEN (403): Authenticated but not authorized
- HttpStatus.NOT_FOUND (404): Resource not found
- HttpStatus.CONFLICT (409): Conflict with current state, duplicates
- HttpStatus.INTERNAL_SERVER_ERROR (500): Server-side errors, database failures
- HttpStatus.BAD_GATEWAY (502): External service errors

## File Organization

### Directory Structure

```
src/
├── shared/
│   ├── domain/
│   │   └── errors/
│   │       ├── domain-base.error.ts
│   │       └── index.ts
│   └── infrastructure/
│       └── errors/
│           ├── infrastructure-base.errors.ts
│           └── index.ts
└── modules/
    └── {module}/
        └── domain/
            └── errors/
                ├── {module}.errors.ts
                └── index.ts
```

### Naming Conventions

- Base classes: `{Layer}BaseError`
- Specific errors: `{Entity}{Reason}Error`
- File names: `{module}.errors.ts` or `{layer}-base.error.ts`
- Always use `.errors.ts` suffix for error files
- Export all errors through barrel `index.ts`

## Integration with Use Cases

### Error Usage in Use Cases

- Import errors from domain/errors or shared/domain/errors
- Throw specific errors, not generic ones
- Include contextual information from use case parameters
- Let errors propagate to GraphQL filter
- Do not catch and re-throw without adding value
- Log error context before throwing when necessary

### Error Response Flow

1. Use case throws specific error
2. Error bubbles up through application layer
3. GraphQL resolver doesn't catch (unless specific handling needed)
4. GraphQL exception filter catches error
5. Filter transforms and logs appropriately
6. GraphQL response includes formatted error
7. Client receives structured error with extensions
