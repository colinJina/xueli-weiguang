import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
import { favorites } from "../ui/fixtures";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const runtimeErrors: string[] = [];
  errors.set(page, runtimeErrors);
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  // All mutations in the fixture are intercepted; no account or production data is touched.
  await page.route("https://supabase.test/**", (route) =>
    route.fulfill({
      status: 400,
      json: {
        msg: "Invalid login credentials",
        error_code: "invalid_credentials",
      },
    }),
  );
  await page.route("**/api/user/**", (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      return route.fulfill({ json: favorites });
    }
    if (request.method() === "PUT") {
      const body = request.postDataJSON();
      return route.fulfill({
        json: {
          videoId: "video-test",
          collectionIds: body.collectionIds,
          isFavorited: body.collectionIds.length > 0,
        },
      });
    }
    return route.fulfill({ json: { id: "created-test" } });
  });
  await page.route("**/api/submissions", (route) =>
    route.fulfill({ json: { message: "已收到" } }),
  );
  await page.goto("http://127.0.0.1:4173");
  await expect(
    page.getByRole("heading", { name: "组件回归测试" }),
  ).toBeVisible();
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

async function expectFocusInside(page: Page, dialogName: string) {
  await expect
    .poll(() =>
      page
        .getByRole("dialog", { name: dialogName })
        .evaluate((element) => element.contains(document.activeElement)),
    )
    .toBe(true);
}

test("login tabs, trapped focus and return focus", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "打开登录" });
  await trigger.click();
  const login = page.getByRole("tab", { name: "登录", exact: true });
  await login.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "注册", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "注册" })).toBeVisible();
  await page.keyboard.press("Home");
  await expect(login).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("textbox", { name: "邮箱" })).toBeVisible();
  for (let index = 0; index < 10; index++) {
    await page.keyboard.press(index % 2 ? "Tab" : "Shift+Tab");
    await expectFocusInside(page, "登录");
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect
    .poll(() =>
      page.locator("body").evaluate((body) => getComputedStyle(body).overflow),
    )
    .not.toBe("hidden");
});

test("nested dialogs and the close guard", async ({ page }) => {
  await page.getByRole("button", { name: "打开嵌套弹窗" }).click();
  await page.getByRole("button", { name: "打开子弹窗" }).click();
  await expectFocusInside(page, "子弹窗");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "子弹窗" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "打开子弹窗" })).toBeFocused();
  await expect
    .poll(() =>
      page.locator("body").evaluate((body) => getComputedStyle(body).overflow),
    )
    .toBe("hidden");
  await page.getByRole("checkbox", { name: "禁止关闭" }).check();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "关闭父弹窗" }).click();
  await expect(page.getByRole("dialog", { name: "父弹窗" })).toBeVisible();
  await page.getByRole("checkbox", { name: "禁止关闭" }).uncheck();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "打开嵌套弹窗" }),
  ).toBeFocused();
});

