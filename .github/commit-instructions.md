# Commit Message Guidelines

This project validates commit messages with @commitlint/config-conventional plus a few extra rules defined in `commitlint.config.js`. Below you’ll find what is strictly enforced vs. recommended best practices.

> Reference: Conventional Commits 1.0.0 and @commitlint/config-conventional rules.

## Required format (enforced)

Header structure:

```
type(scope): subject

[optional body]

[optional footer]
```

What is enforced by commitlint in this repo:

- type: must be a conventional type in lowercase
- scope: cannot be empty (must exist)
- subject: required line (no trailing period)
- header-max-length: 100 characters total for the first line
- body-max-line-length: 100 characters per line
- footer-max-line-length: 100 characters per line

If any of the above is violated, the commit will be rejected.

### Allowed types

The following types are accepted by @commitlint/config-conventional:

- build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test

### Allowed scopes (project convention)

These scopes are accepted by convention in this repository. Use the one that best fits the change:

- app, config, deps, deps-dev, docs, hello, lint, log, release, repo, scripts, security, shared, test, throttler, user

Note: commitlint enforces “scope not empty”, but does not restrict the values; this list is our guideline.

### Subject rules

- Keep it concise; do not end with a period
- Use imperative mood (e.g., “add”, “fix”, “update”)

## Body and footer

Enforced limits:

- Wrap lines at 100 characters (both body and footer)

Recommended formatting:

- Leave a blank line between header and body, and between body and footer
- Use footer for BREAKING CHANGE, issue references, or metadata

Breaking changes:

- You may indicate breaking changes with an exclamation mark after type/scope, e.g., `feat(core)!: ...`,
  or with a `BREAKING CHANGE:` footer. Prefer the footer for clarity.

### Examples

Correct:

```
feat(app): add health check endpoint

Expose a new /app/health endpoint reporting application status and DB connectivity.

BREAKING CHANGE: The old /status endpoint was removed. Use /app/health instead.
```

Incorrect (header too long):

```
feat(app): add health check endpoint that provides comprehensive application and database status information
```

## Tips and recommendations (not enforced but encouraged)

- Reference issues at the end of the body or footer (e.g., “Refs #123”)
- Keep subject ≤ 72 chars when possible (we still enforce 100 chars)
- Group related changes into one commit; avoid unrelated mixed changes
- Prefer small, descriptive commits for easier review and revert
- Prefer lowercase for subjects and scopes; kebab-case works well for multi-word scopes

## Valid message samples

- feat(user): add use case to update user profiles
- fix(security): correct CORS configuration for production
- docs(readme): update installation instructions
- refactor(shared): move correlation interceptor to its own module
- test(hello): add E2E tests for the say-hello endpoint
- chore(deps): update development dependencies to latest versions
