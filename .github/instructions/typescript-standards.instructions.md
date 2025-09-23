---
applyTo: '**'
---

# TypeScript: code generation, error handling and documentation

## Naming and organization conventions

### General naming rules

- Use PascalCase for classes, interfaces, types, enums and decorators
- Use camelCase for variables, functions, methods and properties
- Use kebab-case for filenames and directories
- Use SCREAMING_SNAKE_CASE for constants and environment variables
- Prefix private class members with an underscore (\_)
- Use full words instead of abbreviations with correct spelling
- Exceptions for standard abbreviations: API, URL, etc.
- Accepted short forms: `i`, `j` for loops, `err` for errors, `ctx` for contexts, `req`, `res`, `next` for middleware

### Naming conventions in Hexagonal Architecture

- Resolvers: `EntityResolver` (e.g., `UserResolver`)
- Use cases: `VerbEntityUseCase` (e.g., `CreateUserUseCase`)
- Domain services: `EntityDomainService` (e.g., `UserDomainService`)
- Repository interfaces: `EntityRepository` (e.g., `UserRepository`)
- Repository implementations: `EntityTypeOrmAdapter` (e.g., `UserTypeOrmAdapter`)
- Domain events: `EntityVerbedEvent` (e.g., `UserCreatedEvent`)
- Domain exceptions: `EntityDomainException` (e.g., `UserNotFoundDomainException`)
- DTOs: `Dto` suffix, entities with `Entity`, services with `Service`

### File organization rules

- Group related files into feature modules following hexagonal architecture
- Use barrel exports with `index.ts` for clean imports
- Place configuration files in `src/config/` with a typed factory pattern
- Store shared utilities in `src/shared/` organized by layer (domain/application/infrastructure)

### Import organization rules

- First Node.js built-in modules
- Second external libraries
- Third internal imports with path mapping (`@/`, `@config/`, `@shared/`, `@modules/`)
- Lastly relative imports (avoid when possible)

## TypeScript code generation guidelines

### Basic principles

- Always declare explicit types for variables and functions (parameters and return)
- Avoid using `any` — create necessary, precise and descriptive types
- Use TypeScript strict mode
- Document public classes and methods with JSDoc
- Do not leave blank lines inside a function
- One export per file
- Write self-explanatory code with clear intent
- Implement appropriate type safety across all layers
- Use `readonly` properties for immutable structures
- Leverage discriminated unions for type safety in complex scenarios

### JSDoc conventions

- Write JSDoc in Spanish.
- Document: public classes, public methods/functions, use cases, repository interfaces, DTOs, domain/infrastructure mappers and custom errors.
- Keep a concise one-line summary, optional description and then tags.
- Do not duplicate types already expressed in TypeScript; use JSDoc to clarify intent, constraints and thrown errors.
- Recommended tags: @param, @returns, @throws, @remarks, @example, @deprecated, @see, @public/@internal, @typeParam (for generics).
- GraphQL/Nest: document resolvers briefly; do not repeat decorator metadata in JSDoc.
- Do not include examples in this document section.

### Function generation rules

- Write short functions with a single purpose (fewer than 20 statements)
- Name functions with a verb and a descriptive noun
- For boolean returns, use `isX`, `hasX`, `canX`, etc.
- For void actions, use `executeX`, `saveX`, etc.
- Avoid nesting blocks by using guard clauses and early returns
- Extract complex logic into utility functions
- Use higher-order functions (map, filter, reduce) to avoid nesting
- Use arrow functions for simple functions (fewer than 3 statements)
- Use named functions for non-simple functions
- Use default parameter values instead of checking for null/undefined
- Use the RO-RO pattern: objects for multiple parameters and results
- Declare necessary types for inputs and outputs
- Maintain a single level of abstraction

### Data handling rules

- Do not overuse primitive types — encapsulate data in composite types
- Avoid data validation in functions — use classes with internal validation
- Prefer data immutability
- Use `readonly` for data that does not change
- Use `as const` for immutable literals
- Validate data at the system boundaries

### Class generation rules

- Follow SOLID principles
- Prefer composition over inheritance
- Declare interfaces to define contracts
- Write small classes with a single purpose
- Fewer than 200 statements per class
- Fewer than 10 public methods per class
- Fewer than 10 properties per class

### Exception handling rules

- Use exceptions for unexpected errors
- Use specific and descriptive error types
- Provide context in error messages
- Define domain-specific errors
- Catch exceptions to:
  - Fix an expected problem
  - Add context
  - Otherwise, use a global handler
- Log errors with sufficient context

## DTOs and validation

### DTO generation rules

- Generate DTOs with class-validator decorators
- Use appropriate validation decorators:
  - `@IsString()`, `@IsNumber()`, `@IsBoolean()`, `@IsEmail()`, etc.
  - `@IsNotEmpty()`, `@IsOptional()`
  - `@MinLength()`, `@MaxLength()`, `@Min()`, `@Max()`
  - `@IsArray()`, `@ArrayMinSize()`, `@ArrayMaxSize()`
  - `@ValidateNested()`, `@Type()`
- Create nested validation for complex objects
- Generate custom validation decorators when needed
- Use class-transformer decorators for data transformation
- Create separate DTOs for different operations (Create, Update, etc.)
- MANDATORY `Dto` suffix for all DTO classes
- Keep DTOs immutable
- Use proper inheritance for shared validations
- Implement custom validators when necessary
- Use appropriate validation groups
- Handle validation errors properly

### Input validation rules

- Validate at the application boundaries
- Create comprehensive validation rules
- Generate custom validators for business rules
- Handle validation errors appropriately
- Create validation groups for different scenarios
- Implement conditional validation logic

## Error handling

### Exception generation rules

- Generate specific and descriptive error types
- Create domain-specific exceptions
- Generate application-specific exceptions
- Create infrastructure-specific exceptions
- Provide context and error messages
- Create error hierarchies with base classes
- Use appropriate exception filters
- Implement proper error mapping
- Handle infrastructure errors correctly
- Use appropriate logging
- Implement proper validation
- Return appropriate GraphQL errors
