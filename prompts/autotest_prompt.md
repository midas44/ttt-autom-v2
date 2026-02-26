# Autotest Generation Prompt

## TASK
- Create an autotest for the described test case using the existing framework architecture (config, pages, fixtures, data) and **Playwright MCP** (via the official plugin or `playwright-cli`).
- For parametrization, define a data class named in the format: `[TestCaseName]Data`.
- Do **not** hardcode any test data inside the test class.
- Place as much logic as possible **outside** the test class.
- Reuse existing page class(es) when possible; create new page class(es) only if necessary.
- Reuse existing fixture class(es) when possible; create new reusable fixtures (sets of steps) only if necessary.
- Before every verification, insert an explicit delay using the `fixtureDelayMs` parameter.
- Take a screenshot after each verification step.
- In the `docs` folder, create an `.md` file with the test case description, structured into two parts:
  1. **Title** – suitable for inclusion in a checklist (without data).
  2. **Detailed description** – suitable for manual reproduction (including 2 subsections: **Steps** and **Data**).
- Don't use icons in the doc file.

### Data & Parametrization Guidelines
- Keep all dynamic data in the dedicated `[TestCaseName]Data` class.
- Extend existing data classes when new inputs are needed instead of introducing inline literals in tests.
- Document any new environment variables or defaults directly inside the data class constructor, including purposeful fallbacks.
- Prefer meaningful field names and group related values in nested objects when that improves clarity.

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
- Keep selectors **short, unique, and descriptive**, and encapsulate them inside page objects/fixtures instead of tests.
- Use **text-based selectors** (`getByText`) only for static EN text that cannot be translated; switch the UI to EN before relying on text.
- As a last resort, scope CSS locators under a meaningful container to minimize brittleness.
- Validate new or changed selectors by running the relevant Playwright spec locally (headed or headless); CI runs provide additional confirmation.

### Workflow Checklist
1. Update or extend the `[TestCaseName]Data` class with required fields and defaults.
2. Add or adjust page object or fixture helpers to cover new interactions or verifications.
3. Implement the test spec using fixtures, avoiding inline selectors or logic.
4. Create or update the matching doc file in `docs/` following the Title + Detailed description format.
5. Run `npx playwright test <spec>` locally (headless and/or headed) and confirm no flaky selectors.
6. Review generated artifacts (screenshots/video) and resolve flakiness before committing.
