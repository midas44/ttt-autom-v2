declare const process: { env: Record<string, string | undefined> };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_ABBREVS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export class VacationTc1Data {
  readonly username: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly expectedStatus: string;
  readonly expectedVacationType: string;
  readonly expectedPaymentMonth: string;
  readonly notificationText: string;
  readonly comment: string;
  readonly periodPattern: RegExp;

  constructor(
    /** @env VACATION_TC1_USERNAME — Employee who can manage personal vacation requests */
    username = process.env.VACATION_TC1_USERNAME ?? "slebedev",
    /** @env VACATION_TC1_START_DATE — Vacation start date in dd.mm.yyyy format */
    startDate = process.env.VACATION_TC1_START_DATE ?? "01.03.2026",
    /** @env VACATION_TC1_END_DATE — Vacation end date in dd.mm.yyyy format */
    endDate = process.env.VACATION_TC1_END_DATE ?? "07.03.2026",
    /** @env VACATION_TC1_STATUS — Expected status after creation */
    expectedStatus = process.env.VACATION_TC1_STATUS ?? "New",
    /** @env VACATION_TC1_VACATION_TYPE — Expected vacation type for unpaid requests */
    expectedVacationType = process.env.VACATION_TC1_VACATION_TYPE ?? "Administrative",
    /** @env VACATION_TC1_NOTIFICATION — Success notification message */
    notificationText = process.env.VACATION_TC1_NOTIFICATION ??
      "A new vacation request has been created. When the status of the request changes, you will be notified by email",
  ) {
    this.username = username;
    this.startDate = startDate;
    this.endDate = endDate;
    this.expectedStatus = expectedStatus;
    this.expectedVacationType = expectedVacationType;
    this.expectedPaymentMonth = "";
    this.notificationText = notificationText;
    this.comment = `autotest vacation_tc2+ ${this.formatTimestamp()}`;
    this.periodPattern = this.buildPeriodPattern();
  }

  /** Returns a "ddmmyy_HHmm" timestamp for the current moment. */
  formatTimestamp(date: Date = new Date()): string {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(-2);
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}${mm}${yy}_${hh}${min}`;
  }

  /**
   * Builds a RegExp that matches the vacation period in multiple display formats:
   * numeric (dd.mm.yyyy), full month names, and abbreviated month names.
   */
  private buildPeriodPattern(): RegExp {
    const start = this.parseDate(this.startDate);
    const end = this.parseDate(this.endDate);

    const sDay = start.getUTCDate();
    const sMonth = start.getUTCMonth();
    const sYear = start.getUTCFullYear();
    const eDay = end.getUTCDate();
    const eMonth = end.getUTCMonth();
    const eYear = end.getUTCFullYear();

    const sDD = String(sDay).padStart(2, "0");
    const sMM = String(sMonth + 1).padStart(2, "0");
    const eDD = String(eDay).padStart(2, "0");
    const eMM = String(eMonth + 1).padStart(2, "0");

    const alternatives = [
      // "01 – 07 Mar 2026" (same-month compact format with en-dash or hyphen)
      `0?${sDay}\\s*[–\\-]\\s*0?${eDay}\\s+${MONTH_ABBREVS[eMonth]}\\w*\\s+${eYear}`,
      // "01.03.2026 – 07.03.2026" (numeric)
      `${sDD}\\.${sMM}\\.${sYear}.*${eDD}\\.${eMM}\\.${eYear}`,
      // "March 1 ... March 7" or "1 March ... 7 March" (full month name)
      `${MONTH_NAMES[sMonth]}\\s+${sDay}.*${MONTH_NAMES[eMonth]}\\s+${eDay}`,
      // "01 Mar ... 07 Mar" (abbreviated, cross-month)
      `0?${sDay}\\s+${MONTH_ABBREVS[sMonth]}.*0?${eDay}\\s+${MONTH_ABBREVS[eMonth]}`,
    ];

    return new RegExp(alternatives.join("|"));
  }

  private parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split(".").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
}
