import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";
import { GlobalConfig } from "./e2e/config/globalConfig";
import type { BrowserName } from "./e2e/config/configUtils";

const globalConfig = new GlobalConfig();

const BROWSERS: BrowserName[] = ["chrome", "firefox"];

const TAG_CONFIG: Record<string, RegExp> = {
  debug: /@debug/,
  smoke: /@smoke/,
  regress: /@regress/,
};

function resolveBrowserSettings(
  browser: BrowserName,
): PlaywrightTestConfig["use"] {
  switch (browser) {
    case "chrome":
      return {
        browserName: "chromium",
        launchOptions: {
          args: [
            `--window-position=${globalConfig.windowPositionX},${globalConfig.windowPositionY}`,
            `--window-size=${globalConfig.windowWidth},${globalConfig.windowHeight}`,
          ],
        },
      };
    case "edge":
      return { browserName: "chromium", channel: "msedge" };
    case "firefox":
      return {
        browserName: "firefox",
        launchOptions: {
          firefoxUserPrefs: {
            "ui.systemUsesDarkTheme": 1,
            "dom.disable_window_move_resize": false,
            "network.proxy.type": 0,
          },
        },
      };
  }
}

function buildSharedUse(browser: BrowserName): PlaywrightTestConfig["use"] {
  return {
    baseURL: globalConfig.appUrl,
    headless: false,
    viewport: {
      width: globalConfig.windowWidth,
      height: globalConfig.windowHeight,
    },
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
    ...resolveBrowserSettings(browser),
  };
}

const projects = BROWSERS.flatMap((browser) =>
  Object.entries(TAG_CONFIG).map(([tag, grep]) => ({
    name: `${browser}-${tag}`,
    grep,
    use: buildSharedUse(browser),
  })),
);

export default defineConfig({
  reporter: [["line"], ["html", { open: "never" }]],
  testDir: "./e2e/tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  projects,
});
