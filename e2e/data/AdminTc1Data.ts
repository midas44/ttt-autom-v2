declare const process: { env: Record<string, string | undefined> };

export class AdminTc1Data {
  readonly username: string;
  readonly createdBy: string;
  readonly apiKeyName: string;
  readonly apiKeyNamePattern: RegExp;
  readonly allowedMethodsAfterCreate: string[];
  readonly allowedMethodsAfterEdit: string;

  constructor(
    /** @env ADMIN_TC1_USERNAME — Admin user who manages API keys */
    username = process.env.ADMIN_TC1_USERNAME ?? "pvaynmaster",
    /** @env ADMIN_TC1_CREATED_BY — Display name shown in "Created" column */
    createdBy = process.env.ADMIN_TC1_CREATED_BY ?? "Pavel Weinmeister",
  ) {
    this.username = username;
    this.createdBy = createdBy;
    this.apiKeyName = `autotest-${this.formatTimestamp()}`;
    this.apiKeyNamePattern = new RegExp(this.apiKeyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    this.allowedMethodsAfterEdit = "";
    this.allowedMethodsAfterCreate = [
      "PROJECTS_ALL",
      "VACATIONS_DELETE",
      "EMPLOYEES_VIEW",
      "SUGGESTIONS_VIEW",
      "STATISTICS_VIEW",
      "REPORTS_APPROVE",
      "VACATIONS_APPROVE",
      "VACATION_DAYS_EDIT",
      "ASSIGNMENTS_VIEW",
      "OFFICES_VIEW",
      "REPORTS_EDIT",
      "VACATIONS_CREATE",
      "VACATIONS_VIEW",
      "CALENDAR_VIEW",
      "ASSIGNMENTS_ALL",
      "VACATIONS_EDIT",
      "VACATION_DAYS_VIEW",
      "VACATIONS_PAY",
      "REPORTS_VIEW",
      "CALENDAR_EDIT",
      "TASKS_EDIT",
    ];
  }

  /** Returns a "yyyymmdd-HHmmss" timestamp for the current moment. */
  private formatTimestamp(date: Date = new Date()): string {
    const yyyy = String(date.getFullYear());
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
  }
}
