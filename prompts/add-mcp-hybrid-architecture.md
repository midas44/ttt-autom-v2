# Prompt: Add MCP Servers & Redesign for Hybrid Playwright MCP / CLI Architecture

> **Target model:** Claude Code (Opus)
> **Scope:** Add Playwright MCP and Postgres MCP to the existing TTT Playwright+TS framework. Redesign the test generation workflow to use a hybrid MCP reconnaissance → CLI codegen pipeline. **Do NOT redesign anything related to DB usage yet** — the Postgres MCP is being added for future use only.

---

## 1. Context: Current State

This is an existing Playwright + TypeScript E2E test framework for the TTT (TimeTrackingTool) web app. Read `CLAUDE.md` at the project root for the full architecture description. Key points you must internalize before making changes:

- **5-layer architecture:** Specs → Fixtures (plain classes, NOT `test.extend`) → Page Objects (composition, no inheritance) → Config+Data → Playwright API.
- **Naming conventions** are strict — see the table in `CLAUDE.md`.
- **No raw locators in specs.** All interactions go through page objects or fixtures.
- **No hardcoded test data in specs.** Dynamic data lives in `*Data` classes under `e2e/data/`.
- **Config is per-test** via `new TttConfig()` → `new GlobalConfig(tttConfig)`.
- **Multi-browser matrix:** Chrome, Firefox, Edge. Projects are `{browser}-{tag}`.
- **Selector priority:** Role-based > stable attributes > scoped CSS > text > XPath.
- **Existing utilities:** `locatorResolver.ts` (multi-strategy fallback), `colorAnalysis.ts`, `stringUtils.ts`.

**All existing tests, architecture, naming, and patterns MUST remain intact and functional.** This is an additive change — nothing existing should break.

---

## 2. Objective

Introduce **two MCP servers** and a **hybrid test generation workflow** that uses Playwright MCP for UI reconnaissance / exploration / selector discovery, then generates production test code that runs via the standard Playwright CLI runner (`npx playwright test`).

### What "hybrid" means concretely

```
┌─────────────────────────────────────────────────────────┐
│                  TEST GENERATION PHASE                   │
│              (developer + Claude Code)                   │
│                                                         │
│  Playwright MCP ──► explore TTT UI                      │
│  (plugin or CLI)     - navigate flows                   │
│       │              - collect accessibility snapshots   │
│       │              - discover selectors & roles        │
│       │              - capture page structure            │
│       │                                                 │
│  Postgres MCP  ──► mine test database (future)          │
│       │              - discover realistic test data      │
│       │              - understand data relationships     │
│       │                                                 │
│       ▼                                                 │
│  Context gathered → Claude generates .spec.ts files     │
│  following existing framework conventions               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  TEST EXECUTION PHASE                    │
│              (CI/CD or local runner)                     │
│                                                         │
│  npx playwright test  ──► standard Playwright CLI       │
│       - deterministic, repeatable                       │
│       - multi-browser matrix (chrome/firefox/edge)      │
│       - HTML reports, traces, screenshots               │
│       - no MCP dependency at runtime                    │
└─────────────────────────────────────────────────────────┘
```

**Critical:** Generated test code MUST NOT depend on MCP at runtime. MCP is a development-time tool only. All produced `.spec.ts` files must run via `npx playwright test` with zero MCP dependencies.

---

## 3. Task Breakdown

### 3.1 — Playwright MCP via Official Plugin

The Playwright MCP is provided by the **official Anthropic Playwright plugin**
(`playwright@claude-plugins-official`), installed as a Claude Code plugin.

**Installation:**

```bash
# Install the plugin via Claude Code (interactive)
# Or it is auto-installed when enabled in the plugins marketplace
```

The plugin manages the `@playwright/mcp` server lifecycle automatically.
Its config is at `~/.claude/plugins/cache/claude-plugins-official/playwright/<version>/.mcp.json`.

**Plugin config customization** (if needed):

The default plugin config uses `@playwright/mcp@latest` without browser flags.
To use Playwright's bundled Chromium (instead of system Chrome), add `--browser chromium`:

```json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest", "--browser", "chromium"]
  }
}
```

**No `.claude/.mcp.json` entry is needed for Playwright** — the plugin replaces it.

**Alternative: `playwright-cli` skill** is also available for browser automation
via bash commands. Both approaches produce the same accessibility snapshots.

**`package.json` scripts** remain available for standalone MCP use outside Claude Code:

```json
{
  "scripts": {
    "mcp:playwright": "npx @playwright/mcp@latest --browser chromium --codegen typescript --test-id-attribute data-qa"
  }
}
```

### 3.2 — Install and Configure Postgres MCP Pro

Use **Postgres MCP Pro** (`crystaldba/postgres-mcp`) in **restricted (read-only) mode**.

