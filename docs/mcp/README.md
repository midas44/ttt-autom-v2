# MCP Setup for TTT Test Development

## Prerequisites

- Node.js 18+
- Docker (for Postgres MCP)
- Claude Code with Opus model

## Quick Start

### 1. Playwright MCP (UI Reconnaissance)

Provided by the **official Anthropic Playwright plugin** (`playwright@claude-plugins-official`).
The plugin is installed at project scope and manages the `@playwright/mcp` server automatically.

**Plugin config location:** `~/.claude/plugins/cache/claude-plugins-official/playwright/<version>/.mcp.json`
(configured with `--browser chromium` to use Playwright's bundled Chromium)

When using Claude Code, MCP tools are available directly:
- `browser_navigate` — go to URLs
- `browser_snapshot` — capture accessibility tree (supports diff-based updates)
- `browser_click` / `browser_type` — interact with elements
- `browser_evaluate` — run JS in the page

**Alternative:** The `playwright-cli` skill provides equivalent functionality via bash commands
(`npx playwright-cli open/click/snapshot/close`). Use when MCP plugin is unavailable or for quick checks.

**Troubleshooting:**
- If MCP tools don't appear, check `/mcp` in Claude Code to verify the plugin is loaded
- The plugin requires Chromium — run `browser_install` MCP tool if browser is missing
- Run `claude mcp reset-project-choices` if MCP was previously denied

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
  2. [uses Playwright MCP plugin or playwright-cli to navigate to TTT, login, explore expense pages]
  3. [captures snapshots, maps selectors]
  4. [generates expense-tc1.spec.ts + ExpenseTc1Data.ts + page objects]
  5. [runs: npx playwright test e2e/tests/expense-tc1.spec.ts]
  6. [iterates on failures using error output + re-reconnaissance]
```

### 4. Choosing Between MCP Plugin and playwright-cli

Both tools access the same Playwright MCP capabilities. Choose based on the situation:

| Aspect | MCP Plugin | playwright-cli |
|--------|-----------|----------------|
| Snapshots | Inline in tool response, diff-based on repeat | Saved to .yml files, requires separate Read |
| Setup | Requires plugin install + session restart | Zero setup, works immediately |
| Context cost | Lower for multi-page sessions (diffs) | Higher (full snapshot each time) |
| Best for | Deep reconnaissance, multi-page flows | Quick one-off checks, debugging |

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
