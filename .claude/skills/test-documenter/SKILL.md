---
name: test-documenter
description: Generate or update documentation for existing test cases. Use when creating or refreshing the docs/ markdown file for a test spec. Reads the spec, data class, fixtures, and page objects to produce a complete manual-reproduction document.
---

# Test Documenter

Generate documentation for an existing test case.

## Input

`$ARGUMENTS` — test spec file name or path (e.g., `vacation.tc2-plus`, `report.tc5`).

## Process

1. Find the spec file in `e2e/tests/`.
2. Read the spec to understand the full test flow.
3. Read the corresponding data class in `e2e/data/`.
4. Read fixtures and page objects used by the test.

## Output Format

Create `docs/[test-name].md`:

### Section 1: Title

Concise, checklist-friendly. No data, no icons.

Example: "Verify vacation request creation and deletion flow"

### Section 2: Detailed Description

#### Steps

Numbered list of every action, written for manual reproduction:
- Include specific UI elements, navigation paths, expected outcomes.
- Reference field names and button labels as in the UI.
- Each verification step describes what to check.

#### Data

Bullet list of all dynamic inputs with default values:
- Use field names from the data class.
- Format: `- fieldName: defaultValue`

### Rules

- No icons or emojis.
- Steps detailed enough for manual execution.
- Data section lists every parameterized value.
