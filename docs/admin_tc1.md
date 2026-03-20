## Title
Admin TC1 - Create, edit and delete API key 

## Detailed description

### Steps
1. Sign in as admin.
2. Ensure the dashboard is displayed in English (switch from RU if needed).
3. Open **Admin panel → API** and confirm the page loads.
4. Start a new API key creation using **Create a key** button.
5. Enter the name in provided format and check **All** checkbox.
6. Click **Create** button.
7. Locate the newly created API key in the table and validate the values in the **Name**, **Created**, and **Allowed API methods** columns.
8. Create screenshot, copy API key in **Value** column. Save to artifacts dir: screen_[TC name]_[timestamp].png, api-key_[TC name]_[timestamp].txt
9. Open API key for editing using **Edit the key** icon-button.
10. Uncheck **All** checkbox.
11. Click **Edit** button.
12. Locate edited API key in the table and validate the value in the **Allowed API methods** column.
13. Delete API key using **Delete the key** icon-button with confirmation on pop-up and verify it disappears from the table.
13. Log out of the application.

### Data
- Username: `pvaynmaster`
- API key name format (uses realtime timestamp): `autotest- [yyyymmdd-HHmmss]`
- **Name** column value = API key name
- **Created** column value: `Pavel Weinmeister`
- **Allowed API methods** value (step7): `PROJECTS_ALL, VACATIONS_DELETE, EMPLOYEES_VIEW, SUGGESTIONS_VIEW, STATISTICS_VIEW, REPORTS_APPROVE, VACATIONS_APPROVE, VACATION_DAYS_EDIT, ASSIGNMENTS_VIEW, OFFICES_VIEW, REPORTS_EDIT, VACATIONS_CREATE, VACATIONS_VIEW, CALENDAR_VIEW, ASSIGNMENTS_ALL, VACATIONS_EDIT, VACATION_DAYS_VIEW, VACATIONS_PAY, REPORTS_VIEW, CALENDAR_EDIT, TASKS_EDIT`
- **Allowed API methods** value (step12): blank
