# New Test Case

Create a complete test case implementation from a test case brief.

## Input

`$ARGUMENTS` — path to a brief file (e.g., `prompts/my_test_prompt.md`) or inline description.

## Steps

### 1. Data Class

Create `e2e/data/[testCaseName]Data.ts`:

- Add `declare const process: { env: Record<string, string | undefined> };` at the top.
- Constructor parameters read from `process.env` with documented defaults via JSDoc.
- All properties `readonly`.
- Include computed properties and formatting methods (timestamps, patterns).
- Standard timestamp format: `ddmmyy_HHmm`.

### 2. Page Objects & Fixtures

- Read all existing page objects in `e2e/pages/` and fixtures in `e2e/fixtures/`.
- Reuse when possible. Only create new if test requires uncovered interactions.
- New methods must be intent-driven, not raw locator wrappers.
- For unstable elements, use multi-strategy fallback resolution.

### 3. Test Spec

Create `e2e/tests/[test-name].spec.ts` with the composition pattern:

```typescript
import { test } from "@playwright/test";

test("test_name @regress", async ({ page }, testInfo) => {
  const tttConfig = new TttConfig();
  const globalConfig = new GlobalConfig(tttConfig);
  const data = new SomeTestData();

  await globalConfig.applyViewport(page);

  // Instantiate fixtures
  const login = new LoginFixture(page, tttConfig, data.username, globalConfig);
  // ...

  // Execute workflow
  await login.run();
  // ...

  // Cleanup
  await logout.runViaDirectUrl();
  await page.close();
});
```

### 4. Documentation

Create `docs/[test-name].md`:

1. **Title** — checklist-friendly, no data, no icons.
2. **Detailed description** with **Steps** (numbered) and **Data** (bullet list of fields with defaults).

### 5. Verify

Run `npx playwright test e2e/tests/[test-name].spec.ts --project=debug` and fix issues.

List all created/modified files when done.
