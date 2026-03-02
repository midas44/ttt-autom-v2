# Dynamic Test Data Analysis

Analysis of how each test parameter can be dynamically sourced at runtime,
primarily via PostgreSQL mining from the TTT database (QA-1 environment).

## Parameter Categories

| Category | Symbol | Description | Example |
|----------|--------|-------------|---------|
| **DB-mined** | `DB` | Queried from PostgreSQL at test setup | employee logins, project names, display names |
| **Generated** | `GEN` | Random or timestamp-based, created at runtime | comments, API key names, dates, report values |
| **Constant** | `CONST` | Fixed value, same across all runs | endpoint paths, header names, UI text, permission lists |

## Summary Matrix

| Test case | DB | GEN | CONST | Total | Doc |
|-----------|-----|-----|-------|-------|-----|
| vacation_tc1 | 1 | 4 | 4 | 9 | [vacation_tc1.md](vacation_tc1.md) |
| report_tc1 | 2 | 5 | 0 | 7 | [report_tc1.md](report_tc1.md) |
| admin_tc1 | 2 | 2 | 2 | 6 | [admin_tc1.md](admin_tc1.md) |
| api_tc1 | 0 | 0 | 3 | 3 | [api_tc1.md](api_tc1.md) |
| **Total** | **5** | **11** | **9** | **25** | |

## Database Connection

`TttConfig` already loads DB connection properties from env YAML (`e2e/config/ttt/envs/qa-1.yml`):

```yaml
dbHost: "10.0.4.220"
dbPort: 5433
initialDatabase: "ttt"
dbUsername: "ttt"
dbPassword: 123456
```

A runtime utility (e.g., `e2e/utils/dbClient.ts`) would use these with the `pg` npm package.

## Relevant Schemas

| Schema | Purpose | Key tables |
|--------|---------|------------|
| `ttt_backend` | Core app — employees, projects, tasks, tokens | `employee`, `employee_global_roles`, `project`, `project_member`, `token_permissions` |
| `ttt_vacation` | Vacation module — requests, approvals | `vacation`, `employee` (separate from backend) |
| `ttt_calendar` | Calendar events | — |
| `ttt_email` | Email notifications | — |

## Shared SQL Patterns

Reusable queries referenced across multiple test case docs.

### Pick random enabled employee by role

```sql
SELECT be.login, be.name
FROM ttt_backend.employee be
JOIN ttt_backend.employee_global_roles egr ON egr.employee = be.id
WHERE be.enabled = true
  AND egr.role_name = $role   -- 'ROLE_EMPLOYEE', 'ROLE_ADMIN', etc.
ORDER BY random()
LIMIT 1
```

Available roles: `ROLE_ACCOUNTANT`, `ROLE_ADMIN`, `ROLE_CHIEF_ACCOUNTANT`, `ROLE_CHIEF_OFFICER`,
`ROLE_CONTRACTOR`, `ROLE_DEPARTMENT_MANAGER`, `ROLE_EMPLOYEE`, `ROLE_OFFICE_HR`,
`ROLE_PROJECT_MANAGER`, `ROLE_TECH_LEAD`, `ROLE_VIEW_ALL`

### Pick random enabled employee with active project membership

```sql
SELECT be.login, be.name
FROM ttt_backend.employee be
JOIN ttt_backend.project_member pm ON pm.employee = be.id
JOIN ttt_backend.project p ON pm.project = p.id
WHERE be.enabled = true
  AND p.status = 'ACTIVE'
ORDER BY random()
LIMIT 1
```

### Resolve employee display name from login

```sql
SELECT name FROM ttt_backend.employee WHERE login = $login
```

The `name` column contains the latin full name (e.g., `pvaynmaster` -> `Pavel Weinmeister`).
This matches UI display in columns like "Created by".

### Get active projects for a given employee

```sql
SELECT p.name
FROM ttt_backend.project p
JOIN ttt_backend.project_member pm ON pm.project = p.id
JOIN ttt_backend.employee be ON pm.employee = be.id
WHERE be.login = $login
  AND p.status = 'ACTIVE'
ORDER BY p.name
```

Project statuses: `ACCEPTANCE`, `ACTIVE`, `CANCELED`, `FINISHED`, `SUSPENDED`, `UNCONFIRMED`

### Check existing vacations for an employee (overlap avoidance)

```sql
SELECT v.start_date, v.end_date, v.status
FROM ttt_vacation.vacation v
JOIN ttt_vacation.employee ve ON v.employee = ve.id
WHERE ve.login = $login
  AND v.status NOT IN ('DELETED', 'REJECTED')
ORDER BY v.start_date
```

Vacation statuses: `APPROVED`, `DELETED`, `NEW`, `PAID`, `REJECTED`

### Get all API permissions

```sql
SELECT DISTINCT apipermission
FROM ttt_backend.token_permissions
ORDER BY apipermission
```

Returns 22 distinct values (as of QA-1).

## Implementation Notes

- **Cross-schema join:** `ttt_backend.employee` and `ttt_vacation.employee` are separate tables
  linked by `login` column. Vacation queries must use `ttt_vacation.employee` for the JOIN.
- **`name` column:** The `ttt_backend.employee.name` column stores the latin full name
  (e.g., "Pavel Weinmeister"). There are also separate `latin_first_name`/`latin_last_name`
  and `russian_first_name`/`russian_last_name` columns.
- **Pool sizes:** ROLE_EMPLOYEE = 386 employees, ROLE_ADMIN = 5 employees.
  Admin pool is small — consider hardcoding or using a fixed list rather than random selection.