> **Important:** Do NOT redesign anything related to DB usage in the test framework. This is infrastructure prep only. No test code should use the DB MCP yet. No DB-related fixtures, utilities, or data classes should be created or modified.

**Add to `.claude/.mcp.json`** (Playwright is handled by the plugin, only Postgres goes here):

```json
{
  "mcpServers": {
    "postgres": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "DATABASE_URI",
        "crystaldba/postgres-mcp",
        "--access-mode=restricted"
      ],
      "env": {
        "DATABASE_URI": "${POSTGRES_URI}"
      }
    }
  }
}
```

**Also register via Claude Code CLI:**

```bash
claude mcp add postgres -- docker run -i --rm -e DATABASE_URI crystaldba/postgres-mcp --access-mode=restricted
```

**Add to `package.json` scripts:**

```json
{
  "scripts": {
    "mcp:postgres": "docker run -i --rm -e DATABASE_URI crystaldba/postgres-mcp --access-mode=restricted"
  }
}
```

**Create placeholder environment config** in `e2e/config/db/` (directory only, with a README):

```
e2e/config/db/README.md
```

Content:

```markdown
# Database Configuration (Future)

Postgres MCP Pro is installed in read-only (restricted) mode.
DB integration into test data classes is planned but NOT YET implemented.

## Connection

Set the `POSTGRES_URI` environment variable:
```
export POSTGRES_URI="postgresql://readonly_user:password@host:5432/ttt_testdb"
```

## MCP Usage (development-time only)

The Postgres MCP is available for:
- Schema exploration during test design
- Test data mining / discovery
- Understanding data relationships

It is NOT used at test runtime.
```

### 3.3 — Create Reconnaissance Skills (Markdown Prompts)

Create a `docs/mcp/` directory with skill files that guide Claude Code during the reconnaissance → codegen workflow.

#### `docs/mcp/RECON_WORKFLOW.md`

```markdown
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
```

#### `docs/mcp/SELECTOR_STRATEGY.md`

```markdown
# Selector Strategy for TTT Application

## Priority (matches CLAUDE.md)

1. **Role-based** — `page.getByRole('button', { name: 'Submit' })`
2. **Stable attributes** — `page.locator('[data-qa="vacation-form"]')`
3. **Scoped CSS** — `page.locator('.vacation-list >> .item-row')`
4. **Text-based** — `page.getByText('Approved')` (only for static EN text)
5. **XPath** — last resort only

## MCP Reconnaissance → Selector Extraction

When reviewing an accessibility snapshot from Playwright MCP:

- `role "button" [name="Create Vacation"]` → `page.getByRole('button', { name: 'Create Vacation' })`
- `role "textbox" [name="Start Date"]` → `page.getByRole('textbox', { name: 'Start Date' })`
- `role "dialog" [name="Confirm Deletion"]` → `page.getByRole('dialog', { name: 'Confirm Deletion' })`

If the accessibility tree is ambiguous, check for `data-qa` attributes
using `browser_evaluate` in MCP or inspect the DOM.

## Multi-Strategy Fallback

For elements that are unreliable with a single strategy, use the
project's `resolveFirstVisible()` utility:

```typescript
import { resolveFirstVisible } from "../utils/locatorResolver";

const submitBtn = await resolveFirstVisible([
  page.getByRole('button', { name: 'Submit' }),
  page.locator('[data-qa="submit-btn"]'),
  page.locator('button.submit-primary'),
]);
```

## Playwright MCP `--test-id-attribute` Integration

The MCP server is configured with `--test-id-attribute data-qa`.
This means MCP snapshot output will highlight `data-qa` values,
making them easy to extract during reconnaissance.
```

### 3.4 — Update `.gitignore`

Add:

```
# MCP reconnaissance artifacts (not committed)
docs/mcp/snapshots/
playwright-profile/

# MCP user data
.playwright-mcp/
```

### 3.5 — Update `CLAUDE.md`

Add a new section to the existing `CLAUDE.md` (append, do not replace existing content):

```markdown
## MCP Integration (Development-Time)

Two MCP servers are configured for use during test development with Claude Code.
**These are NOT runtime dependencies** — all generated tests must run via `npx playwright test`.

### Playwright MCP (`@playwright/mcp`)

Used for UI reconnaissance during test generation:
- Explore TTT pages and capture accessibility snapshots
- Discover selectors and element roles
- Validate UI flows before writing test code
- Configured with `--codegen typescript` for TypeScript snippet generation
- Configured with `--test-id-attribute data-qa` to match project selector strategy

```bash
# Start manually (if needed outside Claude Code)
npm run mcp:playwright
```

**Workflow:** See `docs/mcp/RECON_WORKFLOW.md` for the full reconnaissance → codegen pipeline.

### Postgres MCP Pro (`crystaldba/postgres-mcp`)

Installed in **restricted (read-only) mode** for future DB integration.
Currently available for schema exploration and test data discovery only.
**No test code should depend on this yet.**

```bash
# Requires POSTGRES_URI env var
npm run mcp:postgres
```

### Hybrid Architecture Rule

```
MCP = development-time reconnaissance tool (used by Claude Code)
CLI = runtime test execution (used by npx playwright test / CI)
```

Generated `.spec.ts` files must NEVER import from or depend on MCP packages.
```

