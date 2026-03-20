# Playwright Patterns & Gotchas

## Artifact Saving: testInfo.attach() body vs path

**Problem:** `testInfo.attach({ body: buffer })` only embeds data in the HTML report (`playwright-report/data/`). The `test-results/` directory remains empty for passing tests.

**Fix:** Write to disk via `testInfo.outputPath()` first, then attach with `path`:

### Screenshots
```typescript
const filePath = testInfo.outputPath(name);
await this.page.screenshot({ fullPage: true, path: filePath });
await testInfo.attach(name, {
  path: filePath,
  contentType: "image/png",
});
```

### Text artifacts
```typescript
import { writeFile } from "node:fs/promises";

const filePath = testInfo.outputPath("artifact-name.txt");
await writeFile(filePath, content, "utf-8");
await testInfo.attach("artifact-name", {
  path: filePath,
  contentType: "text/plain",
});
```

**Key:** `testInfo.outputPath()` creates files under `test-results/<test-dir>/` which Playwright preserves by default (`preserveOutput: 'always'`).

**Discovered:** admin-tc1 — artifacts dir was empty because VerificationFixture used `{ body }` pattern.
**Fixed in:** `VerificationFixture.captureScreenshot()` and `AdminApiKeyFixture.captureApiKeyValue()`.

## JSON Artifact Saving (API Tests)

Extension of the text artifact pattern for API response bodies:

```typescript
import { writeFile } from "node:fs/promises";

const body = await response.json();
const filePath = testInfo.outputPath("step1-get-clock.json");
await writeFile(filePath, JSON.stringify(body, null, 2), "utf-8");
await testInfo.attach("step1-get-clock", { path: filePath, contentType: "application/json" });
```

**Discovered:** api-tc1 — saving GET/PATCH/POST response bodies as JSON artifacts.

## Pure API Test Pattern (`{ request }` fixture)

For tests that only call REST endpoints (no browser UI), use Playwright's `{ request }` fixture instead of `{ page }`:

```typescript
test("api_test @regress", async ({ request }, testInfo) => {
  const tttConfig = new TttConfig();
  // No GlobalConfig, no login/logout, no viewport
  const headers = { API_SECRET_TOKEN: tttConfig.apiToken };
  const response = await request.get(tttConfig.buildUrl("/api/ttt/v1/test/clock"), { headers });
  expect(response.status()).toBe(200);
});
```

**Key differences from UI tests:**
- Fixture: `{ request }` not `{ page }`
- No `GlobalConfig`, `LoginFixture`, `LogoutFixture`, viewport, or page objects
- Auth via `API_SECRET_TOKEN` header with `tttConfig.apiToken`
- Guard: `expect(apiToken).toBeTruthy()` to fail fast on envs without token
- Verification: date-based (`YYYY-MM-DD`) to avoid flaky exact-time comparisons

**Discovered:** api-tc1 — first pure API test in the framework.

## Parallel Execution Constraints

Tests that operate on the same user account with shared mutable state (e.g., creating/deleting API keys) cannot run in parallel. Use `--workers=1` for such tests, or ensure unique user accounts per worker.

**Discovered:** admin-tc1 with `--repeat-each=3` and 3 workers — Create dialog didn't close due to concurrent key creation conflicts.
