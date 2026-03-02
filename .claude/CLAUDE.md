# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Playwright + TypeScript E2E test automation framework for the **TTT (TimeTrackingTool)** web application at `https://ttt-{env}.noveogroup.com`. Supports multiple environments (qa-1, qa-2, dev-new, preprod, stage, timemachine) and browsers (Chrome, Firefox, Edge).

## Commands

```bash
# Run all tests headless
npm test

# Run tests with browser visible
npm run test:headed

# Run a single spec
npx playwright test e2e/tests/vacation-tc1.spec.ts

# Run by project (browser × tag matrix: chrome-debug, firefox-regress, etc.)
npx playwright test --project=chrome-regress

# Run by tag
npx playwright test --grep @smoke

# View HTML report
npx playwright show-report
```

No build step. No linter configured. TypeScript is compiled on-the-fly by Playwright.

## Architecture

5-layer architecture with strict downward dependencies:

```
Test Specs          e2e/tests/*.spec.ts        — scenario orchestration, tagged @debug/@smoke/@regress
    ↓
Fixtures            e2e/fixtures/*.ts          — reusable multi-step workflows (plain classes, NOT test.extend)
    ↓
Page Objects        e2e/pages/*.ts             — UI locators + intent-driven methods (composition, no inheritance)
    ↓
Config + Data       e2e/config/, e2e/data/     — YAML configs + parameterized test data classes
    ↓
Playwright API
```

### Critical Architectural Rules

1. **Fixtures are plain classes** instantiated in the test body — never use `test.extend()`.
2. **Config is per-test** — each spec creates `new TttConfig()` then `new GlobalConfig(tttConfig)`.
3. **No raw locators in specs** — all interactions go through page objects or fixtures.
4. **No hardcoded test data in specs** — all dynamic data lives in dedicated `*Data` classes under `e2e/data/`.
5. **Every verification step**: `globalConfig.delay()` → assertion → screenshot capture.
6. **Page objects use composition, not inheritance** — no base class.

## Naming Conventions

| Artifact | Pattern | Example |
|----------|---------|---------|
| Test spec | `{feature}-tc{N}.spec.ts` | `vacation-tc1.spec.ts` |
| Data class | `{Feature}Tc{N}Data` | `VacationTc1Data` |
| Fixture | `{Feature}Fixture` | `VacationCreationFixture` |
| Page object | `{PageName}Page` or `{Dialog}Dialog` | `MyVacationsPage`, `VacationCreateDialog` |
| Doc file | `{feature}_tc{N}.md` | `docs/vacation_tc1.md` |

## Test Spec Boilerplate

### UI Test (default)

```typescript
import { test } from "@playwright/test";

test("test_name @regress", async ({ page }, testInfo) => {
  const tttConfig = new TttConfig();
  const globalConfig = new GlobalConfig(tttConfig);
  const data = new SomeTestData();
  await globalConfig.applyViewport(page);

  // Instantiate fixtures
  const login = new LoginFixture(page, tttConfig, data.username, globalConfig);
  const verification = new VerificationFixture(page, globalConfig);
  const logout = new LogoutFixture(page, tttConfig, globalConfig);

  // Workflow
  await login.run();
  // ... interactions via fixtures/page objects ...
  await logout.runViaDirectUrl();
  await page.close();
});
```

### API Test (no browser)

For pure API tests, use `{ request }` instead of `{ page }`. No GlobalConfig, login/logout, viewport, or page objects needed.

```typescript
import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test("api_test_name @regress", async ({ request }, testInfo) => {
  const tttConfig = new TttConfig();
  const data = new ApiTestData();
  const apiToken = tttConfig.apiToken;
  expect(apiToken, "apiToken must be configured for this env").toBeTruthy();

  const url = tttConfig.buildUrl("/api/ttt/v1/...");
  const headers = { API_SECRET_TOKEN: apiToken };

  const response = await request.get(url, { headers });
  expect(response.status()).toBe(200);

  // Save JSON artifact
  const body = await response.json();
  const filePath = testInfo.outputPath("response.json");
  await writeFile(filePath, JSON.stringify(body, null, 2), "utf-8");
  await testInfo.attach("response", { path: filePath, contentType: "application/json" });
});
```

## Configuration System

- **`e2e/config/global.yml`** — framework settings (timeout, viewport, delay, window position)
- **`e2e/config/ttt/ttt.yml`** — app defaults (URL template with `***` placeholder for env, default env, language)
- **`e2e/config/ttt/envs/*.yml`** — per-environment overrides
- `TttConfig` resolves `***` in URL template with the env name, and loads env-specific YAML (`envs/{env}.yml`) for properties like `apiToken`. `GlobalConfig` wraps `TttConfig` and adds viewport/delay helpers.

## Selector Priority

1. Role-based (`getByRole`) — preferred
2. Stable attributes (`data-qa`, `aria-*`)
3. Scoped CSS
4. Text-based (only for static EN text)
5. XPath (last resort)

Multi-strategy fallback via `resolveFirstVisible()` in `e2e/utils/locatorResolver.ts` — tries candidates in order, returns first visible.

