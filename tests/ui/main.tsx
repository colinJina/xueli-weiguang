import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  PathnameContext,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { ArchiveColorPalette } from "@/components/archive/archive-color-palette";
import { ArchiveSubmitDialog } from "@/components/archive/archive-submit-dialog";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { UserMenu } from "@/components/auth/user-menu";
import { ArchiveItemMenu } from "@/components/user/archive-item-menu";
import { FavoriteEditorDialog } from "@/components/user/favorite-editor-dialog";
import { FavoriteSelectionDialog } from "@/components/user/favorite-selection-dialog";
import { UserTagManagerDialog } from "@/components/user/user-tag-manager-dialog";
import { UserProfileShell } from "@/components/user/user-profile-shell";
import { VideoShareDialog } from "@/components/video/video-share-dialog";
import { VideoToneSwatches } from "@/components/video/video-tone-swatches";
import { DeferredVideoPlayer } from "@/components/video/deferred-video-player";
import { Button } from "@/components/ui/button";
import { DialogShell } from "@/components/ui/dialog-shell";
import { TextField } from "@/components/ui/text-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  PageTopMessageProvider,
  usePageTopMessage,
} from "@/components/ui/page-top-message-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  favorites,
  getCollectionProfile,
  filters as initialFilters,
  profile,
  video,
} from "./fixtures";
import "@/app/globals.css";

type Panel =
  | "auth"
  | "submit"
  | "editor"
  | "favorites"
  | "share"
  | "nested"
  | "tags"
  | null;
const summary = {
  id: video.id,
  title: video.title,
  coverUrl: null,
  sourceLabel: video.sourceLabel,
  storageProvider: video.storageProvider,
};

function Fixture() {
  const [panel, setPanel] = useState<Panel>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [child, setChild] = useState(false);
  const [guard, setGuard] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [searchParams, setSearchParams] = useState(
    new URLSearchParams(window.location.search),
  );
  const [loggedOut, setLoggedOut] = useState(false);
  const { showMessage } = usePageTopMessage();
  const close = () => setPanel(null);
  const router = {
    back: () => {},
    forward: () => {},
    refresh: () => {},
    hmrRefresh: () => {},
    push: (href: string) =>
      setSearchParams(new URL(href, window.location.href).searchParams),
    replace: (href: string) =>
      setSearchParams(new URL(href, window.location.href).searchParams),
    prefetch: () => {},
  };

  return (
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value="/user">
        <SearchParamsContext.Provider value={searchParams}>
          {searchParams.get("scenario") === "profile-collections" ? (
            <UserProfileShell data={getCollectionProfile(searchParams)} />
          ) : searchParams.get("scenario") === "profile" ? (
            <UserProfileShell data={profile} />
          ) : (
            <main className="mx-auto max-w-3xl space-y-6 px-5 py-8">
              <h1 className="text-2xl font-bold">组件回归测试</h1>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setPanel("auth")}>打开登录</Button>
                <Button onClick={() => setPanel("submit")}>打开投稿</Button>
                <Button onClick={() => setPanel("editor")}>打开备注</Button>
                <Button onClick={() => setPanel("favorites")}>打开收藏</Button>
                <Button onClick={() => setPanel("share")}>打开分享</Button>
                <Button onClick={() => setPanel("nested")}>打开嵌套弹窗</Button>
                <Button onClick={() => setPanel("tags")}>打开标签管理</Button>
                <Button
                  onClick={() =>
                    showMessage({
                      text: "操作已保存",
                      durationMs: 800,
                      icon: (
                        <svg
                          aria-hidden="true"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                        >
                          <path fill="currentColor" d="M1 8h14v1H1z" />
                        </svg>
                      ),
                    })
                  }
                >
                  显示短提示
                </Button>
                <Button
                  onClick={() =>
                    showMessage({ text: "等待操作", durationMs: null })
                  }
                >
                  显示常驻提示
                </Button>
                <ArchiveItemMenu
                  onAdjust={() => setPanel("favorites")}
                  onEdit={() => setPanel("editor")}
                  readOnly={false}
                />
                <UserMenu
                  user={{
                    id: "user-test",
                    email: "reader@example.test",
                    app_metadata: {},
                    user_metadata: {},
                    aud: "authenticated",
                    created_at: "2026-10-04",
                  }}
                  onLogout={() => setLoggedOut(true)}
                />
                <ArchiveColorPalette
                  filters={filters}
                  onChange={(patch) =>
                    setFilters((current) => ({ ...current, ...patch }))
                  }
                />
              </div>
              <output aria-label="筛选颜色">
                {JSON.stringify(filters.colors)}
              </output>
              <output aria-label="账户操作">
                {loggedOut ? "已登出" : "已登录"}
              </output>
              <VideoToneSwatches tones={video.tones} />
              <DeferredVideoPlayer video={video} />
              {panel === "auth" ? (
                <AuthDialog
                  mode={authMode}
                  onSwitchMode={setAuthMode}
                  onClose={close}
                  open
                />
              ) : null}
              <ArchiveSubmitDialog
                allowNativeUpload
                onClose={close}
                open={panel === "submit"}
              />
              <FavoriteEditorDialog
                memberships={favorites.memberships}
                onChanged={() => {}}
                onClose={close}
                open={panel === "editor"}
                tags={favorites.tags}
                video={summary}
              />
              <FavoriteSelectionDialog
                onClose={close}
                onSaved={() => {}}
                open={panel === "favorites"}
                video={summary}
              />
              <UserTagManagerDialog
                onChanged={() => {}}
                onClose={close}
                open={panel === "tags"}
                tags={favorites.tags}
              />
              {panel === "share" ? (
                <VideoShareDialog onClose={close} video={video} />
              ) : null}
              {panel === "nested" ? (
                <DialogShell
                  title="父弹窗"
                  description="验证嵌套和关闭守卫"
                  closeLabel="关闭父弹窗"
                  onClose={() => {
                    if (!guard) {
                      close();
                    }
                  }}
                >
                  <div className="mt-5 space-y-4">
                    <TextField label="父级输入" />
                    <Label className="flex gap-2">
                      <Checkbox
                        checked={guard}
                        onCheckedChange={(next) => setGuard(next === true)}
                      />
                      禁止关闭
                    </Label>
                    <Button onClick={() => setChild(true)}>打开子弹窗</Button>
                  </div>
                  {child ? (
                    <DialogShell
                      title="子弹窗"
                      description="仅关闭最上层"
                      closeLabel="关闭子弹窗"
                      onClose={() => setChild(false)}
                    >
                      <TextField label="子级输入" />
                    </DialogShell>
                  ) : null}
                </DialogShell>
              ) : null}
            </main>
          )}
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  );
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing test root");
}
createRoot(root).render(
  <TooltipProvider delayDuration={100}>
    <PageTopMessageProvider>
      <Fixture />
    </PageTopMessageProvider>
  </TooltipProvider>,
);
