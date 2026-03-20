# Dynamic Test Data Generation

## Overview

Data classes support three modes via `testDataMode` in `global.yml`:
- `static` — hardcoded defaults + env vars (original behavior)
- `dynamic` — queries PostgreSQL for real employee/project data
- `saved` — not yet implemented

## Factory Pattern

Each data class has `static async create(mode: TestDataMode, tttConfig: TttConfig)`:

```typescript
static async create(mode: TestDataMode, tttConfig: TttConfig): Promise<XxxData> {
  if (mode === "static") return new XxxData();
  if (mode === "saved") throw new Error('testDataMode "saved" is not yet implemented');

  const db = new DbClient(tttConfig);
  try {
    // Query PostgreSQL for dynamic data
    const result = await findSomething(db);
    return new XxxData(result.field1, result.field2);
  } finally {
    await db.close();
  }
}
```

Specs call: `const data = await XxxData.create(globalConfig.testDataMode, tttConfig);`

## DbClient

`e2e/config/db/dbClient.ts` — Pool-based `pg` client:
- Pool config: `max: 2`, `idleTimeoutMillis: 5000`, `connectionTimeoutMillis: 10000`
- Methods: `query<T>(sql, params)`, `queryOne<T>(sql, params)`, `close()`
- Throws if `tttConfig.dbHost` is empty (env has no DB configured)

## TttConfig DB Fields

Loaded from env YAML (`e2e/config/ttt/envs/{env}.yml`):
- `dbHost` — `String(envData["dbHost"] ?? "")`
- `dbPort` — `Number(envData["dbPort"] ?? 5433)`
- `dbName` — `String(envData["initialDatabase"] ?? "ttt")`
- `dbUsername` — `String(envData["dbUsername"] ?? "")`
- `dbPassword` — `String(envData["dbPassword"] ?? "")` (js-yaml parses `123456` as number)

Uses `String()` not `readString()` because `readString()` throws on empty strings.

## Query Modules

Separate files in `e2e/data/queries/`:

| File | Functions | Tables Used |
|------|-----------|-------------|
| `vacationQueries.ts` | `findRandomEmployee(db)`, `hasVacationConflict(db, login, start, end)` | `ttt_backend.employee`, `employee_global_roles`, `ttt_vacation.vacation`, `ttt_vacation.employee` |
| `reportQueries.ts` | `findEmployeeWithProject(db)` | `ttt_backend.employee`, `employee_global_roles`, `project_member`, `project` |
| `adminQueries.ts` | `findAdminEmployee(db)` | `ttt_backend.employee`, `employee_global_roles` |

## Vacation Date Conflict Resolution

Dynamic vacation data finds a Mon–Sun window without overlap:
1. Start from next Monday relative to today
2. Check `ttt_vacation.vacation` for overlapping records via login-joined employee IDs
3. Shift +7 days on conflict, up to 8 attempts
4. Dates formatted as `dd.mm.yyyy` for TTT UI

## DB Schema Key Facts

- `ttt_backend.employee` — `login` (unique), `enabled`, `is_contractor`, `name` (display name)
- `ttt_backend.employee_global_roles` — `employee` (FK to id), `role_name` (e.g., ROLE_EMPLOYEE, ROLE_ADMIN)
- `ttt_backend.project` — `status` values: ACTIVE, FINISHED, SUSPENDED, CANCELED, ACCEPTANCE, UNCONFIRMED
- `ttt_vacation.employee` — separate table, linked by `login` (same as backend)
- `ttt_vacation.vacation` — `employee` (FK to ttt_vacation.employee.id), `start_date`, `end_date`

## Implemented Data Classes

| Class | Dynamic Fields | Constants (not overridden) |
|-------|---------------|---------------------------|
| `VacationTc1Data` | `username`, `startDate`, `endDate` | `expectedStatus`, `expectedVacationType`, `notificationText` |
| `ReportTc1Data` | `username`, `projectName`, `reportValue` | `taskName` ("autotest") |
| `AdminTc1Data` | `username`, `createdBy` | `apiKeyName` (timestamp-generated), `allowedMethodsAfterCreate` |
| `ApiTc1Data` | — (no changes) | All fields |
