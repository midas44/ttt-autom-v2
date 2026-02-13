# New Page Object

Create a page object class for a TTT application page.

## Input

`$ARGUMENTS` — page name and optionally known selectors or purpose description.

## Structure

```typescript
import { Locator, Page } from "@playwright/test";

export class [PageName] {
  private readonly someElement: Locator;

  constructor(private readonly page: Page) {
    this.someElement = this.page.getByRole("button", { name: /Label/i });
  }

  async waitForReady(): Promise<void> {
    await this.someElement.waitFor({ state: "visible" });
  }

  // Intent-driven public methods only
}
```

## Rules

- Import `Page` and `Locator` from `@playwright/test`. Add `TttConfig` only if navigation is needed.
- Declare locators as `private readonly` in the constructor or as class field initializers.
- Always include `waitForReady()` that waits for the page's primary indicator.
- Method names are intent-driven: `fillVacationPeriod`, not `setInputValue`.
- Dialog page objects should be returned from parent page methods.
- For table pages, include column index resolution via `HTMLTableCellElement.cellIndex` + `evaluate()`.
- For unstable elements, implement multi-strategy fallback (try multiple locator strategies, return first match).
- Cache expensive locator resolutions in private fields with lazy `ensure*()` methods.
- Use `escapeRegExp()` for dynamic text matching in filters.
