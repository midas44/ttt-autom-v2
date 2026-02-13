# TTT Automation Framework — Project Specification

## Purpose

Build a Playwright + TypeScript E2E test automation framework for the **TTT (TimeTrackingTool / TimeReportingTool)** web application deployed at `https://ttt-{env}.noveogroup.com`. The framework must support multiple environments (dev-new, preprod, stage, qa-1, qa-2, timemachine), multiple browsers (Chrome, Firefox, Edge), and provide a reusable architecture for writing test cases against the TTT application's features: task time reporting, vacation request management, calendar/planner views, and user settings.

---

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript (strict mode, ESNext target, CommonJS modules)
- **Test framework**: Playwright (`@playwright/test`)
- **Configuration**: YAML files parsed with `js-yaml`
- **No other dependencies**

### package.json

```json
{
  "name": "ttt-autom",
  "version": "1.0.2",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0"
  },
  "dependencies": {
    "js-yaml": "^4.1.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["@playwright/test"]
  },
  "include": ["playwright.config.ts", "e2e"]
}
```

### .gitignore

```
playwright-report/
test-results/
```

---

## Architecture

The framework uses a 5-layer architecture. Each layer has a single responsibility, and dependencies flow strictly downward.

```
Test Specs              (e2e/tests/*.spec.ts)
    |
Fixtures                (e2e/fixtures/*.ts)      — reusable workflow orchestration
    |
Page Objects            (e2e/pages/*.ts)          — UI abstraction (locators + intent-driven methods)
    |
Configuration + Data    (e2e/config/, e2e/data/)  — YAML configs + parameterized test data classes
    |
Playwright API
```

### Key architectural rules

1. **No base class for page objects** — use composition, not inheritance.
2. **Fixtures are plain classes, not Playwright's `test.extend` fixtures** — instantiated in the test body.
3. **Config classes are instantiated in the test body**, not globally injected — each test creates `new TttConfig()` then `new GlobalConfig(tttConfig)`.
4. **No raw locators in spec files** — all interactions go through page objects or fixtures.
5. **No hardcoded test data in spec files or fixtures** — all dynamic data lives in dedicated `[TestCaseName]Data` classes.
6. **Every verification step**: (a) calls `globalConfig.delay()`, (b) performs the assertion, (c) captures a screenshot attached to the Playwright report.

---

## Directory Structure

```
project-root/
├── playwright.config.ts          # Playwright configuration
├── tsconfig.json
├── package.json
├── .gitignore
├── docs/                         # Test case documentation (markdown)
├── prompts/                      # AI prompts for test generation
└── e2e/
    ├── config/
    │   ├── global.yml            # Framework-level settings
    │   ├── globalConfig.ts       # GlobalConfig class
    │   ├── tttConfig.ts          # TttConfig class
    │   ├── ttt/
    │   │   ├── ttt.yml           # App-level settings
    │   │   └── envs/             # Environment overrides (dev-new.yml, preprod.yml, qa-1.yml, etc.)
    │   └── roundcube/            # Secondary app config (email testing)
    │       ├── roundcube.yml
    │       └── envs/
    ├── data/                     # Test data model classes
    ├── fixtures/                 # Workflow fixtures
    ├── pages/                    # Page Object classes
    └── tests/                    # Test spec files
```

---

## Configuration System

### Design

Two configuration classes, both immutable (`readonly` properties), load from YAML files with strict validation and sensible defaults.

### Global Configuration (`e2e/config/globalConfig.ts`)

**Source YAML**: `e2e/config/global.yml`

```yaml
globalTimeout: 15000
browserName: "chrome"       # firefox | chrome | edge
windowPositionX: 300
windowPositionY: 80
fixtureDelayMs: 500
windowWidth: 2560
windowHeight: 1440
```

**Class**: `GlobalConfig`
- Constructor takes `TttConfig` (defaults to `new TttConfig()`).
- Exposes `appUrl` from the TttConfig for convenience.
- Properties: `globalTimeout`, `browserName`, `windowPositionX`, `windowPositionY`, `fixtureDelayMs`, `windowWidth`, `windowHeight`, `appUrl`.
- Methods:
  - `delay()` — `setTimeout` wrapper using `fixtureDelayMs`.
  - `applyViewport(page)` — sets viewport size and window position.