test("menu keyboard selection opens a dialog with correct return focus", async ({
  page,
}) => {
  const trigger = page.getByRole("button", { name: "收藏操作" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "调整收藏夹" }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("menuitem", { name: "备注与标签", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "备注与标签", exact: true }),
  ).toBeVisible();
  await expectFocusInside(page, "备注与标签");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("favorite checkboxes persist the selected folders", async ({ page }) => {
  await page.getByRole("button", { name: "打开收藏" }).click();
  const folder = page.getByRole("checkbox", { name: /音乐/ });
  await expect(folder).toBeChecked();
  await folder.uncheck();
  const request = page.waitForRequest((request) => request.method() === "PUT");
  await page.getByRole("button", { name: "完成", exact: true }).click();
  expect((await request).postDataJSON()).toEqual({
    collectionIds: ["folder-a"],
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "打开收藏" })).toBeFocused();
});

test("collection select loads each annotation and saves the right membership", async ({
  page,
}) => {
  await page.getByRole("button", { name: "打开备注" }).click();
  const select = page.getByRole("combobox", { name: "所属收藏夹" });
  await expect(
    page.getByRole("textbox", { name: "备注", exact: true }),
  ).toHaveValue("第一份备注");
  await select.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("option", { name: "PV", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("option", { name: "音乐", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(select).toBeFocused();
  await expect(
    page.getByRole("textbox", { name: "备注", exact: true }),
  ).toHaveValue("第二份备注");
  await page
    .getByRole("textbox", { name: "备注", exact: true })
    .fill("更新后的备注");
  await page.getByRole("button", { name: "风景", exact: true }).click();
  const request = page.waitForRequest(
    (request) => request.method() === "PATCH",
  );
  await page.getByRole("button", { name: "保存", exact: true }).click();
  const saved = await request;
  expect(saved.url()).toContain("/collection-items/item-b");
  expect(saved.postDataJSON()).toEqual({
    note: "更新后的备注",
    tagIds: ["tag-a"],
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("failed annotation saves keep the dialog and draft", async ({ page }) => {
  await page.route("**/api/user/collection-items/**", (route) =>
    route.fulfill({ status: 500, json: { message: "保存失败，请重试" } }),
  );
  await page.getByRole("button", { name: "打开备注" }).click();
  await page
    .getByRole("textbox", { name: "备注", exact: true })
    .fill("保留草稿");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("保存失败");
  await expect(
    page.getByRole("textbox", { name: "备注", exact: true }),
  ).toHaveValue("保留草稿");
  await expect(
    page.getByRole("button", { name: "保存", exact: true }),
  ).toBeEnabled();
});

test("submission tabs, native form fields and link submission", async ({
  page,
}) => {
  await page.getByRole("button", { name: "打开投稿" }).click();
  await page.getByRole("tab", { name: "链接投稿" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tabpanel", { name: "本地上传" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "本地上传" })).toBeFocused();
  await page
    .getByRole("textbox", { name: "标题", exact: true })
    .fill("PV 标题");
  await page
    .getByRole("textbox", { name: "简介", exact: true })
    .fill("简介草稿");
  await page.getByRole("checkbox", { name: /申请首页展示/ }).check();
  await expect(page.getByRole("button", { name: "提交 PV" })).toBeDisabled();
  await page.getByRole("tab", { name: "本地上传" }).focus();
  await page.keyboard.press("Home");
  await page
    .getByRole("textbox", { name: "PV 链接" })
    .fill("https://www.youtube.com/watch?v=test-video");
  const request = page.waitForRequest("**/api/submissions");
  await page.getByRole("button", { name: "提交链接" }).click();
  expect((await request).postDataJSON()).toEqual({
    url: "https://www.youtube.com/watch?v=test-video",
  });
  await expect(page.getByRole("status")).toContainText("投稿已收到，等待审核");
});

test("native cover selection opens a nested crop dialog and returns a JPG", async ({
  page,
}) => {
  await page.getByRole("button", { name: "打开投稿" }).click();
  await page.getByRole("tab", { name: "本地上传" }).click();
  const cover = await sharp({
    create: { width: 800, height: 450, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await page
    .getByLabel("封面图", { exact: true })
    .setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: cover });
  await expect(page.getByRole("dialog", { name: "裁切封面" })).toBeVisible();
  await page.getByRole("button", { name: "保存裁切" }).click();
  await expect(page.getByRole("dialog", { name: "裁切封面" })).toHaveCount(0);
  await expect(
    page.getByRole("dialog", { name: "投稿 PV" }),
  ).toBeVisible();
  await expect(page.getByText("cover-16x9.jpg", { exact: true })).toBeVisible();
  await expectFocusInside(page, "投稿 PV");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "打开投稿" })).toBeFocused();
});

test("replacing an expiring toast keeps the new persistent message", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.getByRole("button", { name: "显示短提示" }).click();
  await expect(page.getByText("操作已保存", { exact: true })).toBeVisible();
  await page.clock.runFor(650);
  await page.getByRole("button", { name: "显示常驻提示" }).click();
  await page.clock.runFor(900);
  await expect(page.getByText("操作已保存", { exact: true })).toHaveCount(0);
  await expect(page.getByText("等待操作", { exact: true })).toBeVisible();
  // Motion uses browser animations; resume real time for the dismissal animation.
  await page.clock.resume();
  await page.getByRole("button", { name: "关闭提示：等待操作" }).click();
  await expect(page.getByText("等待操作", { exact: true })).toHaveCount(0);
});

test("account menu keyboard actions keep a single interactive link", async ({
  page,
}) => {
  const trigger = page.getByRole("button", { name: "账户菜单" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "我的收藏" })).toBeFocused();
  await expect(
    page.locator('[role="menuitem"] a, [role="menuitem"] button'),
  ).toHaveCount(0);
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "退出登录" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status", { name: "账户操作" })).toHaveText(
    "已退出登录",
  );
  await expect(trigger).toBeFocused();
});

test("profile sheet closes on a desktop resize and restores scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://127.0.0.1:4173?scenario=profile");
  await page.getByRole("button", { name: "收藏夹", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "收藏夹菜单" })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(() =>
      page.locator("body").evaluate((body) => getComputedStyle(body).overflow),
    )
    .not.toBe("hidden");
  await expect(page.getByRole("button", { name: "折叠侧栏" })).toBeVisible();
});

test("tag rename uses the shared input and handles submission", async ({
  page,
}) => {
  await page.getByRole("button", { name: "打开标签管理" }).click();
  await page.getByRole("button", { name: "重命名 风景" }).click();
  await page.getByRole("textbox", { name: "标签名称" }).fill("新风景");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByText("新风景", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("标签已更新");
});

test("responsive color palette, sliders and dismissal", async ({
  page,
}, testInfo) => {
  const trigger = page.getByRole("button", { name: "色盘", exact: true });
  await trigger.click();
  const palette = page.getByRole("dialog", { name: "色盘", exact: true });
  await expect(palette).toBeVisible();
  const expectedSlot =
    testInfo.project.name === "mobile" ? "sheet-content" : "popover-content";
  await expect(palette).toHaveAttribute("data-slot", expectedSlot);
  const box = await palette.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.getByRole("button", { name: "添加颜色" }).click();
  await page.getByRole("slider", { name: "精度", exact: true }).focus();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("slider", { name: "精度", exact: true }),
  ).toHaveAttribute("aria-valuenow", "100");
  await page.getByRole("textbox", { name: "HEX 色值" }).fill("#FFFFFF");
  await page.getByRole("textbox", { name: "HEX 色值" }).press("Enter");
  await page.keyboard.press("Escape");
  await expect(palette).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "色盘，已选 1 色" }),
  ).toBeFocused();
  await expect(page.getByRole("status", { name: "筛选颜色" })).toContainText(
    '"precision":100',
  );
  await page.getByRole("button", { name: "色盘，已选 1 色" }).click();
  await page.getByRole("button", { name: "清除颜色并关闭色盘" }).click();
  await expect(
    page.getByRole("button", { name: "色盘", exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("status", { name: "筛选颜色" })).toHaveText("[]");
});

test("share tabs support keyboard navigation and image export", async ({
  page,
}) => {
  await page.getByRole("button", { name: "打开分享" }).click();
  await expect(page.getByAltText("扫码查看 PV")).toBeVisible();
  await page.getByRole("tab", { name: "链接分享" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tabpanel", { name: "图片分享" })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载分享图" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
  await expect(page.getByAltText("光影收藏 分享图，可长按保存")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "打开分享" })).toBeFocused();
});

test("toasts pause on hover, resume and support persistent messages", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "显示短提示" }).click();
  const toast = page.getByRole("button", { name: "关闭提示：操作已保存" });
  await toast.hover({ force: true });
  await page.waitForTimeout(1000); // Longer than the configured duration; verifies pause.
  await expect(toast).toBeVisible();
  await page.mouse.move(0, page.viewportSize()!.height - 1);
  await expect(toast).toHaveCount(0);
  await page.getByRole("button", { name: "显示常驻提示" }).click();
  const persistent = page.getByRole("button", { name: "关闭提示：等待操作" });
  await expect(persistent).toBeVisible();
  await persistent.click();
  await expect(persistent).toHaveCount(0);
});

