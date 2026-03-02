# Admin TC1 — Dynamic Data Analysis

**Data class:** `e2e/data/AdminTc1Data.ts`
**Test spec:** `e2e/tests/admin-tc1.spec.ts`

## Parameter Table

| # | Parameter | Static default | Category | Dynamic strategy |
|---|-----------|---------------|----------|-----------------|
| 1 | `username` | `pvaynmaster` | DB | Random enabled employee with `ROLE_ADMIN` |
| 2 | `createdBy` | `Pavel Weinmeister` | DB | Resolved from chosen employee's `name` column |
| 3 | `apiKeyName` | `autotest-{ts}` | GEN | Already uses timestamp — keep as-is |
| 4 | `apiKeyNamePattern` | computed RegExp | GEN | Derived from apiKeyName — no change |
| 5 | `allowedMethodsAfterCreate` | 21-element array | CONST | Application-defined permission set |
| 6 | `allowedMethodsAfterEdit` | `""` | CONST | Always blank after unchecking "All" |

## Detailed Strategies

### 1. `username` — DB-mined

Pick a random enabled employee with `ROLE_ADMIN`.

```sql
SELECT be.login, be.name
FROM ttt_backend.employee be
JOIN ttt_backend.employee_global_roles egr ON egr.employee = be.id
WHERE be.enabled = true
  AND egr.role_name = 'ROLE_ADMIN'
ORDER BY random()
LIMIT 1
```

**Pool (QA-1, 5 admins):**

| login | name |
|-------|------|
| `ann` | Anna Astakhova |
| `ilnitsky` | Ivan Ilnitsky |
| `perekrest` | Galina Perekrest |
| `pvaynmaster` | Pavel Weinmeister |
| `slebedev` | Sergey Lebedev |

**Small pool note:** With only 5 admins, random selection is viable but the pool is small.
Consider fetching the full list and rotating through it, or just using a fixed list of known
admin logins to avoid the DB round-trip entirely.

### 2. `createdBy` — DB-mined

Resolve the display name from the chosen admin's `name` column.

```sql
SELECT name FROM ttt_backend.employee WHERE login = $login
```

**Combined query (both in one shot):**

```sql
SELECT be.login, be.name
FROM ttt_backend.employee be
JOIN ttt_backend.employee_global_roles egr ON egr.employee = be.id
WHERE be.enabled = true
  AND egr.role_name = 'ROLE_ADMIN'
ORDER BY random()
LIMIT 1
```

Returns both `login` (-> `username`) and `name` (-> `createdBy`) in a single query.

**`name` column semantics:** The `name` column stores the latin full name as a single string
(e.g., "Pavel Weinmeister"). This matches what the UI displays in the "Created" column
of the API keys table. There are also `latin_first_name`/`latin_last_name` columns
but the `name` column is the canonical display value.

### 3-4. Generated parameters (no change)

| Parameter | Current logic | Notes |
|-----------|--------------|-------|
| `apiKeyName` | `autotest-${yyyymmdd-HHmmss}` | Timestamp format in AdminTc1Data uses `yyyymmdd-HHmmss` (not the `ddmmyy_HHmm` from VacationTc1Data) |
| `apiKeyNamePattern` | `new RegExp(escaped(apiKeyName))` | Auto-adapts to dynamic apiKeyName |

### 5. `allowedMethodsAfterCreate` — Constant

The static array contains 21 permissions. The DB (`ttt_backend.token_permissions`) has 22
distinct values:

```sql
SELECT DISTINCT apipermission FROM ttt_backend.token_permissions ORDER BY apipermission
```

**DB permissions (22):** `ASSIGNMENTS_ALL`, `ASSIGNMENTS_VIEW`, `CALENDAR_EDIT`,
`CALENDAR_VIEW`, `EMPLOYEES_VIEW`, `FILES_VIEW`, `OFFICES_VIEW`, `PROJECTS_ALL`,
`REPORTS_APPROVE`, `REPORTS_EDIT`, `REPORTS_VIEW`, `STATISTICS_VIEW`, `SUGGESTIONS_VIEW`,
`TASKS_EDIT`, `VACATIONS_APPROVE`, `VACATIONS_CREATE`, `VACATIONS_DELETE`, `VACATIONS_EDIT`,
`VACATIONS_PAY`, `VACATIONS_VIEW`, `VACATION_DAYS_EDIT`, `VACATION_DAYS_VIEW`

**Static array (21):** Missing `FILES_VIEW` compared to DB.

**Recommendation:** Treat as **constant**. The UI "All" checkbox selects a fixed set defined
by the application, not derived from DB data. The discrepancy (21 vs 22) may be intentional
(FILES_VIEW might not be exposed in the UI). If dynamic sourcing is ever needed, query the
distinct permissions from the DB, but verify against the UI behavior first.

### 6. `allowedMethodsAfterEdit` — Constant

Always an empty string after unchecking the "All" checkbox. This represents the UI state
where no individual permissions are displayed — fixed by the test scenario.

## Dependencies

```
username (DB) ──> createdBy (DB, resolved from same employee record)
                     └──> can be fetched in a single query

apiKeyName (GEN, independent) ──> apiKeyNamePattern (GEN, derived)

allowedMethodsAfterCreate (CONST, independent)
allowedMethodsAfterEdit (CONST, independent)
```

**Optimization:** A single DB query resolves both `username` and `createdBy`.
