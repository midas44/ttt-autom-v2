# TTT Automation Memory

## Index
- [TTT UI Quirks](ttt-ui-quirks.md) — rc-checkbox, dialog naming, race conditions
- [TTT API Quirks](ttt-api-quirks.md) — clock endpoints, time formats, readString gotcha, env YAML loading
- [Playwright Patterns](playwright-patterns.md) — artifact saving, selector gotchas, API test pattern
- [Dynamic Data](dynamic-data.md) — DbClient, query modules, factory pattern, DB schema, vacation conflict check

## Key Findings

### rc-checkbox Component
TTT uses `rc-checkbox` React component. Playwright's `.check()`/`.uncheck()` do NOT propagate state changes — must use `.click()` instead. See [ttt-ui-quirks.md](ttt-ui-quirks.md).

### Artifact Saving
`testInfo.attach({ body })` only embeds in HTML report, NOT in `test-results/` dir. Must use `testInfo.outputPath()` + write to disk + `attach({ path })`. See [playwright-patterns.md](playwright-patterns.md).

### Dialog Checkbox Race Conditions
After opening TTT dialogs, checkbox state may not be settled. Use `expect(checkbox).toBeChecked({ timeout })` before interacting. See [ttt-ui-quirks.md](ttt-ui-quirks.md).

### exact: true for Partial Name Matches
`getByRole('checkbox', { name: 'All' })` matches "ASSIGNMENTS_ALL", "PROJECTS_ALL" too. Always use `exact: true` when the name is a substring of other element names.

### TTT Dialog Naming Convention
TTT dialogs use present participles: "Creating key", "Editing key", "Deleting key" — not imperative forms.

### Pure API Test Pattern
Use `{ request }` fixture (not `{ page }`) for API-only tests. No GlobalConfig, login/logout, viewport needed. Auth via `API_SECRET_TOKEN` header with `tttConfig.apiToken`. See [ttt-api-quirks.md](ttt-api-quirks.md).

### readString() Rejects Empty Strings
`configUtils.readString()` throws on empty strings. For optional config properties (like `apiToken`), use `String(value ?? "")` directly. See [ttt-api-quirks.md](ttt-api-quirks.md).

### TTT Clock API Time Formats
Response: nanosecond precision (`2026-03-02T17:25:49.676467168`). PATCH body: no timezone suffix (`YYYY-MM-DDTHH:mm:ss`). Verify by date (`YYYY-MM-DD`) not exact time. See [ttt-api-quirks.md](ttt-api-quirks.md).

### Dynamic Test Data (testDataMode)
Data classes support `static async create(mode, tttConfig)` factory method. `dynamic` mode queries PostgreSQL for real data via `DbClient` + query modules in `e2e/data/queries/`. Sync constructors preserved. See [dynamic-data.md](dynamic-data.md).

### js-yaml Numeric Coercion
YAML values like `dbPassword: 123456` are parsed as numbers by js-yaml. Use `String(value)` to coerce safely. This is why DB fields use `String()` not `readString()`.

### TTT DB Schema Cross-Reference
`ttt_backend.employee.login` == `ttt_vacation.employee.login`. Vacation records link via `ttt_vacation.vacation.employee` → `ttt_vacation.employee.id`.

## User Preferences

### /update-knowledge: Skip Approval Step
When running `/update-knowledge`, propagate all findings automatically without asking for user approval. The user considers all new information valuable.
