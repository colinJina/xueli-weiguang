"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ArchiveSubmitDialog } from "@/components/archive/archive-submit-dialog";
import { AuthDialog } from "@/components/auth/auth-dialog";
import {
  FavoriteEditorDialog,
  type FavoriteEditorVideo,
} from "@/components/user/favorite-editor-dialog";
import { UserTagManagerDialog } from "@/components/user/user-tag-manager-dialog";
import { Button } from "@/components/ui/button";
import { chipVariants } from "@/components/ui/chip";
import { FormMessage } from "@/components/ui/form-message";
import { IconButton } from "@/components/ui/icon-button";
import { VideoSourceIcon } from "@/components/ui/video-source-icon";
import { useAuth } from "@/lib/auth/use-auth";
import { requestUserArchiveMutation } from "@/lib/user-archive/client-api";
import type {
  UserArchiveItem,
  UserArchivePageData,
  UserArchiveVideoMembership,
  UserArchiveView,
} from "@/lib/user-archive/types";
import { cn } from "@/lib/utils";
import { ArchiveSubmitTrigger } from "../archive/archive-submit-trigger";

type UserProfileShellProps = {
  data: UserArchivePageData;
};

type EditingTarget = {
  initialCollectionId: string;
  memberships: UserArchiveVideoMembership[];
  video: FavoriteEditorVideo;
} | null;

type MutationResult = {
  id: string;
};

function GridIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <path
        d="M4 4h5v5H4V4Zm7 0h5v5h-5V4ZM4 11h5v5H4v-5Zm7 0h5v5h-5v-5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <path
        d="M4 5.5h12M4 10h12M4 14.5h12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <path
        d="M10 4.5v11M4.5 10h11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <circle
        cx="8.5"
        cy="8.5"
        r="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m12 12 4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function FolderIcon({ active = false }: { active?: boolean }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <path
        d="M3.5 6.5c0-.95.65-1.6 1.6-1.6h3l1.3 1.35H15c.95 0 1.6.65 1.6 1.6v5.85c0 .95-.65 1.6-1.6 1.6H5.1c-.95 0-1.6-.65-1.6-1.6V6.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
      {active ? (
        <path
          d="M7.2 10.2h5.6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.45"
        />
      ) : null}
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M2 8s2-3.5 6-3.5S14 8 14 8s-2 3.5-6 3.5S2 8 2 8Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M8 12.8S3.2 10 3.2 6.6c0-1.4 1-2.4 2.3-2.4.9 0 1.6.45 2 1.1.4-.65 1.1-1.1 2-1.1 1.3 0 2.3 1 2.3 2.4C11.8 10 8 12.8 8 12.8Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path
        d="m4.2 11.8 1.8-.35 5.9-5.9-1.45-1.45-5.9 5.9-.35 1.8Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
      <path
        d="M9.8 4.8 11.2 6.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-12 w-12 text-subtle"
      fill="none"
      viewBox="0 0 48 48"
    >
      <rect
        height="24"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.5"
        width="32"
        x="8"
        y="12"
      />
      <path
        d="M15 20h18M15 26h10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 flex-none"
      fill="none"
      viewBox="0 0 16 16"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 4.5v4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="11.2" r="0.7" fill="currentColor" />
    </svg>
  );
}

function createMembershipsForVideo(
  items: readonly UserArchiveItem[],
  videoId: string,
) {
  return items
    .filter((item) => item.videoId === videoId)
    .map((item) => ({
      collectionItemId: item.id,
      collectionId: item.collectionId,
      collectionName: item.collectionName,
      note: item.note,
      tagIds: item.tags.map((tag) => tag.id),
      sortOrder: item.sortOrder,
      createdAt: item.createdAt,
    }));
}

function createVideoSummary(item: UserArchiveItem): FavoriteEditorVideo {
  return {
    id: item.videoId,
    title: item.title,
    coverUrl: item.coverUrl,
    sourceLabel: item.sourceLabel,
    storageProvider: item.storageProvider,
  };
}

function writeTagIdsParam(params: URLSearchParams, tagIds: readonly string[]) {
  if (tagIds.length > 0) {
    params.set("tagIds", tagIds.join(","));
    return;
  }

  params.delete("tagIds");
}

function writeTagQueryParam(params: URLSearchParams, tagQuery: string) {
  const normalizedQuery = tagQuery.trim();

  if (normalizedQuery) {
    params.set("tagQuery", normalizedQuery);
    return;
  }

  params.delete("tagQuery");
}