**Important:** Use `exact: true` in `getByRole` when the name is a substring of other element names (e.g., `{ name: "All", exact: true }` to avoid matching "ASSIGNMENTS_ALL").

## Key Utilities

- **`locatorResolver.ts`** — `resolveFirstVisible(candidates[])` and `pollForMatch(candidates[])` for resilient element resolution
- **`colorAnalysis.ts`** — DOM color introspection for verifying success (green) / error (red) states
- **`stringUtils.ts`** — `escapeRegExp()`, `slugify()`, `formatTimestamp()` (ddmmyy_HHmm format)

## TTT UI Component Quirks

- **rc-checkbox:** TTT uses the `rc-checkbox` React component. Playwright's `.check()`/`.uncheck()` do NOT propagate state — always use `.click()` instead. Verify state after clicking with `expect(checkbox).toBeChecked()` / `.not.toBeChecked()`.
- **Dialog naming:** TTT modals use present participles — "Creating key", "Editing key", "Deleting key" (not imperative forms).
- **Dialog data race:** After opening edit dialogs, checkbox/form state may not be settled. Wait for expected state (e.g., `expect(checkbox).toBeChecked({ timeout: 5000 })`) before interacting.

## Artifact Saving

Use `testInfo.outputPath()` + write to disk + `testInfo.attach({ path })` to save artifacts to `test-results/`. Do NOT use `testInfo.attach({ body })` alone — it only embeds in the HTML report, leaving `test-results/` empty.

```typescript
// Screenshots — use page.screenshot({ path }) to write to disk
const filePath = testInfo.outputPath(name);
await this.page.screenshot({ fullPage: true, path: filePath });
await testInfo.attach(name, { path: filePath, contentType: "image/png" });

// Text artifacts — use fs writeFile
import { writeFile } from "node:fs/promises";
const filePath = testInfo.outputPath("artifact.txt");
await writeFile(filePath, content, "utf-8");
await testInfo.attach("artifact", { path: filePath, contentType: "text/plain" });

// JSON artifacts (API responses)
const jsonPath = testInfo.outputPath("response.json");
await writeFile(jsonPath, JSON.stringify(body, null, 2), "utf-8");
await testInfo.attach("response", { path: jsonPath, contentType: "application/json" });
```

## Playwright Config

Projects are generated as a matrix of `BROWSERS × TAG_CONFIG`:
- Browsers: chrome, firefox (configurable in `playwright.config.ts`)
- Tags: debug, smoke, regress
- All projects run headed with screenshots on failure, traces on first retry, video retained on failure
- Global timeout: 60s, expect timeout: 10s

## Data Classes

- One class per test case, env-var-driven with fallback defaults
- Expose computed properties (search terms, date patterns, timestamps)
- Timestamp format: `ddmmyy_HHmm` for test data uniqueness across runs

## Multi-Browser Handling

- Chrome/Edge: CDP protocol for window positioning
- Firefox: `window.moveTo()` fallback, custom user prefs for dark theme and move-resize
- Errors silently ignored for headless/unsupported environments

## MCP Integration (Development-Time)

Two MCP servers are available for use during test development with Claude Code.
**These are NOT runtime dependencies** — all generated tests must run via `npx playwright test`.

### Playwright MCP (`@playwright/mcp`) — via Official Plugin

Provided by the **official Anthropic Playwright plugin** (`playwright@claude-plugins-official`),
installed as a Claude Code plugin. The plugin launches `@playwright/mcp` with `--browser chromium`.

**No `.mcp.json` entry is needed** — the plugin manages the MCP server lifecycle automatically.

Used for UI reconnaissance during test generation:
- Explore TTT pages and capture accessibility snapshots (inline, with diff-based updates)
- Discover selectors and element roles
- Validate UI flows before writing test code
- MCP tools: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_evaluate`, etc.

**Workflow:** See `docs/mcp/RECON_WORKFLOW.md` for the full reconnaissance → codegen pipeline.

### Playwright CLI (`playwright-cli` skill)

An alternative browser automation interface available via the `playwright-cli` skill.
Uses `npx playwright-cli` bash commands (`open`, `fill`, `click`, `snapshot`, `close`).

**When to use which:**
- **MCP Plugin** — preferred for reconnaissance sessions; inline snapshots with diff compression save context tokens
- **playwright-cli** — useful for quick one-off checks or when MCP plugin is unavailable; zero-setup, works with any installed browser

Both tools produce the same accessibility snapshots and can be used interchangeably for selector discovery.

### Postgres MCP Pro (`crystaldba/postgres-mcp`)

Configured in `.claude/.mcp.json` in **restricted (read-only) mode** for future DB integration.
Currently available for schema exploration and test data discovery only.
**No test code should depend on this yet.**

```bash
# Requires POSTGRES_URI env var
npm run mcp:postgres
```

### Hybrid Architecture Rule

```
MCP / playwright-cli = development-time reconnaissance tools (used by Claude Code)
CLI                   = runtime test execution (used by npx playwright test / CI)
```

Generated `.spec.ts` files must NEVER import from or depend on MCP packages.
