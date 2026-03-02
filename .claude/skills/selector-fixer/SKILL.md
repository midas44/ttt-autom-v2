---
name: selector-fixer
description: Diagnose and fix broken Playwright selectors from failing tests. Use when tests fail due to element not found, timeout on locator, or selector-related errors. Traces selectors back to page objects, analyzes the issue, and applies fixes following the project's selector priority guidelines.
---

# Selector Fixer

Diagnose and fix broken selectors from Playwright test failures.

## Input

`$ARGUMENTS` — spec file name/path, or pasted Playwright error output.

## Process

### 1. Identify failure

If a spec is provided, run it first:
```
npx playwright test <spec> --project=debug
```

### 2. Parse the error

Extract: which test failed, which locator timed out, file and line number.

### 3. Trace the selector

Read the source at the failing line. Follow the locator to its definition in the page object or fixture. Show the current selector.

### 4. Analyze the issue

Common causes:
- Element role or name changed in the app.
- CSS class renamed or removed.
- Element moved to a different container.
- Dynamic content not yet loaded.
- Text changed (especially after language switch).
- **Strict mode violation** — `getByRole` name partially matches multiple elements. Fix with `exact: true` (e.g., `{ name: "All", exact: true }` to avoid matching "ASSIGNMENTS_ALL").
- **rc-checkbox not responding** — TTT uses `rc-checkbox` React component. `.check()`/`.uncheck()` don't propagate state. Use `.click()` instead and verify with `expect(checkbox).toBeChecked()`.
- **Dialog data race** — edit dialogs may open before data is loaded into form fields. Wait for expected state before interacting (e.g., `expect(checkbox).toBeChecked({ timeout: 5000 })`).

### 5. Apply fix

Follow selector priority:
1. `getByRole()` with updated name/role.
2. Stable attributes (`[data-qa]`, `[aria-*]`).
3. Scoped CSS under a meaningful container.
4. Multi-strategy fallback resolution for unstable elements.

If the correct selector is unclear, suggest:
```
npx playwright codegen <app-url>
```

### 6. Verify

Update the page object or fixture. Re-run the test to confirm the fix.

## Output

Show: which selectors changed, before/after, and test result after the fix.