- Window positioning is browser-specific:
  - **Chrome/Edge**: CDP session → `Browser.getWindowForTarget` → `Browser.setWindowBounds`.
  - **Firefox**: Juggler protocol or `window.moveTo()` fallback.
  - Errors silently ignored (graceful degradation in headless or unsupported environments).

**Validation helpers** (module-level functions):
- `readYaml(path)` — loads and validates YAML file exists and parses to an object.
- `readNumber(value, fallback, field)` — validates finite number, returns fallback for null/undefined.
- `readBrowserName(value)` — validates against allowed values `["firefox", "chrome", "edge"]`.

### Application Configuration (`e2e/config/tttConfig.ts`)

**Source YAML**: `e2e/config/ttt/ttt.yml`

```yaml
appName: "TTT (TimeTrackingTool aka TimeReportingTool)"
appUrl: "https://ttt-***.noveogroup.com"    # *** is replaced by env name
env: "qa-1"                                  # dev-new | preprod | timemachine | stage | qa-1 | qa-2
lang: "en"                                   # en | ru
dashboardPath: /report
logoutUrl: https://cas-demo.noveogroup.com/logout
waitUntil: networkidle                       # load | domcontentloaded | networkidle | commit
logoutSuccessText: Logout successful
```

**Class**: `TttConfig`
- All `readonly` properties.
- `resolveAppUrl()` replaces `***` in the URL template with the env name, validates the result is a valid URL.
- `buildUrl(pathname)` — constructs full URL from `appUrl` + pathname.

**Validation helpers**:
- `readString(value, fallback, field)` — validates non-empty string.
- `readWaitUntil(value)` — validates against `["load", "domcontentloaded", "networkidle", "commit"]`.

### Environment-Specific Overrides

Directory `e2e/config/ttt/envs/` contains per-environment YAML files (dev-new.yml, preprod.yml, qa-1.yml, qa-2.yml, stage.yml, timemachine.yml) for environment-specific values like database credentials, API tokens, and CAS login settings. These are available for future use but not currently loaded by `TttConfig`.

---

## Playwright Configuration (`playwright.config.ts`)

```typescript
const globalConfig = new GlobalConfig();

// Map framework browser names to Playwright browser settings
function resolveBrowserSettings() {
  // "chrome" → { browserName: "chromium" }
  // "edge"   → { browserName: "chromium", channel: "msedge" }
  // "firefox"→ { browserName: "firefox", firefoxUserPrefs: { dark theme, allow window.moveTo } }
}

export default defineConfig({
  reporter: [["line"], ["html", { open: "never" }]],
  testDir: "./e2e/tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  projects: [
    { name: "debug",   grep: /@debug/,   use: { baseURL, headless: false, screenshot: "only-on-failure", trace: "on-first-retry", video: "retain-on-failure", ...browserSettings } },
    { name: "smoke",   grep: /@smoke/,   use: { /* same */ } },
    { name: "regress", grep: /@regress/, use: { /* same */ } },
  ],
});
```

Key settings:
- **3 projects** selected by test tags: `@debug`, `@smoke`, `@regress`.
- All run **headed** (`headless: false`).
- **Screenshots**: only on failure.
- **Traces**: on first retry.
- **Video**: retained on failure.
- Firefox gets dark-theme user prefs and `dom.disable_window_move_resize: false`.

---

## Page Objects (`e2e/pages/`)

### Design Principles

- **Locators are `private readonly`**, declared in the constructor or as class field initializers.
- **Selector priority**: role-based (`getByRole`) > stable attributes (`data-qa`, `aria-*`) > scoped CSS > text-based (only for static EN text) > XPath (last resort).
- **Multi-strategy fallback resolution** for unstable/varying UI elements — try multiple locator strategies in sequence, return the first that resolves.
- **Dialog page objects are returned from parent page methods** (e.g., `myVacationsPage.openCreateRequest()` returns a `VacationCreateDialog`).
- **Locator caching** for expensive resolutions (private cache field, lazy initialization via `ensure*()` methods).
- Methods are **intent-driven** (`fillVacationPeriod`, `ensureUnpaidVacationChecked`) rather than low-level wrappers.

