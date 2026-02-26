# MCP Reconnaissance → Test Generation Workflow

## Overview

This workflow uses Playwright MCP to explore the TTT application UI,
then generates standard Playwright CLI test code that conforms to
the project's 5-layer architecture.

## Phase 1: Reconnaissance (Playwright MCP)

Use the Playwright MCP tools to explore the target feature:

1. **Navigate** to the TTT environment URL from `e2e/config/ttt/ttt.yml`
   (replace `***` with the target env, e.g., `qa-1`).

2. **Login** using known test credentials (check existing `LoginFixture`
   for the flow pattern — do NOT store credentials in these files).

3. **Capture accessibility snapshots** of each key page in the flow.
   Pay attention to:
   - Element roles and accessible names
   - `data-qa` attributes (our preferred selector strategy)
   - Form field types and validation states
   - Dynamic content areas (lists, tables, modals)
   - Loading states and transitions

4. **Document the flow** as a series of steps with the selectors
   discovered. Save raw snapshots to `docs/mcp/snapshots/` as
   reference (these are NOT committed to git — add to .gitignore).

5. **Identify edge cases** by exploring error states, empty states,
   boundary inputs.

## Phase 2: Selector Mapping

From the reconnaissance data, create a selector map for the feature:

- Prefer `getByRole()` with accessible name
- Fall back to `data-qa` attributes: `page.locator('[data-qa="..."]')`
- Use `resolveFirstVisible()` from `e2e/utils/locatorResolver.ts`
  when multiple selector strategies are needed
- NEVER use fragile selectors (auto-generated classes, nth-child, etc.)

Cross-reference with existing page objects in `e2e/pages/` — reuse
selectors that already exist rather than discovering new ones for
the same elements.

## Phase 3: Code Generation (Playwright CLI Target)

Generate code following the project's strict conventions:

### File Creation Checklist

For a new test case `{feature}-tc{N}`:

- [ ] `e2e/tests/{feature}-tc{N}.spec.ts` — test spec
- [ ] `e2e/data/{Feature}Tc{N}Data.ts` — test data class
- [ ] `e2e/pages/{PageName}Page.ts` — page object (only if new page)
- [ ] `e2e/fixtures/{Feature}Fixture.ts` — fixture (only if new workflow)
- [ ] `docs/{feature}_tc{N}.md` — test documentation

### Spec Structure (MUST follow this pattern)

```typescript
import { test } from "@playwright/test";

test("{descriptive_name} @regress", async ({ page }, testInfo) => {
  const tttConfig = new TttConfig();
  const globalConfig = new GlobalConfig(tttConfig);
  const data = new {Feature}Tc{N}Data();
  await globalConfig.applyViewport(page);

  // Instantiate fixtures (plain classes, NOT test.extend)
  const login = new LoginFixture(page, tttConfig, data.username, globalConfig);
  // ... feature-specific fixtures ...
  const logout = new LogoutFixture(page, tttConfig, globalConfig);

  // Workflow
  await login.run();
  // ... feature steps via fixtures and page objects ...
  // Every verification: globalConfig.delay() → assertion → screenshot
  await logout.runViaDirectUrl();
  await page.close();
});
```

### Rules (non-negotiable)

- No raw locators in specs — use page objects or fixtures
- No hardcoded data in specs — use Data classes
- Fixtures are plain classes with a `run()` or similar method
- Page objects use composition (no base class, no inheritance)
- Timestamp format for uniqueness: `ddmmyy_HHmm`
- Screenshots at every verification step
- `globalConfig.delay()` before every assertion
