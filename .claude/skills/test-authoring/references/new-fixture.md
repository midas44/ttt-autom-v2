# New Fixture

Create a fixture class for a reusable test workflow.

## Input

`$ARGUMENTS` — fixture name and purpose description.

## Structure

```typescript
import { Page } from "@playwright/test";
import { GlobalConfig } from "../config/globalConfig";

export class [FixtureName] {
  private readonly somePage: SomePage;

  constructor(
    private readonly page: Page,
    private readonly globalConfig: GlobalConfig,
  ) {
    this.somePage = new SomePage(this.page);
  }

  async ensureReady(): Promise<void> {
    await this.somePage.waitForReady();
  }

  async run(): Promise<void> {
    // workflow steps
    await this.globalConfig.delay();
  }
}
```

## Rules

- Constructor receives `Page`, config objects, and optionally `VerificationFixture`.
- Create page objects internally — don't require as constructor params unless sharing instances.
- All constructor parameters `readonly`.
- Action-oriented method names: `ensureReady()`, `run()`, `verify*()`, `create*()`, `delete*()`.
- Include `globalConfig.delay()` before verifications and after navigation.
- For verification methods, accept `TestInfo` and delegate to `VerificationFixture`.
- Support optional behavior via options interfaces (e.g., `{ verify?: boolean }`).
- Wait for `networkidle` after actions triggering server requests.
- Prefer extending an existing fixture before creating a new one.
