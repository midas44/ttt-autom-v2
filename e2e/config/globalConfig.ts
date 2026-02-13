import * as path from "path";
import type { Page } from "@playwright/test";
import { readYaml, readNumber } from "./configUtils";
import { TttConfig } from "./tttConfig";

const GLOBAL_YML = path.resolve(__dirname, "global.yml");

export class GlobalConfig {
  readonly globalTimeout: number;
  readonly windowPositionX: number;
  readonly windowPositionY: number;
  readonly fixtureDelayMs: number;
  readonly windowWidth: number;
  readonly windowHeight: number;
  readonly appUrl: string;

  private readonly tttConfig: TttConfig;

  constructor(tttConfig: TttConfig = new TttConfig()) {
    this.tttConfig = tttConfig;
    this.appUrl = tttConfig.appUrl;

    const data = readYaml(GLOBAL_YML);

    this.globalTimeout = readNumber(data["globalTimeout"], 15000, "globalTimeout");
    this.windowPositionX = readNumber(data["windowPositionX"], 300, "windowPositionX");
    this.windowPositionY = readNumber(data["windowPositionY"], 80, "windowPositionY");
    this.fixtureDelayMs = readNumber(data["fixtureDelayMs"], 500, "fixtureDelayMs");
    this.windowWidth = readNumber(data["windowWidth"], 2560, "windowWidth");
    this.windowHeight = readNumber(data["windowHeight"], 1440, "windowHeight");
  }

  /** Returns a promise that resolves after `fixtureDelayMs` milliseconds. */
  delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.fixtureDelayMs));
  }

  /** Sets viewport size and positions the browser window (browser-specific). */
  async applyViewport(page: Page): Promise<void> {
    await page.setViewportSize({
      width: this.windowWidth,
      height: this.windowHeight,
    });
    await this.positionWindow(page);
  }

  private async positionWindow(page: Page): Promise<void> {
    const x = this.windowPositionX;
    const y = this.windowPositionY;
    const width = this.windowWidth;
    const height = this.windowHeight;

    try {
      const engineName = page.context().browser()?.browserType().name();
      if (engineName === "chromium") {
        await this.positionChromium(page, x, y, width, height);
      } else {
        await this.positionFirefox(page, x, y);
      }
    } catch {
      // Silently ignore — graceful degradation in headless or unsupported environments
    }
  }

  private async positionChromium(
    page: Page,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<void> {
    const cdp = await page.context().newCDPSession(page);
    const { windowId } = await cdp.send("Browser.getWindowForTarget");
    await cdp.send("Browser.setWindowBounds", {
      windowId,
      bounds: { left: x, top: y, width, height, windowState: "normal" },
    });
  }

  private async positionFirefox(
    page: Page,
    x: number,
    y: number,
  ): Promise<void> {
    await page.evaluate(
      ([px, py]) => window.moveTo(px, py),
      [x, y] as const,
    );
  }
}