### Page Object Inventory

#### LoginPage
- Receives `Page` and `TttConfig`.
- Locators: username input (`input[name='username']`), login button (`button:has-text('LOGIN')`).
- Methods: `goto()`, `submitUsername(username)` — fills username, clicks login, waits for navigation to dashboard URL, waits for load state.

#### LogoutPage
- Receives `Page` and `TttConfig`.
- Locator: success message (`text=Logout successful`).
- Methods: `waitForNavigation()` — handles URL matching with optional query params; `successMessage()` — returns the locator.

#### MainPage
- Receives `Page`.
- Locators: user menu trigger, logout option, language switcher, language value.
- Methods: `ensureVisible()`, `openUserMenu()`, `logoutButton()`, `getCurrentLanguage()`, `setLanguage(language)`.
- Exports `type LanguageCode = "EN" | "RU"`.

#### MyVacationsPage (in MainPage.ts)
- Receives `Page`.
- Locators: table rows (`table.user-vacations tbody tr`), title (`.page-body__title` with text "My vacations and days off"), create request button, header cells, notification candidate locators (role-based, class-based, data-qa-based — 8 candidates).
- Methods: `waitForReady()`, `titleLocator()`, `openCreateRequest()` (returns `VacationCreateDialog`), `vacationRow(period)`, `waitForVacationRow(period)`, `waitForVacationRowToDisappear(period)`, `openRequestDetails(period)` (returns `VacationDetailsDialog`), `columnValue(period, columnLabel)`, `columnCell(period, columnLabel)`, `findNotification(text)`.
- Column resolution uses `HTMLTableCellElement.cellIndex` via `evaluate()`.
- Notification finding iterates candidate locators with fallback to `text=` selector.

#### MyTasksPage (in MainPage.ts)
- Receives `Page`.
- Locators: title, search input (dual selector: `input[name='TASK_NAME']` or `input.react-autosuggest__input`), add task button, task rows, table.
- Methods: `waitForReady()`, `fillSearch(text)`, `clickAddTask()`, `clearSearch()`, `searchField()`, `taskRow(label)`, `waitForTask(label)`, `addTask(searchTerm)`, `getTaskRow(label)`, `dayCell(row, dateLabel)`, `openInlineEditor(cell)`.
- `clearSearch()` resolves the clear button via multi-strategy fallback (aria-label, title, class, text, icon, any button).
- `openInlineEditor(cell)` — double-clicks cell, looks for inline input/textarea, falls back to floating editor.
- `buildDateMatcher(dateLabel)` — constructs RegExp matching date column headers in various formats (dd.mm, dd/mm, etc.).
- Column index resolution via `HTMLTableCellElement.cellIndex`.

#### VacationCreateDialog
- Receives `Page`.
- Root locator: `getByRole("dialog", { name: /Creating vacation request/i })`.
- Locators: unpaid checkbox, cached comment input, cached notify input, date picker inputs, calendar.
- Methods: `waitForOpen()`, `root()`, `unpaidCheckboxLocator()`, `fillVacationPeriod(start, end)`, `ensureUnpaidVacationChecked()`, `fillAlsoNotify(username, displayName)`, `assertNotifySelected(displayName)`, `fillComment(comment)`, `assertNoRedText()`, `assertNoDominantRedText()`, `submit()`.
- Date selection: clicks date picker input → waits for `.rdtPicker` calendar → aligns to target month/year (up to 24 navigation clicks) → clicks target day.
- Calendar alignment reads header text (e.g., "December 2025"), parses month name via `monthMap` record.
- "Also notify" input resolution: 8 fallback strategies (combobox role, textbox role, label-following XPath, name attribute, placeholder, data-qa, autosuggest class, Select class).
- Notify suggestions: polls 4 container selectors for up to 7 seconds.
- Color analysis: `coloredTextEntries()` walks all descendant elements, extracts computed `color` CSS, filters by visibility. `collectColoredText(predicate)` returns text of elements matching a color predicate. Used for red-text error detection (`r > g && r > b`).