export function UserProfileShell({ data }: UserProfileShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const {
    user,
    isReady,
    isAuthenticated,
    isAdmin,
    dialogMode,
    openLogin,
    openRegister,
    closeDialog,
    switchMode,
  } = useAuth();
  const [draftTagQuery, setDraftTagQuery] = useState(data.filters.tagQuery);
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [continueToSubmit, setContinueToSubmit] = useState(false);
  const canSubmit = data.isAuthenticated || (isReady && isAuthenticated);
  const allowNativeUpload = data.isAdmin || isAdmin;

  useEffect(() => {
    setDraftTagQuery(data.filters.tagQuery);
  }, [data.filters.tagQuery]);

  const replaceParams = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutator(params);
      const query = params.toString();

      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  function setCollectionFilter(collectionId: string | null) {
    replaceParams((params) => {
      if (collectionId) {
        params.set("collectionId", collectionId);
      } else {
        params.delete("collectionId");
      }
      params.delete("tagIds");
      params.delete("tagQuery");
    });
    setDraftTagQuery("");
  }

  function setTagIds(tagIds: string[]) {
    replaceParams((params) => {
      writeTagIdsParam(params, tagIds);
    });
  }

  function toggleTag(tagId: string) {
    const nextTagIds = data.filters.tagIds.includes(tagId)
      ? data.filters.tagIds.filter((id) => id !== tagId)
      : [...data.filters.tagIds, tagId];

    setTagIds(nextTagIds);
  }

  function setView(view: UserArchiveView) {
    replaceParams((params) => {
      if (view === "list") {
        params.set("view", "list");
      } else {
        params.delete("view");
      }
    });
  }

  function clearFilters() {
    replaceParams((params) => {
      params.delete("collectionId");
      params.delete("tagIds");
      params.delete("tagQuery");
    });
    setDraftTagQuery("");
  }

  function submitTagSearch() {
    const query = draftTagQuery.trim().toLocaleLowerCase();

    if (!query) {
      replaceParams((params) => {
        params.delete("tagQuery");
      });
      return;
    }

    const exactMatch = data.tagLibrary.find(
      (tag) => tag.name.toLocaleLowerCase() === query,
    );
    const looseMatch =
      exactMatch ??
      data.tagLibrary.find((tag) =>
        tag.name.toLocaleLowerCase().includes(query),
      );

    if (!looseMatch) {
      replaceParams((params) => {
        writeTagQueryParam(params, draftTagQuery);
      });
      return;
    }

    setDraftTagQuery("");
    replaceParams((params) => {
      const nextTagIds = data.filters.tagIds.includes(looseMatch.id)
        ? data.filters.tagIds
        : [...data.filters.tagIds, looseMatch.id];

      writeTagIdsParam(params, nextTagIds);
      params.delete("tagQuery");
    });
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    submitTagSearch();
  }

  function openEditor(item: UserArchiveItem) {
    setEditingTarget({
      initialCollectionId: item.collectionId,
      memberships: createMembershipsForVideo(data.allItems, item.videoId),
      video: createVideoSummary(item),
    });
  }

  function refreshAfterMutation() {
    router.refresh();
  }

  function handleUploadClick() {
    if (canSubmit) {
      setSubmitDialogOpen(true);
      return;
    }

    setContinueToSubmit(true);
    openLogin();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[300px] flex-col border-r border-border bg-panel px-4 py-7 lg:flex">
        <SidebarContent
          data={data}
          onCollectionSelect={setCollectionFilter}
          onUploadClick={handleUploadClick}
          onUserCollectionCreated={refreshAfterMutation}
        />
      </aside>

      <div className="min-h-screen lg:pl-[300px]">
        <main className="px-5 pb-16 pt-8 sm:px-8 lg:px-10 lg:pt-10">
          <FilterRow
            data={data}
            draftTagQuery={draftTagQuery}
            isPending={isPending}
            onClear={clearFilters}
            onLoginClick={openLogin}
            onManageTags={() => setTagManagerOpen(true)}
            onRegisterClick={openRegister}
            onSearchChange={setDraftTagQuery}
            onSearchKeyDown={handleSearchKeyDown}
            onSearchSubmit={submitTagSearch}
            onTagToggle={toggleTag}
            onViewChange={setView}
          />
          <CardGrid data={data} onEditItem={openEditor} />
        </main>
      </div>

      {editingTarget ? (
        <FavoriteEditorDialog
          collections={data.collections}
          initialCollectionId={editingTarget.initialCollectionId}
          memberships={editingTarget.memberships}
          onChanged={refreshAfterMutation}
          onClose={() => setEditingTarget(null)}
          open
          tags={data.tagLibrary}
          video={editingTarget.video}
        />
      ) : null}

      <UserTagManagerDialog
        onChanged={refreshAfterMutation}
        onClose={() => setTagManagerOpen(false)}
        open={tagManagerOpen}
        tags={data.tagLibrary}
      />

      {dialogMode ? (
        <AuthDialog
          mode={dialogMode}
          onClose={() => {
            setContinueToSubmit(false);
            closeDialog();
          }}
          onSuccess={() => {
            closeDialog();
            router.refresh();
            if (continueToSubmit) {
              setContinueToSubmit(false);
              setSubmitDialogOpen(true);
            }
          }}
          onSwitchMode={switchMode}
          open
        />
      ) : null}

      <ArchiveSubmitDialog
        onClose={() => setSubmitDialogOpen(false)}
        allowNativeUpload={allowNativeUpload}
        open={submitDialogOpen && (canSubmit || Boolean(user))}
      />
    </div>
  );
}

