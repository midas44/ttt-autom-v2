# Fix: crystaldba/postgres-mcp Intermittent Connection Failures

## Problem

The `crystaldba/postgres-mcp` MCP server intermittently fails to connect to the PostgreSQL database. In Claude Code, `/mcp` shows the server status as "connecting" for a while, then switches to "failed". Restarting sometimes helps, sometimes doesn't.

This affects any OS (tested on Ubuntu, Cachy OS) and any project using this MCP server.

## Root Cause

The `postgres-mcp` server uses `psycopg_pool.AsyncConnectionPool` internally to connect to the database during startup. The `DATABASE_URI` is passed directly as the connection string. If the URI contains no explicit connection timeout, the driver relies on system TCP defaults, which:

- May be too short on some systems, causing the connection to fail before the database responds
- May be too long on others, causing Claude Code's MCP startup timeout to expire first
- Provide no TCP keepalive, so stale connections are never detected and recycled

Since the server has no built-in retry logic, a single failed connection attempt during startup leaves the MCP server in a broken state.

## Fix

Add `libpq` connection parameters directly to the `DATABASE_URI` query string. These are standard PostgreSQL connection parameters supported by `psycopg` / `libpq`.

### Before

```
postgresql://user:password@host:port/dbname
```

### After

```
postgresql://user:password@host:port/dbname?connect_timeout=10&keepalives=1&keepalives_idle=30&keepalives_interval=10&keepalives_count=3
```

### Parameter Reference

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `connect_timeout` | `10` | Wait up to 10 seconds for the initial TCP connection (instead of system default) |
| `keepalives` | `1` | Enable TCP keepalive probes on the connection |
| `keepalives_idle` | `30` | Send the first keepalive probe after 30 seconds of idle |
| `keepalives_interval` | `10` | Retry keepalive probe every 10 seconds if no response |
| `keepalives_count` | `3` | Close the connection after 3 unanswered probes |

## How to Apply

### Option A: Edit `.claude/.mcp.json` (project-level config)

Find the `postgres` server entry and update the `DATABASE_URI`:

```json
{
  "postgres": {
    "type": "stdio",
    "command": "uvx",
    "args": ["postgres-mcp", "--access-mode=restricted"],
    "env": {
      "DATABASE_URI": "postgresql://user:password@host:port/dbname?connect_timeout=10&keepalives=1&keepalives_idle=30&keepalives_interval=10&keepalives_count=3"
    }
  }
}
```

### Option B: Re-register via CLI (local-scope config)

```bash
claude mcp remove postgres

claude mcp add-json postgres '{
  "type": "stdio",
  "command": "uvx",
  "args": ["postgres-mcp", "--access-mode=restricted"],
  "env": {
    "DATABASE_URI": "postgresql://user:password@host:port/dbname?connect_timeout=10&keepalives=1&keepalives_idle=30&keepalives_interval=10&keepalives_count=3"
  }
}'
```

### VPN / Proxy Environments

If the database host is behind a VPN and the machine uses an HTTP proxy, also add proxy bypass variables to the `env` block:

```json
"env": {
  "DATABASE_URI": "postgresql://...",
  "NO_PROXY": "db-host-or-ip",
  "no_proxy": "db-host-or-ip",
  "HTTP_PROXY": "",
  "HTTPS_PROXY": ""
}
```

## AI Prompt

Use the following prompt to fix this issue in another project via Claude Code:

```
My crystaldba/postgres-mcp MCP server intermittently fails to connect.
Fix it by adding libpq connection parameters to the DATABASE_URI in
my MCP config. Add these query params to the existing URI:
connect_timeout=10, keepalives=1, keepalives_idle=30,
keepalives_interval=10, keepalives_count=3.
Update both .claude/.mcp.json and the local-scope config
(claude mcp remove + claude mcp add-json).
```

## Verification

After applying the fix, restart Claude Code and check `/mcp`. The postgres server should connect reliably. You can also test manually:

```bash
DATABASE_URI="postgresql://user:password@host:port/dbname?connect_timeout=10&keepalives=1&keepalives_idle=30&keepalives_interval=10&keepalives_count=3" \
  timeout 15 uvx postgres-mcp --access-mode=restricted 2>&1
```

Expected output:

```
INFO  Starting PostgreSQL MCP Server in RESTRICTED mode
INFO  Successfully connected to database and initialized connection pool
```
