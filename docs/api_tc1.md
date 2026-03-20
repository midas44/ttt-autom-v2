## Title
API TC1 - Get, change and reset server clock with test endpoints

## Detailed description

### Steps

1. Authorize in ttt swagger
2. Using **GET /api/ttt/v1/test/clock** endpoint get current server time, verify responce: **code** 200 and **time** value.
3. Using **PATCH /api/ttt/v1/test/clock** endpoint change server time to one day to the future, verify responce: **code** 200 and **time** value.
4. Using **POST /api/ttt/v1/test/clock/reset** endpoint reset server time (to current time), verify responce: **code** 200 and **time** value.

### Data
- swagger: `/api/ttt/swagger-ui.html?urls.primaryName=test-api`
- API key (API_SECRET_TOKEN) = apiToken in chosen env config file
- time format in response: `2026-03-02T13:23:00.682418446`
- time format in request: `2026-03-02T06:19:05.564Z`