import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });
const errors = new WeakMap<Page, string[]>();
const forbiddenCalls = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const runtimeErrors: string[] = [];
  const calls: string[] = [];
  errors.set(page, runtimeErrors);
  forbiddenCalls.set(page, calls);
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("request", (request) => {
    if (
      /https?:\/\/(?:api\.[^/]*bilibili\.com|[^/]*youtube[^/]*\/youtubei|youtubei\.googleapis\.com)\//.test(
        request.url(),
      )
    ) {
      calls.push(request.url());
    }
  });
  // UI smoke checks never write real user, submission, push, or video interaction data.
  await page.route("**/api/**", (route) => {
    if (route.request().method() === "GET") {
      return route.continue();
    }
    return route.fulfill({
      status: 403,
      json: { message: "浏览器回归测试仅检查界面" },
    });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
  expect(forbiddenCalls.get(page)).toEqual([]);
});

async function expectNoOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    )
    .toBe(true);
}

test("production home navigation and login", async ({ page }, testInfo) => {
  const response = await page.goto("http://127.0.0.1:3100");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
  await expect(page.locator("header")).toHaveCSS("opacity", "1");
  await expect(
    page.getByRole("link", { name: "雪笠微光", exact: true }),
  ).toBeVisible();
  await expectNoOverflow(page);
  const login = page.getByRole("button", { name: "登录", exact: true });
  await login.click();
  await expect(
    page.getByRole("dialog", { name: "登录" }),
  ).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(login).toBeFocused();
  if (testInfo.project.name === "mobile") {
    const menu = page.getByRole("button", { name: "打开导航菜单" });
    await menu.click();
    await page.getByRole("menuitem", { name: "投稿 PV" }).click();
    await expect(page.getByRole("dialog", { name: "登录", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
  }
});

test("production archive filters, color palette and video navigation", async ({
  page,
}) => {
  const response = await page.goto("http://127.0.0.1:3100/archive");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("button", { name: "全部", exact: true }).first(),
  ).toBeVisible();
  await expectNoOverflow(page);
  const neutral = page.getByRole("button", { name: "筛选中性色调" });
  await neutral.click();
  await expect(
    page.getByRole("button", { name: "清除中性色调筛选" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "清除中性色调筛选" }).click();
  await expect(neutral).toHaveAttribute("aria-pressed", "false");
  const palette = page.getByRole("button", { name: "色盘", exact: true });
  await palette.click();
  await expect(
    page.getByRole("dialog", { name: "色盘", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(palette).toBeFocused();
  const card = page.locator('a[href^="/video/"]').first();
  await expect(card).toBeVisible();
  const href = await card.getAttribute("href");
  if (!href) {
    throw new Error("Archive card must link to a video");
  }
  await card.click();
  await expect(page).toHaveURL(new RegExp(href));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("production video share and guest favorite login", async ({ page }) => {
  await page.goto("http://127.0.0.1:3100");
  const link = page.locator('a[href^="/video/"]').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  if (!href) {
    throw new Error("Home card must link to a video");
  }
  await page.goto(`http://127.0.0.1:3100${href}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoOverflow(page);
  const share = page.getByRole("button", { name: "分享", exact: true });
  await share.click();
  await expect(page.getByRole("dialog", { name: "分享 PV" })).toBeVisible();
  await expect(page.getByAltText("扫码查看 PV")).toBeVisible();
  await page.getByRole("tab", { name: "图片分享" }).click();
  await expect(page.getByRole("tabpanel", { name: "图片分享" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(share).toBeFocused();
  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "登录" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
});

test("production guest archive and public profile cards", async ({
  page,
}, testInfo) => {
  await page.goto("http://127.0.0.1:3100/user");
  await expect(
    page.getByRole("heading", { name: "我的收藏", exact: true }),
  ).toBeVisible();
  await expectNoOverflow(page);
  if (testInfo.project.name === "mobile") {
    const trigger = page.getByRole("button", { name: "收藏夹", exact: true });
    await trigger.click();
    await expect(
      page.getByRole("dialog", { name: "收藏夹菜单" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
  await page.goto("http://127.0.0.1:3100/profile/browser-test");
  await expect(
    page.getByRole("heading", { name: "@browser-test" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "公开主页暂未开放" }),
  ).toBeVisible();
  await expectNoOverflow(page);
});

test.describe("production notifications", () => {
  test.use({ serviceWorkers: "allow" });
  test("notification dialog restores focus without subscribing", async ({
    page,
  }) => {
    await page.goto("http://127.0.0.1:3100");
    const trigger = page.getByRole("button", { name: "开启新 PV 通知" });
    await expect(trigger).toBeEnabled();
    await trigger.click();
    await expect(
      page.getByRole("dialog", { name: "新 PV 通知" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });
});
