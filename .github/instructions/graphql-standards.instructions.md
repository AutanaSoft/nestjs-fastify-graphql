---
applyTo: '**'
---

# GraphQL: schema, resolvers, inputs, args, and DTOs

## Schema design rules

- Use meaningful, domain-driven names
- Follow GraphQL naming conventions:
  - PascalCase for types and enums
  - camelCase for fields and arguments
  - Descriptive field names
- Design client-friendly and efficient schemas
- Avoid exposing internal implementation details
- Use appropriate GraphQL scalars (String, Int, Float, Boolean, ID)

## Rules for GraphQL with Apollo Server

- Use @nestjs/graphql with Apollo Server on Express
- Configure GraphQL context for authentication/authorization
- Optimize field selection (GraphQLResolveInfo) for efficient queries
- Implement subscriptions using graphql-ws or an equivalent supported by Nest
- Handle errors with GraphQL-specific filters and clear messages
- Design the schema code-first with decorators and validated DTOs

## MANDATORY @ArgsType() pattern and DTOs

### Args DTO structure (MANDATORY)

Every resolver method MUST use an Args DTO that contains:

1. input: For data input (using `@InputType()`)
2. filter: For filtering query data (using `@InputType()`)
3. orderBy: For sorting returned data (using `@InputType()`)

### DTO naming convention (MANDATORY)

- All DTOs MUST have the `Dto` suffix
- Args DTOs: `{Operation}{Entity}ArgsDto` (e.g., `CreateUserArgsDto`, `FindUsersArgsDto`)
- Input DTOs: `{Operation}{Entity}InputDto` (e.g., `CreateUserInputDto`, `FindUsersInputDto`)
- Filter DTOs: `{Operation}{Entity}FilterDto` (e.g., `FindUsersFilterDto`, `FindUserByIdFilterDto`)
- OrderBy DTOs: `{Operation}{Entity}OrderByDto` (e.g., `FindUsersOrderByDto`)

### File structure for DTOs (MANDATORY)

Organize DTOs in the application layer:

```
application/dto/{entity}/
├── {operation}-{entity}-args.dto.ts
├── {operation}-{entity}-input.dto.ts
├── {operation}-{entity}-filter.dto.ts
└── {operation}-{entity}-order-by.dto.ts
```

### Args DTO generation rules (MANDATORY)

- Use the `@ArgsType()` decorator
- Include `input`, `filter`, and `orderBy` as appropriate for the operation
- Use `@Field()` with proper GraphQL types
- Use `@ValidateNested()` and `@Type()` for nested objects
- Use `@IsOptional()` for optional fields
- All Args DTOs must import and use the corresponding Input, Filter and OrderBy DTOs

### Input DTO generation rules (MANDATORY)

- Use the `@InputType()` decorator
- Include only data input fields
- Use class-validator decorators for validation
- For queries: include pagination fields (skip, take)
- For mutations: include the actual data to create/update
- Use appropriate GraphQL field types and validations

### Filter DTO generation rules (MANDATORY)

- Use the `@InputType()` decorator
- Include fields to filter query results
- Support common filter operations (equals, contains, search)
- For single-item queries: include identifier fields (id, etc.)
- For list queries: include searchable fields
- All fields must be optional with `@IsOptional()`
- Include a general `search` field for full-text search when applicable

### OrderBy DTO generation rules (MANDATORY)

- Use the `@InputType()` decorator
- Include `field` and `order` properties
- Create enums for the available sortable fields
- Create an enum for sort order (ASC, DESC)
- Use `@IsEnum()` validation for `field` and `order`
- Set reasonable defaults (usually `createdAt DESC`)
- Register enums with GraphQL using `registerEnumType()`

## Implementing GraphQL resolvers

- Keep resolvers thin and delegate to use cases
- Use dependency injection to inject application ports (use case interfaces)
- Handle only GraphQL-specific concerns (input validation, response formatting)
- Use appropriate GraphQL decorators and types
- Implement field resolvers for complex relationships
- Use the DataLoader pattern to mitigate N+1
- Implement GraphQL subscriptions for real-time features
- Handle errors appropriately in the GraphQL context
- ALWAYS use `@Args()` with the corresponding Args DTO
- Map domain entities to GraphQL types using private mapping methods

## GraphQL types and subscriptions

### GraphQL type generation rules

- Use the `@ObjectType()` decorator for GraphQL object types
- Use the `@InputType()` decorator for GraphQL input types
- Use the `@ArgsType()` decorator for argument classes
- Use the `@Field()` decorator with explicit types
- Implement validation with class-validator
- Use class-transformer for data transformation
- Create custom scalars for domain-specific types
- Use enums for predefined value sets
- Implement interfaces for common type structures

### GraphQL subscription generation rules

- Use the `@Subscription()` decorator for subscription resolvers
- Implement proper subscription filtering
- Use GraphQL subscription decorators appropriately
- Handle subscription lifecycle events
- Implement authorization in subscriptions
- Use async iterators for subscription data streams
- Follow the same Args DTO pattern for subscriptions
- Include only data input fields
- Use class-validator decorators for validation
- For queries: include pagination fields (skip, take)
- For mutations: include the actual data to create/update
- Use appropriate GraphQL field types and validations