#### VacationDetailsDialog
- Receives `Page`.
- Root locator: `getByRole("dialog", { name: /Request details/i })`.
- Methods: `waitForOpen()`, `root()`, `deleteRequest()` — clicks Delete, waits for confirmation dialog, clicks confirm Delete, waits for both dialogs to detach.

#### PlannerPage
- Receives `Page`.
- Method: `waitForReady()` — waits for `.page-body__title` with text "Planner".

#### MyVacationsPage (standalone file, minimal)
- Standalone lightweight version with just `waitForReady()`. The full implementation is in `MainPage.ts`.

### Helper Utilities in Page Objects

- `escapeRegExp(value)` — escapes special regex characters for dynamic text matching (defined in MainPage.ts).

---

## Fixtures (`e2e/fixtures/`)

### Design Principles

- Constructor receives `Page`, config objects (`TttConfig`, `GlobalConfig`), and sometimes `VerificationFixture` or other collaborators.
- Fixtures **compose page objects** internally (create them in the constructor).
- Method names are **action-oriented**: `run()`, `ensureReady()`, `ensureLanguage()`, `navigate()`, etc.
- Every workflow includes `globalConfig.delay()` at appropriate points.
- Verification fixtures capture screenshots attached to the Playwright HTML report.

### Fixture Inventory

#### LoginFixture
- Constructor: `(page, tttConfig, username?, globalConfig)`.
- Default username from `process.env.TTT_USERNAME ?? "pvaynmaster"`.
- Creates `LoginPage` internally.
- `run()` — calls `login()` then `assertOnDashboard()` then `delay()`.
- `login()` — navigates to app, submits username.
- `assertOnDashboard()` — asserts current URL matches dashboard path.

#### LogoutFixture
- Constructor: `(page, tttConfig, globalConfig)`.
- Creates `MainPage` and `LogoutPage` internally.
- `run()` — logout via UI: waits for networkidle, opens user menu, clicks logout, handles optional confirmation dialog (`page.once("dialog")`), waits for navigation to logout URL, verifies success message.
- `runViaDirectUrl()` — navigates to `${appUrl}/logout` directly, verifies.

#### MainFixture
- Constructor: `(page, tttConfig, globalConfig)`.
- Creates `MainPage` internally.
- `ensureLanguage(target: LanguageCode)` — checks current language, switches if needed, soft-asserts result, delays. Returns resulting language.

#### HeaderNavigationFixture
- Constructor: `(page, globalConfig)`.
- `navigate(path)` — accepts `"Menu"` or `"Menu > Submenu"` format (1-2 segments split by `>`).
  - Single segment: clicks top-level menu item (link or button).
  - Two segments: opens dropdown, clicks submenu item.
  - Waits for `networkidle` after navigation, then delays.
- Locators scoped to `.page-header .navbar__list-item`.

#### PageReloadFixture
- Constructor: `(page, tttConfig, globalConfig)`.
- `reload()` — reloads page with configured `waitUntil`, waits for `networkidle`, delays.

#### VerificationFixture
- Constructor: `(page, globalConfig)`.
- All methods: delay → assert → screenshot → attach → return screenshot path.
- Methods:
  - `verify(text, testInfo)` — asserts text visible on page.
  - `verifyLocatorVisible(locator, testInfo, description)` — asserts locator visible.
  - `verifyLocatorText(locator, expectedText, testInfo, description)` — asserts locator contains text.
  - `verifyLocatorEmpty(locator, testInfo, description)` — asserts locator text matches `/^\s*$/`.
  - `verifyLocatorValue(locator, expectedValue, testInfo, description)` — asserts input/textarea value.
  - `verifyLocatorDominantGreen(locator, testInfo, description)` — asserts element has a color where G > R and G > B.
