import * as path from "path";
import {
  readYaml,
  readString,
  readWaitUntil,
  type WaitUntilValue,
} from "./configUtils";

const TTT_YML = path.resolve(__dirname, "ttt/ttt.yml");

export class TttConfig {
  readonly appName: string;
  readonly appUrl: string;
  readonly env: string;
  readonly lang: string;
  readonly dashboardPath: string;
  readonly logoutUrl: string;
  readonly waitUntil: WaitUntilValue;
  readonly logoutSuccessText: string;

  constructor() {
    const data = readYaml(TTT_YML);

    this.appName = readString(
      data["appName"],
      "TTT (TimeTrackingTool aka TimeReportingTool)",
      "appName",
    );
    this.env = readString(data["env"], "qa-1", "env");
    this.lang = readString(data["lang"], "en", "lang");
    this.dashboardPath = readString(
      data["dashboardPath"],
      "/report",
      "dashboardPath",
    );
    this.logoutUrl = readString(
      data["logoutUrl"],
      "https://cas-demo.noveogroup.com/logout",
      "logoutUrl",
    );
    this.waitUntil = readWaitUntil(data["waitUntil"]);
    this.logoutSuccessText = readString(
      data["logoutSuccessText"],
      "Logout successful",
      "logoutSuccessText",
    );

    this.appUrl = this.resolveAppUrl(
      readString(
        data["appUrl"],
        "https://ttt-***.noveogroup.com",
        "appUrl",
      ),
    );
  }

  /** Replaces `***` in the URL template with the env name and validates the result. */
  private resolveAppUrl(template: string): string {
    const resolved = template.replace("***", this.env);
    try {
      new URL(resolved);
    } catch {
      throw new Error(
        `Invalid resolved appUrl: "${resolved}" (template: "${template}", env: "${this.env}")`,
      );
    }
    return resolved;
  }

  /** Constructs a full URL by joining `appUrl` with the given pathname. */
  buildUrl(pathname: string): string {
    return new URL(pathname, this.appUrl).toString();
  }
}
