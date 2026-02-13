## Title
Vacation TC1 - Create unpaid vacation request and remove it

## Detailed description

### Steps
1. Sign in as an employee who can manage personal vacation requests.
2. Ensure the dashboard is displayed in English (switch from RU if needed).
3. Open **Calendar of absences → My vacations and days off** and confirm the page loads.
4. Start a new vacation request using **Create a request**.
5. Enter the provided start and end dates into the vacation period fields.
6. Enable the **Unpaid vacation** option and leave other toggles untouched.
7. Fill in the comment field using the parameterized template (`autotest vacation_tc2+ [timestamp]`).
8. Check that the modal contains no red error text where the red channel dominates.
9. Submit the request and verify the success notification appears in green with the expected message.
10. Locate the newly created vacation entry in the table and validate the values in the **Status**, **Vacation type**, and **Payment month** columns.
11. Open the request details and confirm the displayed period, type, status, and comment match the submitted data.
12. Delete the request from the details dialog and verify it disappears from the table.
13. Log out of the application.

### Data
- Username: `slebedev`
- Date format: `dd.mm.yyyy`
- Start date: `01.03.2026`
- End date: `07.03.2026`
- Comment template: `autotest vacation_tc2+ [timestamp]`
- Timestamp format: `ddmmyy_HHmm`
- Status: `New`
- Vacation type: `Administrative`
- Payment month: *(blank)*
- Notification text: `A new vacation request has been created. When the status of the request changes, you will be notified by email`
