"use client";

import { useEffect, useRef, useState } from "react";
import SearchIcon from "@/components/icons/shared/search.svg";
import AlertIcon from "@/components/icons/shared/alert-circle.svg";
import CloseIcon from "@/components/icons/shared/close-16.svg";
import { TextField } from "@/components/ui/text-field";
import { IconButton } from "@/components/ui/icon-button";
import { FormMessage } from "@/components/ui/form-message";
import { ARCHIVE_SEARCH_INTERVAL_MS, ARCHIVE_SEARCH_MAX_URL_LENGTH, parseArchiveSearch } from "@/lib/videos/archive-search";
import type { ArchiveChangeOptions } from "@/components/archive/use-archive-videos";

type Props = {
  query: string;
  onSearch: (query: string, options: ArchiveChangeOptions) => void;
  onEditing: (pending: boolean) => void;
};

export function ArchiveSearchField({ query, onSearch, onEditing }: Props) {
  const [draft, setDraft] = useState(query);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const composing = useRef(false);
  const submitted = useRef(query);
  const input = useRef<HTMLInputElement>(null);
  const search = parseArchiveSearch(draft);

  function cancelTimer() {
    clearTimeout(timer.current);
    timer.current = undefined;
  }
  useEffect(() => {
    // A normalization/response for our own submission must not erase newer typing.
    if (query !== submitted.current) {
      clearTimeout(timer.current);
      submitted.current = query;
      setDraft(query);
    }
  }, [query]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function submit(value: string, replace: boolean) {
    cancelTimer();
    const next = parseArchiveSearch(value);
    if (!next.error) {
      submitted.current = next.query;
      onSearch(next.query, { replace, immediate: true });
    }
  }
  function edit(value: string) {
    setDraft(value);
    cancelTimer();
    const next = parseArchiveSearch(value);
    onEditing(!next.error);
    if (!composing.current && !next.error) {
      if (!next.query) {
        submit(value, true);
      } else {
        timer.current = setTimeout(() => submit(value, true), ARCHIVE_SEARCH_INTERVAL_MS);
      }
    }
  }

  return (
    <form className="space-y-2" role="search" aria-label="搜索 PV" onSubmit={(event) => {
      event.preventDefault();
      if (!composing.current) {
        submit(draft, false);
      }
    }}>
      <div className="relative">
        <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <TextField
          label="搜索 PV"
          labelClassName="sr-only"
          className="pl-10 pr-12 [&::-webkit-search-cancel-button]:appearance-none"
          type="search"
          ref={input}
          value={draft}
          maxLength={ARCHIVE_SEARCH_MAX_URL_LENGTH}
          placeholder="标题、作者、标签或 PV 链接"
          aria-invalid={Boolean(search.error)}
          aria-describedby={search.error ? "archive-search-error" : "archive-search-help"}
          onChange={(event) => edit(event.target.value)}
          onCompositionStart={() => { composing.current = true; cancelTimer(); onEditing(true); }}
          onCompositionEnd={(event) => { composing.current = false; edit(event.currentTarget.value); }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (composing.current || event.nativeEvent.isComposing || event.keyCode === 229)) {
              event.preventDefault();
            }
          }}
        />
        {draft ? <IconButton className="absolute right-2 top-1/2 -translate-y-1/2" aria-label="清除搜索" size="sm" variant="ghost" onClick={() => {
          setDraft(""); submit("", false); input.current?.focus();
        }}><CloseIcon aria-hidden="true" className="h-4 w-4" /></IconButton> : null}
      </div>
      {search.error ? <div id="archive-search-error"><FormMessage variant="error" icon={<AlertIcon aria-hidden="true" className="h-4 w-4" />}>{search.error}</FormMessage></div> : <p id="archive-search-help" className="text-xs text-muted-foreground">多个关键词用空格分隔，可与分类、标签和颜色筛选组合</p>}
    </form>
  );
}