- Screenshot: `verification-{slugified-description}-{ISO-timestamp}.png`, full-page, attached to TestInfo.
- `collectCandidateColors(locator)` — deep color inspection:
  - Inspects element, `::before`, `::after` pseudo-elements.
  - Properties checked: `color`, `backgroundColor`, `borderTopColor`, `borderRightColor`, `borderBottomColor`, `borderLeftColor`, `boxShadow`, `textShadow`, `outlineColor`.
  - Walks up to 200 descendant elements for `color`, `backgroundColor`, `borderLeftColor`.
  - Deduplicates by `{property}-{r}-{g}-{b}` key.
  - Returns array of `{ property, r, g, b }`.

#### VacationCreationFixture
- Constructor: `(page, globalConfig)`.
- Creates `MyVacationsPage` internally.
- `ensureOnPage()` — waits for page ready.
- `createVacation(data)` — opens create dialog, fills period, submits, waits for row, asserts row count is 1, delays.
- Accepts `VacationRecordData` interface: `{ startInput, endInput, periodPattern, periodLabel? }`.

#### VacationDeletionFixture
- Constructor: `(page, globalConfig)`.
- Creates `MyVacationsPage` internally.
- `deleteVacation(data)` — calls `deleteVacationIfPresent`, throws if nothing was deleted.
- `deleteVacationIfPresent(data)` — loops: while matching vacation row exists, opens details, deletes request, waits for row to disappear, delays. Returns boolean.

#### TaskReportingFixture
- Constructor: `(page, globalConfig, verificationFixture)`.
- Creates `MyTasksPage` internally.
- `ensureReady()` — waits for tasks page ready.
- `addTaskFromSearch(searchTerm, rowMatcher, testInfo)` — fills search, clicks add, waits for networkidle, gets row, verifies visible.
- `getTaskRow(rowMatcher, searchTerm?)` — optionally searches first, returns row.
- `fillReportValue(row, dateLabel, value, testInfo, options?)` — gets day cell, opens inline editor, delays, clicks, clears, types value with 50ms delay per char, exits editing (Enter + click outside), optionally verifies cell text, waits for networkidle.
- `clearReportValue(row, dateLabel, testInfo, options?)` — opens inline editor, fills empty, exits editing, optionally verifies cell empty.
- `verifyReportValue(rowMatcher, dateLabel, value, testInfo, searchTerm?)` — finds row/cell, verifies text.
- `verifyReportEmpty(rowMatcher, dateLabel, testInfo, searchTerm?)` — if row absent, asserts count 0; if present, verifies cell empty.
- `verifySearchEmpty(testInfo)` — verifies search field value is empty string.
- `clearSearch()` — delegates to MyTasksPage.
- Exit inline editing: tries `Enter` key, then clicks outside cell (calculates coordinates relative to cell bounding box to avoid clicking inside it).

---

## Test Data Classes (`e2e/data/`)

### Design Principles

- One class per test case, named `[TestCaseName]Data`.
- Constructor parameters have defaults from `process.env` variables with hardcoded fallbacks.
- Each env variable is documented with a JSDoc comment on the constructor parameter.
- Classes expose computed properties (getters) and formatting methods.
- No test data is hardcoded in specs or fixtures.
- `declare const process: { env: Record<string, string | undefined> };` at file top for TypeScript type safety.

### Example Pattern (ReportTc5Data)

```typescript
declare const process: { env: Record<string, string | undefined> };

export class ReportTc5Data {
  readonly username: string;
  readonly projectName: string;
  readonly taskName: string;
  readonly reportValue: string;

  constructor(
    username = process.env.REPORT_TC5_USERNAME ?? "vulyanov",
    projectName = process.env.REPORT_TC5_PROJECT ?? "HR",
    taskName = process.env.REPORT_TC5_TASK ?? "autotest",
    reportValue = process.env.REPORT_TC5_REPORT_VALUE ?? "4.25",
  ) {
    this.username = username;
    // ...
  }

  buildSearchTerm(date: Date = new Date()): string {
    return `${this.projectName} / ${this.taskName} ${this.formatTimestamp(date)}`;
  }

  formatColumnLabel(date: Date = new Date()): string {
    // returns "dd.mm" for current date
  }

  formatTimestamp(date: Date = new Date()): string {
    // returns "ddmmyy_HHmm" format
  }
}
```

