---
argument-hint: [topic-hint]
---

# Update Knowledge Base

Review recent work from this session (and optionally recent git history) to identify new important findings, patterns, quirks, or lessons learned. Then propagate that knowledge to the appropriate project documentation and memory files.

**Optional argument:** `$ARGUMENTS` — a topic hint to focus the review (e.g., "rc-checkbox", "artifact saving"). If omitted, perform a broad review.

## Phase 1: Gather New Knowledge

### 1a. Session Context

Review the current conversation for:
- Bugs fixed and their root causes
- UI/component quirks discovered (e.g., library-specific behavior)
- Playwright API gotchas or non-obvious patterns
- Architectural decisions or conventions established
- Workarounds applied and why

### 1b. Recent Git History (if session context is insufficient)

```bash
git log --oneline -20
```

For each recent commit, check if it introduced patterns or fixes worth documenting:
```bash
git diff <commit>~1 <commit> --stat
```

### 1c. Memory Files

Read existing memory files to avoid duplicates.

**Primary location (project-level, committed to git):**
- `.claude/memory/MEMORY.md`
- All topic files linked from MEMORY.md (e.g., `.claude/memory/ttt-ui-quirks.md`)

**Also check the local auto-memory redirect:**
- Read the local auto-memory `MEMORY.md` (path shown in system prompt as "persistent auto memory directory")
- If it contains a redirect to project-level memory, confirm project-level files are the source of truth
- If it contains actual content (no redirect), migrate that content to `.claude/memory/` first

### 1d. Synthesize

Create a numbered list of **new findings** not yet covered in any documentation. For each finding include:
- **What:** The fact or pattern
- **Why it matters:** Impact on test authoring or debugging
- **Where discovered:** Which test/file/component
- **Confidence:** High (verified in multiple runs) / Medium (verified once) / Low (observed but not confirmed)

**Do NOT ask for user approval — propagate all findings automatically.** The user considers all new information valuable.

## Phase 2: Update Documentation

For each finding, determine which files need updates. Use the target matrix below — a finding may apply to multiple targets.

### Target Matrix

| Target File | Update When |
|-------------|-------------|
| `.claude/CLAUDE.md` | Framework-wide rules, conventions, or quirks that affect all test authoring |
| `docs/mcp/SELECTOR_STRATEGY.md` | Selector patterns, matching gotchas, TTT-specific element behavior |
| `docs/mcp/RECON_WORKFLOW.md` | Reconnaissance or code generation workflow changes |
| `.claude/skills/test-authoring/references/new-page.md` | Page object authoring rules or patterns |
| `.claude/skills/test-authoring/references/new-fixture.md` | Fixture authoring rules or patterns |
| `.claude/skills/test-authoring/references/new-test.md` | Test spec authoring rules or patterns |
| `.claude/skills/selector-fixer/SKILL.md` | New failure causes or diagnostic patterns |
| `docs/fix/*.md` | Detailed fix writeups for complex or recurring issues (create new file) |
| Memory: `.claude/memory/MEMORY.md` | Index entry for new topic files |
| Memory: `.claude/memory/<topic>.md` | Detailed notes with code examples |

### Update Rules

1. **Read before writing** — always read the target file first to find the right insertion point.
2. **No duplicates** — if the finding is already documented, skip or update the existing entry.
3. **Minimal edits** — add to existing sections when possible; only create new sections for genuinely new topics.
4. **Code examples** — include short, copy-pasteable TypeScript snippets for patterns and fixes.
5. **CLAUDE.md stays concise** — keep entries there brief (1-3 lines each). Put detailed explanations in memory files or docs.
6. **Memory files are for Claude** — project docs (`.claude/`, `docs/`) are for both Claude and humans.

### Memory File Guidelines

**Memory directory:** `.claude/memory/` (project-level, committed to git)

- `MEMORY.md` — index with short summaries (max 200 lines). Link to topic files.
- Topic files (e.g., `ttt-ui-quirks.md`, `playwright-patterns.md`) — detailed notes with code examples, organized by topic.
- Create new topic files when a finding doesn't fit existing ones.
- Update existing topic files when the finding extends a documented topic.

**Important:** Do NOT write to the local auto-memory directory (`~/.claude/projects/.../memory/`). That location only contains a redirect to the project-level memory. All memory writes go to `.claude/memory/` in the project root.

## Phase 3: Summary

After all updates, output a table:

```
| File | Change |
|------|--------|
| .claude/CLAUDE.md | Added X to Y section |
| .claude/memory/topic.md | New entry about Z |
| ... | ... |
```

Report total files updated and new files created.
