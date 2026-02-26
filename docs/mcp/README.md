# MCP Setup for TTT Test Development

## Prerequisites

- Node.js 18+
- Docker (for Postgres MCP)
- Claude Code with Opus model

## Quick Start

### 1. Playwright MCP (UI Reconnaissance)

Already configured in `.mcp.json`. When using Claude Code:

```
Use playwright mcp to open a browser and navigate to https://ttt-qa-1.noveogroup.com
```

Claude Code will use the Playwright MCP tools to:
- `browser_navigate` — go to URLs
- `browser_snapshot` — capture accessibility tree
- `browser_click` / `browser_type` — interact with elements
- `browser_evaluate` — run JS in the page

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
