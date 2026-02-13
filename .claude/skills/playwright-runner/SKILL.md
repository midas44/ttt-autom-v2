---
name: playwright-runner
description: Run Playwright tests with smart defaults and summarize results. Use when running test specs, listing available tests, or executing tests with specific projects/flags. Parses Playwright CLI output and provides actionable failure summaries.
---

# Playwright Runner

Run and manage Playwright test execution for the TTT framework.

## Usage

`$ARGUMENTS` — spec name or path, optionally followed by flags.

## Execution

1. Resolve the spec file in `e2e/tests/` if no path/extension given.
2. Build command: `npx playwright test [spec] [flags]`.
3. Default to `--project=debug` if no `--project` specified.
4. Pass through all flags: `--headed`, `--grep`, `--workers`, `--retries`, etc.

### Common invocations

- Run specific test: `npx playwright test e2e/tests/<spec>.spec.ts --project=debug`
- Run headed: `npx playwright test --headed --project=debug`
- List tests: `npx playwright test --list`
- Run by tag: `npx playwright test --grep @smoke --project=smoke`

## Result Summary

After execution, summarize:

- Total tests, passed, failed, skipped.
- For failures: test name, error message, failing assertion or locator.
- Location of screenshots, traces, or videos if generated.

## Failure Diagnosis

Suggest likely fixes by error type:

- **Timeout** → selector may be wrong or element not appearing. Check page object locators.
- **Locator error** → element not found. Verify selector in page object matches current UI.
- **Assertion error** → show expected vs actual. Check test data or verification logic.
- **Navigation error** → URL mismatch. Check TttConfig paths.
