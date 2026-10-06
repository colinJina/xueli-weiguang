"use client";

import { useEffect, useId, useRef, useState } from "react";

import CloseIcon from "@/components/icons/shared/close-16.svg";
import FolderActiveIcon from "@/components/icons/user/folder-active.svg";
import FolderIcon from "@/components/icons/user/folder.svg";
import SearchIcon from "@/components/icons/shared/search.svg";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TextField } from "@/components/ui/text-field";
import { useMediaQuery } from "@/hooks/use-media-query";
import type {
  UserArchiveActiveCollection,
  UserArchiveCollectionSummary,
} from "@/lib/user-archive/types";

export function CompactCollectionMenu({
  activeCollection,
  collections,
  onCollectionSelect,
}: {
  activeCollection: UserArchiveActiveCollection;
  collections: UserArchiveCollectionSummary[];
  onCollectionSelect: (collectionId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleCollections = collections.filter((collection) =>
    collection.name.toLocaleLowerCase().includes(normalizedQuery),
  );
  const TriggerIcon = activeCollection.isAll ? FolderIcon : FolderActiveIcon;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    setQuery("");
  }

  useEffect(() => {
    if (!desktop) {
      setOpen(false);
      setQuery("");
    }
  }, [desktop]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          aria-label={`切换收藏夹，${collections.length} 个收藏夹，当前${activeCollection.name}`}
          aria-pressed={!activeCollection.isAll}
          className="w-full flex-col gap-1 px-1 py-2 text-[11px]"
          size="md"
          type="button"
          variant="sidebar"
        >
          <TriggerIcon aria-hidden="true" className="h-5 w-5" />
          <span>收藏夹</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-labelledby={titleId}
        className="flex max-h-[var(--radix-popover-content-available-height)] w-[280px] flex-col gap-4 overflow-hidden p-4"
        collisionPadding={16}
        side="right"
        sideOffset={16}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          searchRef.current?.focus();
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold" id={titleId}>
            收藏夹
            <span
              aria-hidden="true"
              className="ml-2 text-xs font-normal text-muted-foreground"
            >
              {collections.length}
            </span>
          </h2>
          <PopoverClose asChild>
            <IconButton aria-label="关闭收藏夹列表" size="sm" variant="ghost">
              <CloseIcon aria-hidden="true" />
            </IconButton>
          </PopoverClose>
        </div>
        <TextField
          label="搜索收藏夹"
          placeholder="输入收藏夹名称"
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <nav
          aria-label="收藏夹列表"
          className="min-h-0 max-h-[360px] overflow-y-auto"
        >
          <div className="space-y-1">
            {visibleCollections.map((collection) => {
              const active = collection.id === activeCollection.id;
              const ItemIcon = active ? FolderActiveIcon : FolderIcon;

              return (
                <Button
                  aria-label={`${collection.name}，${collection.itemCount} 条收藏${active ? "，当前收藏夹" : ""}`}
                  aria-pressed={active}
                  className="w-full gap-2 px-3 py-2 text-left"
                  key={collection.id}
                  size="md"
                  type="button"
                  variant="sidebar"
                  onClick={() => {
                    onCollectionSelect(collection.id);
                    handleOpenChange(false);
                  }}
                >
                  <ItemIcon aria-hidden="true" className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 flex-1 break-words">
                    {collection.name}
                  </span>
                  {active ? (
                    <span className="shrink-0 text-[11px]">当前</span>
                  ) : null}
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {collection.itemCount}
                  </span>
                </Button>
              );
            })}
          </div>
          {visibleCollections.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-5 text-center text-sm text-muted-foreground"
              role="status"
            >
              {collections.length === 0 ? (
                <FolderIcon aria-hidden="true" className="h-6 w-6" />
              ) : (
                <SearchIcon aria-hidden="true" className="h-6 w-6" />
              )}
              <p>
                {collections.length === 0
                  ? "还没有收藏夹"
                  : "未找到匹配的收藏夹"}
              </p>
              {collections.length > 0 ? (
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                >
                  清除搜索
                </Button>
              ) : null}
            </div>
          ) : null}
        </nav>
      </PopoverContent>
    </Popover>
  );
}
