---
name: test-authoring
description: Create and scaffold test automation artifacts for the TTT Playwright framework. Use when creating new test cases, page objects, or fixtures. Handles data classes, page objects, fixtures, spec files, and documentation following the project's layered architecture. Triggers on requests to create tests, pages, fixtures, or any test automation component.
---

# Test Authoring

Create test automation artifacts following the TTT framework architecture.

Read `prompts/project_specification.md` for the complete framework specification before creating any artifact.

## Artifact Types

Determine the artifact type from context or `$ARGUMENTS`:

### new-test
Create a complete test case from a brief. See `references/new-test.md`.

### new-page
Create a page object class. See `references/new-page.md`.

### new-fixture
Create a fixture class. See `references/new-fixture.md`.

## Shared Rules

1. Read all existing files in the relevant `e2e/` subdirectory before creating anything.
2. Reuse existing code — only create new files when existing ones cannot be extended.
3. Follow selector priority: `getByRole` > stable attributes > scoped CSS > text > XPath.
4. All `readonly` properties on classes. No base classes — use composition.
5. No raw locators in spec files. No hardcoded test data in specs or fixtures.
6. Every verification: `globalConfig.delay()` → assert → screenshot via `VerificationFixture`.
7. Run `npx playwright test <spec> --project=debug` after creation to verify.
