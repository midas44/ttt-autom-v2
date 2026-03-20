# Vacation TC1 — Dynamic Data Analysis

**Data class:** `e2e/data/VacationTc1Data.ts`
**Test spec:** `e2e/tests/vacation-tc1.spec.ts`

## Parameter Table

| # | Parameter | Static default | Category | Dynamic strategy |
|---|-----------|---------------|----------|-----------------|
| 1 | `username` | `slebedev` | DB | Random enabled employee with `ROLE_EMPLOYEE` |
| 2 | `startDate` | `01.03.2026` | GEN | Future Monday, 2-4 weeks from now |
| 3 | `endDate` | `07.03.2026` | GEN | startDate + 4-7 calendar days |
| 4 | `expectedStatus` | `New` | CONST | Always "New" after creation |
| 5 | `expectedVacationType` | `Administrative` | CONST | Determined by test scenario (unpaid toggle) |
| 6 | `expectedPaymentMonth` | `""` | CONST | Always blank for administrative vacations |
| 7 | `notificationText` | `"A new vacation..."` | CONST | UI string, no mining needed |
| 8 | `comment` | `autotest vacation_tc2+ {ts}` | GEN | Already uses timestamp — keep as-is |
| 9 | `periodPattern` | computed RegExp | GEN | Derived from startDate/endDate — no change |

## Detailed Strategies

### 1. `username` — DB-mined

Pick a random enabled employee with `ROLE_EMPLOYEE` who can create vacation requests.

```sql
SELECT be.login
FROM ttt_backend.employee be
JOIN ttt_backend.employee_global_roles egr ON egr.employee = be.id
WHERE be.enabled = true
  AND egr.role_name = 'ROLE_EMPLOYEE'
ORDER BY random()
LIMIT 1
```

**Pool size:** 386 enabled employees (QA-1).

**Additional filter (recommended):** Exclude contractors who may have restricted vacation access:

```sql
  AND (be.is_contractor IS NULL OR be.is_contractor = false)
```

### 2. `startDate` — Generated

Pick a future Monday 2-4 weeks from now, formatted as `dd.mm.yyyy`.

```typescript
function generateStartDate(): string {
  const now = new Date();
  const daysToMonday = (8 - now.getDay()) % 7 || 7; // next Monday
  const weeksOffset = 2 + Math.floor(Math.random() * 3); // 2-4 weeks
  const start = new Date(now);
  start.setDate(now.getDate() + daysToMonday + (weeksOffset - 1) * 7);
  const dd = String(start.getDate()).padStart(2, "0");
  const mm = String(start.getMonth() + 1).padStart(2, "0");
  const yyyy = start.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}
```

**Overlap check:** After selecting a username, verify no existing vacation overlaps:

```sql
SELECT COUNT(*) as conflicts
FROM ttt_vacation.vacation v
JOIN ttt_vacation.employee ve ON v.employee = ve.id
WHERE ve.login = $login
  AND v.status NOT IN ('DELETED', 'REJECTED')
  AND v.start_date <= $endDate::date
  AND v.end_date >= $startDate::date
```

If conflicts > 0, shift the date range forward by 1 week and retry.

### 3. `endDate` — Generated

startDate + 4-7 calendar days. Keep within the same month to simplify period pattern matching.

```typescript
function generateEndDate(startDate: string): string {
  const [dd, mm, yyyy] = startDate.split(".").map(Number);
  const start = new Date(Date.UTC(yyyy, mm - 1, dd));
  const offset = 4 + Math.floor(Math.random() * 4); // 4-7 days
  const end = new Date(start);
  end.setDate(start.getDate() + offset);
  // Format dd.mm.yyyy
  return `${String(end.getUTCDate()).padStart(2, "0")}.${String(end.getUTCMonth() + 1).padStart(2, "0")}.${end.getUTCFullYear()}`;
}
```

### 4-7. Constants

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `expectedStatus` | `"New"` | Always "New" after creation — fixed by business logic |
| `expectedVacationType` | `"Administrative"` | Test scenario toggles unpaid — always "Administrative" |
| `expectedPaymentMonth` | `""` | Always blank for administrative (unpaid) vacations |
| `notificationText` | `"A new vacation request has been created..."` | Static UI text |

### 8. `comment` — Generated (no change)

Already uses `autotest vacation_tc2+ {timestamp}` format with `ddmmyy_HHmm` timestamp.
Unique across runs. No DB mining needed.

### 9. `periodPattern` — Generated (no change)

Computed RegExp derived from `startDate`/`endDate`. The `buildPeriodPattern()` method in
`VacationTc1Data` already handles multiple display formats (numeric, full month, abbreviated).
When startDate/endDate become dynamic, the pattern auto-adapts.

## Dependencies

```
username (DB) ──> startDate/endDate (GEN, must avoid overlap with username's vacations)
                     └──> periodPattern (GEN, derived from dates)
                     └──> comment (GEN, independent)
```

The username must be resolved first, then dates can be generated with overlap avoidance.