function SidebarContent({
  data,
  onCollectionSelect,
  onUploadClick,
  onUserCollectionCreated,
}: {
  data: UserArchivePageData;
  onCollectionSelect: (collectionId: string | null) => void;
  onUploadClick: () => void;
  onUserCollectionCreated: () => void;
}) {
  return (
    <>
      <ProfileSummary data={data} />
      <ArchiveSubmitTrigger
        isAuthenticated={data.isAuthenticated}
        onRequestLogin={onUploadClick}
        onRequestSubmit={onUploadClick}
      />
      <nav className="mt-10 space-y-7">
        <button
          aria-pressed={data.activeCollection.isAll}
          className={cn(
            "flex w-full items-center gap-4 rounded-lg border px-5 py-3 text-left text-base font-medium",
            data.activeCollection.isAll
              ? "border-white/10 bg-white/[0.07] text-foreground"
              : "border-transparent text-muted hover:bg-white/[0.035] hover:text-foreground",
          )}
          onClick={() => onCollectionSelect(null)}
          type="button"
        >
          <GridIcon />
          <span className="min-w-0 flex-1 truncate">全部视频</span>
          <span className="text-xs text-subtle">{data.allItemCount}</span>
        </button>

        <div>
          <p className="px-3 font-sans text-xs uppercase tracking-[0.18em] text-subtle">
            收藏夹
          </p>
          <div className="mt-4 space-y-2">
            {data.collections.map((collection) => (
              <button
                aria-pressed={collection.active}
                className={cn(
                  "flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left text-base font-semibold transition",
                  collection.active
                    ? "border-white/10 bg-white/[0.07] text-foreground"
                    : "border-transparent text-muted hover:bg-white/[0.035] hover:text-foreground",
                )}
                key={collection.id}
                onClick={() => onCollectionSelect(collection.id)}
                type="button"
              >
                <FolderIcon active={collection.active} />
                <span className="min-w-0 flex-1 truncate">
                  {collection.name}
                </span>
                <span className="text-xs text-subtle">
                  {collection.itemCount}
                </span>
              </button>
            ))}

            {data.collections.length === 0 ? (
              <p className="px-3 py-3 text-sm leading-6 text-muted">
                还没有收藏夹。
              </p>
            ) : null}
          </div>
        </div>

        {data.isAuthenticated ? (
          <CreateCollectionForm onCreated={onUserCollectionCreated} />
        ) : null}
      </nav>
    </>
  );
}

function ProfileSummary({ data }: { data: UserArchivePageData }) {
  const profile = data.profile;

  return (
    <div className="flex items-center gap-4 px-3 mb-4">
      {profile?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="h-11 w-11 rounded-full border border-white/10 object-cover"
          referrerPolicy="no-referrer"
          src={profile.avatarUrl}
        />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-foreground text-base font-black text-background">
          {profile?.initial ?? "U"}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-base font-bold text-foreground">
          {profile?.displayName ?? "未登录档案"}
        </p>
        <p className="mt-1 truncate text-sm text-subtle">
          {profile?.headline ?? "登录后管理收藏夹与标签"}
        </p>
      </div>
    </div>
  );
}

function CreateCollectionForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessage("请输入收藏夹名称。");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await requestUserArchiveMutation<MutationResult>(
        "/api/user/collections",
        {
          method: "POST",
          body: JSON.stringify({ name: trimmedName }),
        },
        "收藏夹创建失败，请稍后重试。",
      );
      setName("");
      onCreated();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "收藏夹创建失败，请稍后重试。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-3 rounded-lg border border-white/8 bg-white/[0.025] p-3"
      onSubmit={handleSubmit}
    >
      <label className="block space-y-2">
        <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-subtle">
          新建收藏夹
        </span>
        <input
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition placeholder:text-subtle focus:border-borderStrong"
          disabled={submitting}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          placeholder="收藏夹名称"
          value={name}
        />
      </label>
      {message ? (
        <FormMessage icon={<AlertIcon />} variant="error">
          {message}
        </FormMessage>
      ) : null}
      <Button
        className="w-full gap-2"
        disabled={submitting}
        size="sm"
        type="submit"
        variant="secondary"
      >
        <PlusIcon />
        新建收藏夹
      </Button>
    </form>
  );
}