### Timestamp Format

The standard timestamp format used across the project is `ddmmyy_HHmm` (e.g., `090226_1430`), used to make test data unique across runs.

### Date Handling

For vacation-related data, dates are parsed from `dd.mm.yyyy` format into UTC `Date` objects. A `ParsedDate` interface holds both the `raw` string and the parsed `date`:

```typescript
interface ParsedDate {
  readonly raw: string;
  readonly date: Date;
}
```

Period pattern generation creates a RegExp that matches the date range in multiple display formats (numeric `dd.mm.yyyy`, month names like "December", abbreviations like "Dec").

---

## Test Spec Structure

Tests follow a consistent composition pattern:

```typescript
import { test } from "@playwright/test";

test("test_name @regress", async ({ page }, testInfo) => {
  // 1. Instantiate configs
  const tttConfig = new TttConfig();
  const globalConfig = new GlobalConfig(tttConfig);

  // 2. Instantiate test data
  const data = new SomeTestData();

  // 3. Apply viewport
  await globalConfig.applyViewport(page);

  // 4. Instantiate fixtures (all needed for this test)
  const login = new LoginFixture(page, tttConfig, data.username, globalConfig);
  const mainFixture = new MainFixture(page, tttConfig, globalConfig);
  const navigation = new HeaderNavigationFixture(page, globalConfig);
  const verification = new VerificationFixture(page, globalConfig);
  const logout = new LogoutFixture(page, tttConfig, globalConfig);
  // ... more fixtures as needed

  // 5. Execute workflow
  await login.run();
  await mainFixture.ensureLanguage("EN");
  await navigation.navigate("Menu > Submenu");
  // ... page object and fixture interactions
  // ... verifications via VerificationFixture

  // 6. Cleanup
  await logout.runViaDirectUrl();
  await page.close();
});
```

### Test tags

- `@debug` — for development/debugging (runs under "debug" project).
- `@smoke` — smoke tests.
- `@regress` — regression tests.

Tags are appended to the test title string.

---

## Application Under Test — TTT Pages & Navigation

The TTT application has the following known pages and navigation structure:

### Authentication
- **Login page**: Username-only login (no password in test environments), redirects to dashboard at `/report`.
- **Logout**: CAS logout at `https://cas-demo.noveogroup.com/logout`, displays "Logout successful" text. Can be triggered via UI (user menu > logout) or direct URL (`${appUrl}/logout`).

### Header Navigation
- Top-level menu items in `.page-header .navbar__list-item`.
- Some items are direct links (`.navbar__link`), some open dropdowns (`.navbar__item` button).
- Dropdown items in `.navbar__list-drop-item` or `.drop-down-menu__option`.
- Known navigation paths:
  - `"Calendar of absences > My vacations and days off"` — vacation management page.
  - Direct link to task reporting/dashboard at `/report`.

### User Menu
- User menu trigger: `div.navbar__button-arrow button.navbar__item`.
- Dropdown contains: logout option (`ul.navbar__list-exit button.navbar__list-drop-link`).

### Language Switcher
- Located in `.language-switcher`.
- Current language value in `.navbar__link` (first child).
- Dropdown options in `.drop-down-menu__option`.
- Supports "EN" and "RU".

### My Vacations and Days Off
- Page title: `.page-body__title` with text "My vacations and days off".
- Vacation table: `table.user-vacations`.
- "Create a request" button.
- Table columns: period, status, vacation type, payment month (resolved dynamically by header text).
- Notification system: multiple possible selectors (role="status", role="alert", class*="notification", class*="message", `.alert-success`, `.toast-success`, etc.).

### Creating Vacation Request Dialog
- Dialog title: "Creating vacation request" (role="dialog").
- Date pickers: `input.date-picker__input` (2 inputs: start, end).
- Calendar widget: `.rdtPicker` with `.rdtDay`, `.rdtSwitch` (month/year header), `.rdtNext`/`.rdtPrev` navigation.
- "Unpaid vacation" checkbox.
- "Also notify" autocomplete input (various UI implementations across environments).
- "Comment" text input.
- "Save" button.