test("tooltip follows keyboard focus and player activation uses a single button", async ({
  page,
}) => {
  await page.getByRole("img", { name: "#ffffff" }).focus();
  await expect(page.getByRole("tooltip")).toContainText("#ffffff");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.getByRole("button", { name: "播放 光影收藏" }).click();
  await expect(page.locator("iframe")).toHaveCount(1);
});

test("detail prepares playback without autoplay and favorite reads cannot delay it", async ({ page }) => {
  // Generate a tiny local clip so the check does not depend on an external media host.
  const clip = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 90;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is unavailable");
    }
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    const completed = new Promise<void>((resolve) => {
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => resolve();
    });
    recorder.start();
    let frame = 0;
    const timer = setInterval(() => {
      context.fillStyle = frame++ % 2 === 0 ? "#000000" : "#ffffff";
      context.fillRect(0, 0, 160, 90);
    }, 100);
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    clearInterval(timer);
    recorder.stop();
    await completed;
    stream.getTracks().forEach((track) => track.stop());
    return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
  });

  await page.addInitScript(() => {
    const user = { id: "favorite-test-user", aud: "authenticated", email: "fixture@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-10-05T00:00:00Z" };
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const token = `${btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${btoa(JSON.stringify({ sub: user.id, exp: expiresAt, aud: "authenticated" }))}.fixture`;
    localStorage.setItem("xlwg:cached-user", JSON.stringify(user));
    const session = { user, access_token: token, refresh_token: "fixture", token_type: "bearer", expires_at: expiresAt, expires_in: 3600 };
    document.cookie = `sb-supabase-auth-token=${encodeURIComponent(JSON.stringify(session))}; path=/`;
  });
  await page.route("https://supabase.test/auth/v1/user", (route) => route.fulfill({ json: { id: "favorite-test-user", aud: "authenticated", app_metadata: {}, user_metadata: {} } }));
  let mediaRequests = 0;
  let viewRequests = 0;
  let releaseFavorites!: () => void;
  const favoritesReady = new Promise<void>((resolve) => { releaseFavorites = resolve; });
  await page.route("**/detail-test.webm", (route) => {
    mediaRequests += 1;
    return route.fulfill({ contentType: "video/webm", body: Buffer.from(clip) });
  });
  await page.route("**/api/videos/video-test/**", (route) => {
    if (route.request().url().endsWith("/view")) {
      viewRequests += 1;
      return route.fulfill({ json: { viewCount: 11, viewCountLabel: "11" } });
    }
    return route.fulfill({ json: { liked: false, likeCount: 2, likeCountLabel: "2" } });
  });
  await page.route("**/api/user/favorites/video-test", async (route) => {
    await favoritesReady;
    await route.fulfill({ json: favorites });
  });
  await page.goto("http://127.0.0.1:4173?scenario=detail-playback");
  const media = page.locator("video");
  const playButton = page.getByRole("button", { name: "播放 光影收藏" });
  const favoriteButton = page.getByRole("button", { name: "收藏", exact: true });
  try {
    await expect(media).toHaveAttribute("preload", "auto");
    await expect.poll(() => mediaRequests).toBeGreaterThan(0);
    await expect.poll(() => media.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(2);
    expect(await media.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
    expect(viewRequests).toBe(0);
    await expect(favoriteButton).toHaveAttribute("aria-busy", "true");
    await playButton.click();
    await expect(playButton).toHaveCount(0);
    await expect.poll(() => media.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0);
    await expect.poll(() => viewRequests).toBe(1);
    await expect(favoriteButton).toHaveAttribute("aria-busy", "true");
  } finally {
    releaseFavorites();
  }
  await expect(page.getByRole("button", { name: "已收藏", exact: true })).toBeVisible();
  expect(mediaRequests).toBe(1);
});

