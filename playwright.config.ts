import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";
import { GlobalConfig } from "./e2e/config/globalConfig";
import type { BrowserName } from "./e2e/config/configUtils";

const globalConfig = new GlobalConfig();

function resolveBrowserSettings(
  browser: BrowserName,
): PlaywrightTestConfig["use"] {
  switch (browser) {
    case "chrome":
      return { browserName: "chromium" };
    case "edge":
      return { browserName: "chromium", channel: "msedge" };
    case "firefox":
      return {
        browserName: "firefox",
        launchOptions: {
          firefoxUserPrefs: {
            "ui.systemUsesDarkTheme": 1,
            "dom.disable_window_move_resize": false,
          },
        },
      };
  }
}

const browserSettings = resolveBrowserSettings(globalConfig.browserName);

const sharedUse: PlaywrightTestConfig["use"] = {
  baseURL: globalConfig.appUrl,
  headless: false,
  screenshot: "only-on-failure",
  trace: "on-first-retry",
  video: "retain-on-failure",
  ...browserSettings,
};

export default defineConfig({
  reporter: [["line"], ["html", { open: "never" }]],
  testDir: "./e2e/tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  projects: [
    {
      name: "debug",
      grep: /@debug/,
      use: { ...sharedUse },
    },
    {
      name: "smoke",
      grep: /@smoke/,
      use: { ...sharedUse },
    },
    {
      name: "regress",
      grep: /@regress/,
      use: { ...sharedUse },
    },
  ],
});