### Request Details Dialog
- Dialog title: "Request details" (role="dialog").
- "Delete" button → confirmation dialog "Delete the request?" → "Delete" confirmation button.

### My Tasks (Task Reporting)
- Page title: `.page-body__title` with text "My tasks" (may not always be present).
- Search input: `input[name='TASK_NAME']` or `input.react-autosuggest__input`.
- "Add a task" button.
- Task table with rows containing task name and date columns.
- Date column headers matchable by `dd.mm` or `dd/mm` patterns.
- Inline cell editing: double-click to open editor (input/textarea in cell or floating `.timesheet-reporting__input`), Enter or click-outside to submit.

### Planner
- Page title: `.page-body__title` with text "Planner".

---

## Autotest Generation Guidelines

When creating new test cases within this framework, follow these rules:

### Task
- Create an autotest for the described test case using the existing framework architecture (config, pages, fixtures, data) and **Playwright CLI** (`npx playwright test`, `npx playwright codegen`, etc.).
- For parametrization, define a data class named `[TestCaseName]Data`.
- Do not hardcode any test data inside the test class.
- Place as much logic as possible outside the test class.
- Reuse existing page class(es) when possible; create new page class(es) only if necessary.
- Reuse existing fixture class(es) when possible; create new reusable fixtures only if necessary.
- Before every verification, insert an explicit delay using the `fixtureDelayMs` parameter.
- Take a screenshot after each verification step.
- In the `docs` folder, create an `.md` file with the test case description, structured into two parts:
  1. **Title** — suitable for inclusion in a checklist (without data).
  2. **Detailed description** — suitable for manual reproduction (including 2 subsections: **Steps** and **Data**).
- Don't use icons in the doc file.

### Data & Parametrization Guidelines
- Keep all dynamic data in the dedicated `[TestCaseName]Data` class.
- Extend existing data classes when new inputs are needed instead of introducing inline literals in tests.
- Document any new environment variables or defaults directly inside the data class constructor, including purposeful fallbacks.
- Prefer meaningful field names and group related values when that improves clarity.

### Fixture & Page Object Guidelines
- Instantiate fixtures inside the test body, but place reusable flows in fixture classes or page objects.
- Prefer extending an existing fixture before creating a new one; aim for action-oriented method names (`ensureReady`, `verifyReportValue`).
- Avoid raw locators in specs. Add helper methods to the relevant page object or fixture whenever new interactions are required.
- Keep page objects lean: expose intent-driven helpers rather than low-level locator wrappers.

### Verification & Diagnostics Guidelines
- Perform assertions through `VerificationFixture` to guarantee delays and screenshots are applied consistently.
- Name verification steps with descriptive contexts so attachments remain searchable (the fixture already slugifies names; pass meaningful descriptions).
- Use `testInfo` attachments instead of ad-hoc console logs. Reserve `test.step` for genuinely nested flows.
- When checks require computation, do the heavy lifting inside fixtures/pages and keep the assertion call concise.

### Selector Guidelines
- Prefer **role-based selectors** (`getByRole`) for accessibility and stability.
- When roles are insufficient, use stable attributes (`getByTestId`, `locator("[data-qa]")`, `locator("[aria-*")`) defined in the DOM; avoid dynamic classes.
- Keep selectors short, unique, and descriptive, and encapsulate them inside page objects/fixtures instead of tests.
- Use **text-based selectors** (`getByText`) only for static EN text that cannot be translated; switch the UI to EN before relying on text.
- As a last resort, scope CSS locators under a meaningful container to minimize brittleness.
- Validate new or changed selectors by running the relevant Playwright spec locally.

### Workflow Checklist
1. Update or extend the `[TestCaseName]Data` class with required fields and defaults.
2. Add or adjust page object or fixture helpers to cover new interactions or verifications.
3. Implement the test spec using fixtures, avoiding inline selectors or logic.
4. Create or update the matching doc file in `docs/` following the Title + Detailed description format.
5. Run `npx playwright test <spec>` locally and confirm no flaky selectors.
6. Review generated artifacts (screenshots/video) and resolve flakiness before committing.
