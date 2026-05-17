# API Design Principles

The public API is Phase F work. E.9 only creates the schema placeholder and public developer page.

## Principles

- REST first, with `/v1` versioning from the first public endpoint.
- JWT-authenticated requests plus workspace-scoped API keys for server-to-server integrations.
- Explicit scopes such as `employees:read`, `employees:write`, `documents:read`, `activity:read`.
- Rate limited per workspace and per key.
- All mutations write to `activity_log`.
- API responses use stable IDs, ISO timestamps, and pagination by cursor.
- Breaking changes require a new version, never silent field changes.

## Initial endpoint candidates

- `GET /v1/employees`
- `GET /v1/employees/{id}`
- `GET /v1/documents`
- `GET /v1/leave-requests`
- `GET /v1/activity`

## Deferred

- Webhooks, write endpoints, SCIM, and bulk imports should wait until at least one Enterprise pilot demands them.
