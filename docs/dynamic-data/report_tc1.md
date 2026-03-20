# Report TC1 — Dynamic Data Analysis

**Data class:** `e2e/data/ReportTc1Data.ts`
**Test spec:** `e2e/tests/report-tc1.spec.ts`

## Parameter Table

| # | Parameter | Static default | Category | Dynamic strategy |
|---|-----------|---------------|----------|-----------------|
| 1 | `username` | `vulyanov` | DB | Random enabled employee with active project membership |
| 2 | `projectName` | `HR` | DB | Active project the chosen employee is a member of |
| 3 | `taskName` | `autotest` | GEN | Prefix + timestamp, already unique |
| 4 | `reportValue` | `4.25` | GEN | Random quarter-hour value 0.25-8.00 |
| 5 | `searchTerm` | computed | GEN | Derived from projectName + taskName + timestamp |
| 6 | `rowPattern` | computed RegExp | GEN | Derived from taskName + timestamp |
| 7 | `dateLabel` | computed | GEN | Derived from current date via `formatDateColumn()` |

## Detailed Strategies

### 1. `username` — DB-mined

Pick a random enabled employee who is a member of at least one ACTIVE project.

```sql
SELECT DISTINCT be.login
FROM ttt_backend.employee be
JOIN ttt_backend.project_member pm ON pm.employee = be.id
JOIN ttt_backend.project p ON pm.project = p.id
WHERE be.enabled = true
  AND p.status = 'ACTIVE'
ORDER BY random()
LIMIT 1
```

**Why not just ROLE_EMPLOYEE?** The test creates a time report entry, which requires the
employee to be assigned to an active project. An employee without project membership would
fail at the project search step in the UI.

### 2. `projectName` — DB-mined

After selecting a username, pick one of their active projects.

```sql
SELECT p.name
FROM ttt_backend.project p
JOIN ttt_backend.project_member pm ON pm.project = p.id
JOIN ttt_backend.employee be ON pm.employee = be.id
WHERE be.login = $login
  AND p.status = 'ACTIVE'
ORDER BY random()
LIMIT 1
```

**UI autocomplete consideration:** The project name is typed into a search/autocomplete
field in the UI. Very short names (1-2 chars) may match too many results. Consider
filtering for `LENGTH(p.name) >= 3` or verifying uniqueness:

```sql
-- Ensure project name prefix is unique enough for autocomplete
SELECT p.name
FROM ttt_backend.project p
JOIN ttt_backend.project_member pm ON pm.project = p.id
JOIN ttt_backend.employee be ON pm.employee = be.id
WHERE be.login = $login
  AND p.status = 'ACTIVE'
  AND LENGTH(p.name) >= 3
ORDER BY random()
LIMIT 1
```

**Combined query (both username + projectName in one shot):**

```sql
SELECT be.login, p.name AS project_name
FROM ttt_backend.employee be
JOIN ttt_backend.project_member pm ON pm.employee = be.id
JOIN ttt_backend.project p ON pm.project = p.id
WHERE be.enabled = true
  AND p.status = 'ACTIVE'
  AND LENGTH(p.name) >= 3
ORDER BY random()
LIMIT 1
```

This eliminates the sequential dependency between the two DB-mined parameters.

### 3. `taskName` — Generated (no change)

Static prefix `autotest` combined with a timestamp in `searchTerm` constructor.
The timestamp (`formatTimestamp()` from `stringUtils.ts`) provides run uniqueness.

### 4. `reportValue` — Generated

Random decimal in 0.25 increments, range 0.25-8.00 (TTT quarter-hour granularity).

```typescript
function generateReportValue(): string {
  // 1-32 quarters → 0.25-8.00
  const quarters = Math.floor(Math.random() * 32) + 1;
  return (quarters * 0.25).toFixed(2);
}
```

**Note:** The static value `4.25` works but any value in the valid range should work.
Consider keeping values reasonable (1.00-6.00) to avoid edge-case UI behavior with
very small (0.25) or maximum (8.00) values.

### 5-7. Computed parameters (no change)

| Parameter | Derivation | Notes |
|-----------|-----------|-------|
| `searchTerm` | `${projectName} / ${taskName} ${timestamp}` | Auto-adapts to dynamic projectName |
| `rowPattern` | `new RegExp(\`${taskName}\\s+${timestamp}\`)` | Auto-adapts to dynamic taskName |
| `dateLabel` | `formatDateColumn()` from `stringUtils.ts` | Based on current date, always dynamic |

## Dependencies

```
username (DB) ──┐
                ├──> projectName (DB, filtered by username's memberships)
                │        └──> searchTerm (GEN, includes projectName)
                │
                └──> taskName + timestamp (GEN, independent)
                         └──> searchTerm (GEN)
                         └──> rowPattern (GEN)

reportValue (GEN, independent)
dateLabel (GEN, independent)
```

**Optimization:** Use the combined query to resolve `username` + `projectName` in a single
DB round-trip, then generate the remaining parameters from those values.
