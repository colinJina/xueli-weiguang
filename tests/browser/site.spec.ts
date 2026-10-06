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

test("archive search combines filters, submits history and clears independently", async ({ page }) => {
  await page.goto("http://127.0.0.1:3100/archive?tones=blue");
  const input = page.getByRole("searchbox", { name: "搜索 PV" });
  await input.fill("pv");
  await expect(page).toHaveURL(/q=pv/);
  expect(new URL(page.url()).searchParams.get("tones")).toBe("blue");
  await input.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "已显示" })).toBeVisible();
  await expectNoOverflow(page);
  await page.goBack();
  await expect(input).toHaveValue("");
  expect(new URL(page.url()).searchParams.get("tones")).toBe("blue");
  await input.fill("archive_search_missing_9a3");
  await input.press("Enter");
  await expect(page.getByText("暂无符合条件的 PV", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "清除搜索", exact: true }).first().click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  expect(new URL(page.url()).searchParams.has("q")).toBe(false);
  expect(new URL(page.url()).searchParams.get("tones")).toBe("blue");
});

test("archive search restores SSR conditions and retries a failed query", async ({ page }) => {
  await page.goto("http://127.0.0.1:3100/archive?q=pv");
  const input = page.getByRole("searchbox", { name: "搜索 PV" });
  await expect(input).toHaveValue("pv");
  await expect(page.locator('a[href^="/video/"]').first()).toBeVisible();
  let fail = true;
  await page.route("**/api/archive/videos?**", async (route) => {
    if (fail) {
      return route.fulfill({ status: 503, json: { code: "ARCHIVE_UNAVAILABLE", message: "暂时无法更新 PV，请重试" } });
    }
    return route.continue();
  });
  await input.fill("排字");
  await input.press("Enter");
  await expect(page.getByText("更新失败，仍显示上次结果", { exact: true })).toBeVisible();
  await expect(page.locator('a[href^="/video/"]').first()).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "重试", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "已显示" })).toBeVisible();
  await input.fill("https://b23.tv/example");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("search", { name: "搜索 PV" }).getByRole("alert")).toContainText("完整 PV 链接");
  await expectNoOverflow(page);
});

test("archive search API enforces ranked cursors and legacy compatibility", async ({ request }) => {
  const first = await request.get("http://127.0.0.1:3100/api/archive/videos?stream=1&q=pv");
  expect(first.status()).toBe(200);
  const feed = await first.json();
  expect(feed.items).toHaveLength(24);
  expect(feed.nextCursor).toMatch(/^s1~/);
  expect(feed).not.toHaveProperty("totalCount");
  const next = await request.get("http://127.0.0.1:3100/api/archive/videos", { params: { stream: "1", q: "pv", cursor: feed.nextCursor } });
  expect(next.status()).toBe(200);
  const continuation = await next.json();
  const ids = [...feed.items, ...continuation.items].map((item: { id: string }) => item.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect((await request.get("http://127.0.0.1:3100/api/archive/videos", { params: { stream: "1", q: "别的关键词", cursor: feed.nextCursor } })).status()).toBe(400);
  expect((await request.get("http://127.0.0.1:3100/api/archive/videos?q=pv")).status()).toBe(400);
  expect((await request.get("http://127.0.0.1:3100/api/archive/videos")).status()).toBe(200);
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
