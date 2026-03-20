# TTT API Quirks

## Clock Test Endpoints

TTT exposes test clock endpoints at `/api/ttt/v1/test/clock` for time manipulation in test environments.

### Time Formats

- **Response format:** Nanosecond precision, no timezone — `2026-03-02T17:25:49.676467168`
- **PATCH request format:** ISO 8601 without timezone suffix — `2026-03-03T17:25:49` (no `Z`, no fractional seconds)
- **Regex for response:** `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+$/`

### Endpoints

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/v1/test/clock` | — | `{ "time": "..." }` |
| PATCH | `/v1/test/clock` | `{ "time": "YYYY-MM-DDTHH:mm:ss" }` | `{ "time": "..." }` |
| POST | `/v1/test/clock/reset` | — | `{ "time": "..." }` |

### Auth

All endpoints require `API_SECRET_TOKEN` header with the token from `tttConfig.apiToken` (loaded from env YAML).

### Verification Strategy

Use **date-based** verification (`YYYY-MM-DD`) rather than exact time matching to avoid flakiness from processing delays:

```typescript
// GOOD — date-based, resilient
expect(data.extractDate(patchedTime)).toBe("2026-03-03");

// BAD — exact time, flaky due to server processing time
expect(patchedTime).toBe("2026-03-03T17:25:49.000000000");
```

**Discovered:** api-tc1 — verified against live QA-1 environment.

## configUtils.readString() — Empty String Gotcha

`readString()` in `e2e/config/configUtils.ts` **throws on empty/whitespace strings** (line 66-68). This is intentional for most config fields but problematic for optional properties like `apiToken` where empty string means "not configured."

**Workaround:** Use `String(value ?? "")` directly instead of `readString()`:

```typescript
// WRONG — throws "Empty string for apiToken" on dev-new env
this.apiToken = readString(envData["apiToken"], "", "apiToken");

// CORRECT — allows empty string as valid value
this.apiToken = String(envData["apiToken"] ?? "");
```

**Affected envs:** `dev-new.yml` has `apiToken: ""`.

**Discovered:** api-tc1 implementation — TttConfig apiToken loading.

## TttConfig Env-Specific YAML Loading

`TttConfig` now loads the env-specific YAML file (`e2e/config/ttt/envs/{env}.yml`) after resolving `this.env`. This enables access to env-specific properties like `apiToken`, `dbHost`, `casLogin`, etc.

Available env properties (from `qa-1.yml`):
- `dbHost`, `dbPort`, `initialDatabase`, `dbUsername`, `dbPassword` — now exposed as `TttConfig` fields
- `apiToken` — API secret token (empty on dev-new)
- `casLogin` — CAS login flag (false on qa-1, empty on dev-new)

**Important:** `dbPassword: 123456` in YAML is parsed as a number by js-yaml. `TttConfig` uses `String()` to coerce all DB fields safely.
