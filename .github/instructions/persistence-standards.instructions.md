---
applyTo: '**'
---

# Persistence with TypeORM

- Keep the domain pure: do not use TypeORM entities in the domain layer; map them in adapters.
- Repositories as adapters: implement domain ports using Repository/QueryBuilder.
- Transactions: use QueryRunner with try/catch/finally; do not leak QueryRunner outside infrastructure.
- N+1 mitigation (TypeORM):
  - Prefer joins (leftJoinAndSelect), relation selects, and partial projections.
  - Batch queries with In() and subqueries in QueryBuilder when applicable.
  - Integrate DataLoader from resolvers to batch repository calls (a single query per set of IDs).
- Pagination: use skip/take with stable ordering (id/createdAt) or cursors when needed.
- Indexes and constraints: define indexes and unique constraints aligned with access patterns.
- Errors: map QueryFailedError (e.g., 23505 unique_violation, 23503 foreign_key_violation) to domain exceptions.
