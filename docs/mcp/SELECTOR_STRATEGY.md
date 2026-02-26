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

When using the MCP plugin directly (via `@playwright/mcp`), configure
`--test-id-attribute data-qa` to highlight `data-qa` values in snapshots.
The official Playwright plugin does not set this flag by default — add it
to the plugin's `.mcp.json` if needed.

When using `playwright-cli`, the `--test-id-attribute` is set in the
project's `.claude/.mcp.json` (for the standalone MCP server config)
or passed as a CLI flag.
