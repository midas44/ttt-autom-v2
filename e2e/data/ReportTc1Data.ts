declare const process: { env: Record<string, string | undefined> };

import { formatTimestamp, formatDateColumn } from "../utils/stringUtils";

export class ReportTc1Data {
  readonly username: string;
  readonly projectName: string;
  readonly taskName: string;
  readonly reportValue: string;
  readonly searchTerm: string;
  readonly rowPattern: RegExp;
  readonly dateLabel: string;

  constructor(
    /** @env REPORT_TC1_USERNAME — Employee who can manage personal task reports */
    username = process.env.REPORT_TC1_USERNAME ?? "vulyanov",
    /** @env REPORT_TC1_PROJECT — Project name prefix for the search term */
    projectName = process.env.REPORT_TC1_PROJECT ?? "HR",
    /** @env REPORT_TC1_TASK — Task name component for the search term */
    taskName = process.env.REPORT_TC1_TASK ?? "autotest",
    /** @env REPORT_TC1_REPORT_VALUE — Numeric value to enter in the report cell */
    reportValue = process.env.REPORT_TC1_REPORT_VALUE ?? "4.25",
  ) {
    this.username = username;
    this.projectName = projectName;
    this.taskName = taskName;
    this.reportValue = reportValue;

    const timestamp = formatTimestamp();
    this.searchTerm = `${projectName} / ${taskName} ${timestamp}`;
    this.rowPattern = new RegExp(`${taskName}\\s+${timestamp}`);
    this.dateLabel = formatDateColumn();
  }
}