### 3.6 — Create MCP Quick-Reference for Developers

Create `docs/mcp/README.md`:

```markdown
# MCP Setup for TTT Test Development

## Prerequisites

- Node.js 18+
- Docker (for Postgres MCP)
- Claude Code with Opus model

## Quick Start

### 1. Playwright MCP (UI Reconnaissance)

Provided by the official Anthropic Playwright plugin or via `playwright-cli` skill.
When using Claude Code, MCP tools or CLI commands are available for:
- `browser_navigate` / `playwright-cli goto` — go to URLs
- `browser_snapshot` / `playwright-cli snapshot` — capture accessibility tree
- `browser_click` / `playwright-cli click` — interact with elements
- `browser_evaluate` / `playwright-cli eval` — run JS in the page

### 2. Postgres MCP (DB Exploration — Future)

```bash
export POSTGRES_URI="postgresql://readonly:pass@localhost:5432/ttt_db"
# Then in Claude Code, it will auto-connect via .mcp.json
```

Available tools: `list_schemas`, `list_objects`, `get_object_info`, `execute_sql`

### 3. Typical Session

```
Human: I need to create a new test for the expense report approval flow.

Claude Code:
  1. [reads RECON_WORKFLOW.md]
  2. [uses Playwright MCP to navigate to TTT, login, explore expense pages]
  3. [captures snapshots, maps selectors]
  4. [generates expense-tc1.spec.ts + ExpenseTc1Data.ts + page objects]
  5. [runs: npx playwright test e2e/tests/expense-tc1.spec.ts]
  6. [iterates on failures using error output + re-reconnaissance]
```

## File Structure

```
docs/mcp/
├── README.md                 ← this file
├── RECON_WORKFLOW.md          ← full reconnaissance → codegen workflow
├── SELECTOR_STRATEGY.md       ← selector extraction rules
└── snapshots/                 ← temporary MCP snapshots (.gitignored)
```

## Important Rules

- MCP is development-time only — zero MCP dependencies in test code
- All generated code must follow CLAUDE.md architecture rules
- Prefer `getByRole` selectors discovered via MCP accessibility snapshots
- Reuse existing page objects before creating new ones
- Test data comes from Data classes, not hardcoded values
```

---

## 4. Files to Create/Modify (Summary)

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `.claude/.mcp.json` | MCP server configuration (Postgres only; Playwright via plugin) |
| CREATE | `docs/mcp/README.md` | Developer quick-reference |
| CREATE | `docs/mcp/RECON_WORKFLOW.md` | Reconnaissance → codegen workflow |
| CREATE | `docs/mcp/SELECTOR_STRATEGY.md` | Selector extraction strategy |
| CREATE | `docs/mcp/snapshots/.gitkeep` | Placeholder for snapshot directory |
| CREATE | `e2e/config/db/README.md` | DB config placeholder (future) |
| MODIFY | `CLAUDE.md` | Append MCP Integration section |
| MODIFY | `package.json` | Add `@playwright/mcp` devDep + MCP scripts |
| MODIFY | `.gitignore` | Add MCP artifact exclusions |

## 5. Validation Checklist

After completing all changes, verify:

- [ ] `npm install` succeeds without errors
- [ ] `npm test` still runs all existing tests without regression
- [ ] Playwright MCP plugin is loaded (check `/mcp` in Claude Code)
- [ ] `.claude/.mcp.json` is valid JSON and recognized by Claude Code (`/mcp` shows Postgres server)
- [ ] No MCP imports exist in any file under `e2e/tests/`, `e2e/pages/`, `e2e/fixtures/`, or `e2e/data/`
- [ ] `CLAUDE.md` contains the new MCP section AND all original content is preserved
- [ ] `docs/mcp/snapshots/` is in `.gitignore`
- [ ] All new files follow the project's formatting conventions

## 6. What NOT to Do

- ❌ Do NOT modify any existing test specs, page objects, fixtures, or data classes
- ❌ Do NOT add MCP as a runtime dependency (it's devDependencies only)
- ❌ Do NOT create DB-related fixtures, data classes, or test utilities
- ❌ Do NOT change the existing `playwright.config.ts` (MCP config is separate)
- ❌ Do NOT change the 5-layer architecture or fixture pattern
- ❌ Do NOT add `test.extend()` based fixtures
- ❌ Do NOT create a custom MCP wrapper server (skills-based approach for now)
- ❌ Do NOT commit MCP accessibility snapshots to git
