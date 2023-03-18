import { test as base, chromium, type BrowserContext } from "@playwright/test";
import path from "path";
import { v4 } from "uuid";

// https://playwright.dev/docs/chrome-extensions#testing
const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const pathToExtension = path.join(process.cwd(), "dist");
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const [_background] = context.serviceWorkers();
    const background =
      _background || (await context.waitForEvent("serviceworker"));

    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
});
const expect = test.expect;

test.skip('"End to end" chrome test', async ({ page }) => {
  const password = process.env.NOTION_TEST_PASSWORD;
  if (!password)
    throw new Error("Missing NOTION_TEST_PASSWORD environment variable");
  const samePagePassword = process.env.SAMEPAGE_TEST_PASSWORD;
  if (!samePagePassword)
    throw new Error("Missing SAMEPAGE_TEST_PASSWORD environment variable");

  await test.step("Login to Notion", async () => {
    await page.goto("https://notion.so");
    await page.locator(".desktop-actions >> text=Log in").click();
    await page
      .getByPlaceholder("Enter your email address...")
      .type("test@samepage.network");
    await page.locator("text=Continue with email").click();
    await page.getByPlaceholder("Enter your password...").type(password);
    await page.locator("text=Continue with password").click();
    await expect(page.locator(".notion-frame")).toBeVisible();
  });

  await test.step("Onboard Notebook Onboarding Flow", async () => {
    await page.reload();
    await page.locator("text=Get Started").click();
    await page.locator("text=Add Another Notebook").click();
    await page.locator("text=Email >> input").fill("test@samepage.network");
    await page.locator("text=Password >> input").fill(samePagePassword);
    await page.locator("text=I have read and agree").click();
    await page.locator('div[role=dialog] >> text="Connect"').click();
    await page.locator('div[role=dialog] >> button >> text="All Done"').click();
    await expect(
      page.locator('div[role=dialog] >> text="Welcome to SamePage"')
    ).not.toBeVisible();
  });

  const pageName = `SamePage Test ${v4().slice(0, 8)}`;
  await test.step(`Create and Navigate to ${pageName}`, async () => {
    // TODO
  });
});
