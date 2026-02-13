---
name: env-config
description: Add or manage environment configurations for the TTT application. Use when adding a new test environment, updating environment settings, or reviewing available environments. Creates YAML config files in e2e/config/ttt/envs/.
---

# Environment Configuration

Add or manage TTT environment configurations.

## Input

`$ARGUMENTS` — environment name (e.g., `qa-3`, `staging-2`).

## Process

1. Read existing configs in `e2e/config/ttt/envs/` to understand the structure.
2. Read `e2e/config/ttt/ttt.yml` for the base config and URL template.
3. Create `e2e/config/ttt/envs/[env-name].yml` with placeholder values:

```yaml
# Environment-specific configuration for [env-name]
# Override base ttt.yml settings for this environment.
```

4. Verify URL resolution: the template `https://ttt-***.noveogroup.com` produces `https://ttt-[env-name].noveogroup.com`.
5. Update the `env` comment list in `ttt.yml` to include the new environment name.

## Output

Show the created file and the resolved app URL.
