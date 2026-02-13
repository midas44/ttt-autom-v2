## Title
Report TC1 - Add task report via inline editor and clear it

## Detailed Description

### Steps
1. Log in to the application using username `vulyanov`.
2. If the interface language is Russian (`RU`), change it to English (`EN`).
3. Open the "My tasks" page and confirm it is displayed.
4. In the search field, enter `HR / autotest <timestamp>` where `<timestamp>` follows the `ddmmyy_HHmm` pattern (for example, `250326_1530`).
5. Click the `Add a task` button located next to the search field.
6. Verify that the new task appears in the tasks table.
7. In the row for the added task, double-click the cell intersecting with the current date column to enable inline editing.
8. Enter the report value `4.25` into the editor.
9. Click outside the cell to exit inline editing mode.
10. Reload the page.
11. Confirm that the value `4.25` persists in the edited cell.
12. Double-click the same cell again to return to inline editing mode.
13. Clear the input so the editor is empty.
14. Click outside the cell to exit inline editing mode.
15. Reload the page.
16. Confirm that the previously edited cell is empty.
17. Clear the search field by clicking the `(X)` icon in the input.
18. Confirm that the search field is empty.
19. Navigate to `appURL/logout` to sign out of the application directly by URL.
20. Close the browser window.

### Data
- Username: `vulyanov`
- Project name: `HR`
- Task name: `autotest`
- Report value: `4.25`
- Timestamp format: `ddmmyy_HHmm`
