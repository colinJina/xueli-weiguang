"use client";

import type { MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type ArchiveTransitionBoundaryProps = {
  children: ReactNode;
  controls: ReactNode;
  fallback: ReactNode;
};

type ArchiveTransitionClick = {
  altKey: boolean;
  anchorDownload: string | null;
  anchorHref: string | null;
  anchorTarget: string | null;
  button: number;
  ctrlKey: boolean;
  currentOrigin: string;
  currentPathname: string;
  currentSearch: string;
  defaultPrevented: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

const archivePathname = "/archive";

export function ArchiveTransitionBoundary({
  children,
  controls,
  fallback,
}: ArchiveTransitionBoundaryProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsPending(false);
  }, [pathname, search]);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const anchor = target.closest("a");

    if (!anchor || !event.currentTarget.contains(anchor)) {
      return;
    }

    const shouldStartTransition = shouldStartArchiveTransition({
      altKey: event.altKey,
      anchorDownload: anchor.getAttribute("download"),
      anchorHref: anchor.getAttribute("href"),
      anchorTarget: anchor.getAttribute("target"),
      button: event.button,
      ctrlKey: event.ctrlKey,
      currentOrigin: window.location.origin,
      currentPathname: pathname,
      currentSearch: search,
      defaultPrevented: event.defaultPrevented,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    });

    if (shouldStartTransition) {
      setIsPending(true);
    }
  }

  return (
    <div onClickCapture={handleClick}>
      {controls}
      {isPending ? fallback : children}
    </div>
  );
}

function shouldStartArchiveTransition({
  altKey,
  anchorDownload,
  anchorHref,
  anchorTarget,
  button,
  ctrlKey,
  currentOrigin,
  currentPathname,
  currentSearch,
  defaultPrevented,
  metaKey,
  shiftKey,
}: ArchiveTransitionClick) {
  if (
    defaultPrevented ||
    button !== 0 ||
    altKey ||
    ctrlKey ||
    metaKey ||
    shiftKey ||
    !anchorHref ||
    anchorDownload !== null ||
    (anchorTarget !== null && anchorTarget !== "" && anchorTarget !== "_self")
  ) {
    return false;
  }

  const currentUrl = new URL(
    `${currentPathname}${normalizeSearch(currentSearch)}`,
    currentOrigin,
  );
  const targetUrl = new URL(anchorHref, currentOrigin);

  if (targetUrl.origin !== currentUrl.origin || targetUrl.pathname !== archivePathname) {
    return false;
  }

  return targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search;
}

function normalizeSearch(search: string) {
  if (!search) {
    return "";
  }

  return search.startsWith("?") ? search : `?${search}`;
}
