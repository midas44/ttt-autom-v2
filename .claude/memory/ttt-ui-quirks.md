# TTT UI Quirks

## rc-checkbox Component

TTT uses the `rc-checkbox` React library for custom checkboxes. This has a critical implication:

**Playwright's `.check()` and `.uncheck()` methods do NOT work correctly** — they don't fire the correct synthetic events that rc-checkbox listens for. The checkbox visual state may change but the React state does not update.

**Fix:** Always use `.click()` instead:
```typescript
// WRONG — state won't propagate in rc-checkbox
await checkbox.check();
await checkbox.uncheck();

// CORRECT — fires native click event that rc-checkbox handles
await checkbox.click();
```

This applies to both checking and unchecking. Verify the state changed after clicking:
```typescript
await expect(checkbox).toBeChecked({ timeout: 5000 });  // wait for checked
await checkbox.click();
await expect(checkbox).not.toBeChecked({ timeout: 3000 });  // verify unchecked
```

**Discovered:** admin-tc1 implementation (API key dialogs). Affected pages: ApiKeyCreateDialog, ApiKeyEditDialog.

## Dialog Naming Convention

TTT modals use **present participle** verb forms in dialog titles:
- "Creating key" (not "Create key")
- "Editing key" (not "Edit key")
- "Deleting key" (not "Delete key")

This matters when using `getByRole('dialog', { name: /.../ })`. Use `/Creating key/i` not `/Create key/i`.

**Pattern discovered from:** Admin panel > API page dialogs.

## Dialog Checkbox Race Conditions

When opening edit dialogs that load existing data, checkbox state may not be settled immediately after the dialog becomes visible. The dialog opens first, then data is fetched and applied to checkboxes.

**Fix:** Wait for the expected checkbox state before interacting:
```typescript
async waitForOpen(): Promise<void> {
  await this.dialog.waitFor({ state: "visible" });
  await this.allCheckbox.waitFor({ state: "visible" });
}

async uncheckAll(): Promise<void> {
  // Wait for checkbox state to reflect the loaded data
  await expect(this.allCheckbox).toBeChecked({ timeout: 5000 });
  await this.allCheckbox.click();
  await expect(this.allCheckbox).not.toBeChecked({ timeout: 3000 });
}
```

**Discovered:** admin-tc1 — intermittent failure where edit dialog opened but "All" checkbox click happened before state was initialized.

## getByRole exact Matching

When using `getByRole` with a name that is a substring of other element names, always use `exact: true`:

```typescript
// WRONG — matches "All", "ASSIGNMENTS_ALL", "PROJECTS_ALL"
this.dialog.getByRole("checkbox", { name: "All" });

// CORRECT — matches only "All"
this.dialog.getByRole("checkbox", { name: "All", exact: true });
```

**Discovered:** admin-tc1 — strict mode violation because 3 checkboxes matched.