function TopBar({
  className,
  data,
  isPending,
  onLoginClick,
  onRegisterClick,
  onViewChange,
}: {
  className?: string;
  data: UserArchivePageData;
  isPending: boolean;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onViewChange: (view: UserArchiveView) => void;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 lg:hidden">
        <ProfileSummary data={data} />
      </div>

      <div className="flex items-center justify-between gap-3 sm:ml-auto">
        {!data.isAuthenticated ? (
          <div className="hidden items-center gap-2 sm:flex">
            <Button
              onClick={onLoginClick}
              size="sm"
              type="button"
              variant="secondary"
            >
              登录
            </Button>
            <Button onClick={onRegisterClick} size="sm" type="button">
              注册
            </Button>
          </div>
        ) : null}

        <div
          className={cn(
            "flex rounded-lg border border-border bg-panel p-1",
            isPending && "opacity-60",
          )}
        >
          <IconButton
            aria-label="网格视图"
            className={cn(
              "rounded-md",
              data.filters.view === "grid" && "bg-white/[0.08] text-foreground",
            )}
            onClick={() => onViewChange("grid")}
            size="sm"
            variant="ghost"
          >
            <GridIcon />
          </IconButton>
          <IconButton
            aria-label="列表视图"
            className={cn(
              "rounded-md",
              data.filters.view === "list" && "bg-white/[0.08] text-foreground",
            )}
            onClick={() => onViewChange("list")}
            size="sm"
            variant="ghost"
          >
            <ListIcon />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function FilterRow({
  data,
  draftTagQuery,
  isPending,
  onClear,
  onLoginClick,
  onManageTags,
  onRegisterClick,
  onSearchChange,
  onSearchKeyDown,
  onSearchSubmit,
  onTagToggle,
  onViewChange,
}: {
  data: UserArchivePageData;
  draftTagQuery: string;
  isPending: boolean;
  onClear: () => void;
  onLoginClick: () => void;
  onManageTags: () => void;
  onRegisterClick: () => void;
  onSearchChange: (value: string) => void;
  onSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onSearchSubmit: () => void;
  onTagToggle: (tagId: string) => void;
  onViewChange: (view: UserArchiveView) => void;
}) {
  const hasFilters =
    data.filters.collectionId !== null ||
    data.filters.tagIds.length > 0 ||
    data.filters.tagQuery.length > 0;

  return (
    <section className={cn("mb-7 space-y-4", isPending && "opacity-70")}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="order-2 flex flex-wrap items-center gap-3 lg:order-1">
          <button
            className="flex items-center gap-2 text-sm text-subtle transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-80"
            disabled={!hasFilters}
            onClick={onClear}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 16 16"
            >
              <path
                d="M3 4h10l-4 4v3l-2 1V8L3 4Z"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.3"
              />
              <path
                d="m3 13 10-10"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.3"
              />
            </svg>
            <span>清空筛选</span>
          </button>

          {data.isAuthenticated ? (
            <Button
              className="gap-2"
              onClick={onManageTags}
              size="sm"
              type="button"
              variant="secondary"
            >
              <EditIcon />
              管理标签
            </Button>
          ) : null}
        </div>

        <TopBar
          className="order-1 lg:order-2 lg:ml-auto lg:w-auto"
          data={data}
          isPending={isPending}
          onLoginClick={onLoginClick}
          onRegisterClick={onRegisterClick}
          onViewChange={onViewChange}
        />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="relative block w-full min-w-[240px] max-w-[350px] sm:w-[350px]">
          <input
            className="h-12 w-full rounded-full border border-border bg-white/[0.1] px-5 pr-14 text-base font-semibold text-foreground outline-none transition placeholder:text-muted focus:border-borderStrong focus:bg-white/[0.13]"
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={onSearchKeyDown}
            type="search"
            value={draftTagQuery}
          />
          <IconButton
            aria-label="提交标签搜索"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-subtle hover:text-foreground"
            onClick={onSearchSubmit}
            size="sm"
            variant="ghost"
          >
            <SearchIcon />
          </IconButton>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {data.tags.map((tag) => (
            <button
              className={chipVariants({
                size: "sm",
                variant: tag.active ? "selected" : "default",
              })}
              key={tag.id}
              onClick={() => onTagToggle(tag.id)}
              type="button"
            >
              <span>{tag.name}</span>
              <span className="font-sans text-[0.68rem] opacity-70">
                {tag.itemCount}
              </span>
            </button>
          ))}

          {data.tags.length === 0 ? (
            <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-subtle">
              当前收藏夹暂无可筛选标签
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CardGrid({
  data,
  onEditItem,
}: {
  data: UserArchivePageData;
  onEditItem: (item: UserArchiveItem) => void;
}) {
  if (!data.isAuthenticated) {
    return <GuestEmptyState />;
  }

  if (data.items.length === 0) {
    return <ArchiveEmptyState />;
  }

  return (
    <section
      className={cn(
        data.filters.view === "list"
          ? "grid grid-cols-1 gap-4"
          : "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4",
      )}
    >
      {data.items.map((item) => (
        <ArchiveCard
          item={item}
          key={item.id}
          onEdit={() => onEditItem(item)}
          view={data.filters.view}
        />
      ))}
    </section>
  );
}

function ArchiveCard({
  item,
  onEdit,
  view,
}: {
  item: UserArchiveItem;
  onEdit: () => void;
  view: UserArchiveView;
}) {
  const listView = view === "list";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-xl border border-white/[0.07] bg-panel transition duration-200 hover:-translate-y-0.5 hover:border-white/14",
        listView
          ? "grid grid-cols-[112px,1fr] sm:grid-cols-[180px,1fr]"
          : "flex min-h-[352px] flex-col",
      )}
    >
      <Link
        className={cn(
          "relative block overflow-hidden bg-surface",
          listView ? "h-full min-h-[144px]" : "aspect-video",
        )}
        style={{
          WebkitBackfaceVisibility: "hidden",
          WebkitTransform: "translate3d(0, 0, 0)",
        }}
        href={item.href}
      >
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
            loading="lazy"
            referrerPolicy="no-referrer"
            src={item.coverUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface">
            <ArchiveIcon />
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex min-w-0 items-end justify-end sm:bottom-3 sm:right-3">
          <span className="inline-flex h-[26px] max-w-full items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-2.5 text-[0.7rem] font-medium tracking-[0.04em] text-white backdrop-blur-sm sm:h-[30px] sm:px-3 sm:text-[0.72rem]">
            <VideoSourceIcon
              className="h-[14px] w-[14px] sm:h-[16px] sm:w-[16px]"
              platform={item.storageProvider}
            />
            <span className="min-w-0 truncate">{item.sourceLabel}</span>
          </span>
        </div>
        {/* --------------------------------------------- */}
      </Link>

      <div
        className={cn("flex flex-1 flex-col", listView ? "p-4 sm:p-5" : "p-5")}
      >
        <div className="flex items-start justify-between gap-3">
          <Link className="min-w-0 flex-1" href={item.href}>
            <h2
              className={cn(
                "line-clamp-2 font-bold leading-snug tracking-[-0.03em] text-foreground",
                listView ? "text-lg" : "min-h-[3.35rem] text-xl",
              )}
            >
              {item.title}
            </h2>
          </Link>

          <IconButton
            aria-label="编辑收藏记录"
            onClick={onEdit}
            size="sm"
            variant="surface"
          >
            <EditIcon />
          </IconButton>
        </div>

        {item.note ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
            {item.note}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6 text-sm text-muted">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <EyeIcon />
              {item.viewCountLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <HeartIcon />
              {item.likeCountLabel}
            </span>
          </div>

          <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-subtle">
            <FolderIcon />
            <span className="max-w-[120px] truncate">
              {item.collectionName}
            </span>
          </span>

          {/* 注：这里移除了原本在底部的 sourceLabel 渲染 */}
        </div>
      </div>
    </article>
  );
}

function GuestEmptyState() {
  return (
    <section className="flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-panel px-6 py-10 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-surface">
          <ArchiveIcon />
        </div>
        <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">
          登录后打开你的档案
        </h2>
        <p className="text-sm leading-6 text-muted">
          收藏夹、私有标签和收藏记录只对当前账号可见。
        </p>
      </div>
    </section>
  );
}

function ArchiveEmptyState() {
  return (
    <section className="flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-panel px-6 py-10 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-surface">
          <ArchiveIcon />
        </div>
        <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">
          当前范围暂无收藏
        </h2>
        <p className="text-sm leading-6 text-muted">
          可以从视频详情页收藏公开视频，或清空当前标签筛选。
        </p>
      </div>
    </section>
  );
}
