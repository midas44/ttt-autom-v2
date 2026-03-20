# API TC1 — Dynamic Data Analysis

**Data class:** `e2e/data/ApiTc1Data.ts`
**Test spec:** `e2e/tests/api-tc1.spec.ts`

## Parameter Table

| # | Parameter | Static default | Category | Dynamic strategy |
|---|-----------|---------------|----------|-----------------|
| 1 | `clockEndpoint` | `/v1/test/clock` | CONST | API path — no mining needed |
| 2 | `authHeaderName` | `API_SECRET_TOKEN` | CONST | Header name — no mining needed |
| 3 | `timeFormatPattern` | `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+$/` | CONST | Server response format — no mining needed |

## Analysis

API TC1 has **no DB-mineable parameters**. All values are either:

- **API constants** — endpoint path, header name (defined by the application contract)
- **Response-derived** — computed at runtime from live server responses (`computeFutureTime()`,
  `extractDate()`, `computeFutureDate()`)

The test is already effectively "dynamic" in its data flow:

1. GET `/v1/test/clock` -> receive server time
2. Compute future time (+1 day) from response
3. PATCH clock with computed time
4. GET clock again -> verify date changed
5. Reset clock

No parameters depend on DB state. The `apiToken` used for authentication comes from
`TttConfig` (loaded from `e2e/config/ttt/envs/qa-1.yml`), not from the data class.

## Helper Methods (already in ApiTc1Data)

| Method | Input | Output | Purpose |
|--------|-------|--------|---------|
| `computeFutureTime(serverTime)` | `2026-03-02T17:19:33.65583421` | `2026-03-03T17:19:33` | +1 day, no fractional seconds, no TZ |
| `extractDate(timeString)` | `2026-03-02T17:19:33.65583421` | `2026-03-02` | Date portion only |
| `computeFutureDate(serverTime)` | `2026-03-02T17:19:33.65583421` | `2026-03-03` | +1 day, date only |

## Recommendation

**No changes needed for dynamic mode.** This test case should behave identically in
`static`, `dynamic`, and `saved` modes since all parameters are constants or computed
from live API responses.