test("profile sidebar and opening login from the sheet", async ({
  page,
}, testInfo) => {
  await page.goto("http://127.0.0.1:4173?scenario=profile");
  if (testInfo.project.name === "desktop") {
    await page.getByRole("button", { name: "折叠侧栏" }).click();
    await expect(page.getByRole("button", { name: "展开侧栏" })).toBeVisible();
    await page.getByRole("button", { name: "展开侧栏" }).click();
    await expect(
      page.getByRole("button", { name: "全部收藏", exact: false }).first(),
    ).toBeVisible();
  } else {
    const trigger = page.getByRole("button", { name: "收藏夹", exact: true });
    await trigger.click();
    await expectFocusInside(page, "收藏夹菜单");
    await page
      .getByRole("dialog", { name: "收藏夹菜单" })
      .getByRole("button", { name: "投稿 PV" })
      .click();
    await expect(
      page.getByRole("dialog", { name: "登录" }),
    ).toBeVisible();
    await expectFocusInside(page, "登录");
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  }
});

test("compact collections search, selection and focus recovery", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("http://127.0.0.1:4173?scenario=profile-collections&keyword=品牌");
  await page.getByRole("button", { name: "折叠侧栏" }).click();
  const trigger = page.getByRole("button", { name: "切换收藏夹", exact: false });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("dialog", { name: "收藏夹", exact: true });
  const search = menu.getByRole("textbox", { name: "搜索收藏夹" });
  await expect(search).toBeFocused();
  await expect(menu.getByRole("button", { name: "条收藏", exact: false })).toHaveCount(20);
  await expect(menu.getByText("同名开头 PV 收藏夹", { exact: true })).toBeVisible();
  await expect(menu.getByText("同名开头音乐收藏夹", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("compact-collections.png") });
  await search.fill("不存在");
  await expect(menu.getByRole("status")).toContainText("未找到匹配的收藏夹");
  await menu.getByRole("button", { name: "清除搜索" }).click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("");
  await search.fill(" 音乐 ");
  await expect(menu.getByRole("button", { name: "条收藏", exact: false })).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(menu.getByRole("button", { name: "同名开头音乐收藏夹", exact: false })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("同名开头音乐收藏夹");
  await expect(page.getByRole("searchbox", { name: "搜索收藏的 PV" })).toHaveValue("品牌");
  await trigger.click();
  await expect(search).toHaveValue("");
  await expect(menu.getByRole("button", { name: "当前收藏夹", exact: false })).toHaveAttribute("aria-pressed", "true");
  await menu.getByRole("button", { name: "收藏夹20，0 条收藏" }).scrollIntoViewIfNeeded();
  await expect(menu.getByRole("button", { name: "收藏夹20，0 条收藏" })).toBeVisible();
  await search.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(menu.getByRole("button", { name: "关闭收藏夹列表" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await menu.getByRole("button", { name: "关闭收藏夹列表" }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(700, 700);
  await expect(menu).toHaveCount(0);
  await trigger.click();
  await page.setViewportSize({ width: 1024, height: 480 });
  await expect(menu).toBeVisible();
  const bounds = await menu.boundingBox();
  expect(bounds).not.toBeNull();
  if (bounds) {
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(1024);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(480);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(menu).toHaveCount(0);
  await page.getByRole("button", { name: "收藏夹", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "收藏夹菜单" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "收藏夹", exact: true })).toBeFocused();
});

test("favorite source icons retain brand fills in grid and list", async ({ page }) => {
  for (const view of ["grid", "list"]) {
    await page.goto(`http://127.0.0.1:4173?scenario=profile-collections&view=${view}`);
    const bilibili = page.locator("article").filter({ hasText: "Bilibili 品牌图标" }).locator('svg[fill="#00A1D6"]');
    const youtube = page.locator("article").filter({ hasText: "YouTube 品牌图标" }).locator('svg:has(path[fill="#FF0033"])');
    await expect(bilibili).toBeVisible();
    await expect(youtube).toBeVisible();
    expect(await bilibili.evaluate((element) => getComputedStyle(element).filter)).toBe("none");
    expect(await youtube.evaluate((element) => getComputedStyle(element).filter)).toBe("none");
    await expect(youtube.locator('path[fill="#FFFFFF"]')).toHaveCount(1);
  }
});

test("dialogs and color palette meet WCAG accessibility checks", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const name of [
    "打开登录",
    "打开备注",
    "打开收藏",
    "打开投稿",
    "打开分享",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    if (name === "打开收藏") {
      await expect(page.getByRole("checkbox")).toHaveCount(2);
    }
    if (name === "打开分享") {
      await expect(page.getByAltText("扫码查看 PV")).toBeVisible();
    }
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    await page.keyboard.press("Escape");
  }
  await page.getByRole("button", { name: "色盘", exact: true }).click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
