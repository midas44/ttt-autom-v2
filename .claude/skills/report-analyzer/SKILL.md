---
name: report-analyzer
description: Analyze Playwright test report artifacts and summarize results. Use when reviewing test run outcomes, investigating failures from screenshots/traces/videos, or understanding overall test suite health. Examines playwright-report/ and test-results/ directories.
---

# Report Analyzer

Analyze the latest Playwright test report and summarize results.

## Input

`$ARGUMENTS` — optional: specific test name to filter, or "last" (default).

## Process

### 1. Locate artifacts

Check `playwright-report/` and `test-results/` for the latest run.

### 2. Gather data

- List test result directories in `test-results/`.
- For failed tests: find screenshots, videos, trace files.
- Read error output or result JSON if available.

### 3. Summarize

- Total: passed, failed, skipped.
- Per failure: test name, spec file, error type and message.
- If screenshots exist, read and describe what they show.
- If traces exist, provide the view command: `npx playwright show-trace <path>`.

### 4. Identify patterns

- Multiple tests failing on same selector → UI change.
- Timeouts → performance issue or wrong wait strategy.
- All tests in a spec failing → setup/login issue.

### 5. Recommend actions

- Selector failures → use `/fix-selectors`.
- Flaky tests → adjust `fixtureDelayMs` or add explicit waits.
- Environment issues → check config YAML values.
