"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import ChevronDownIcon from "@/components/icons/auth/chevron-down.svg";
import LogoutIcon from "@/components/icons/auth/logout.svg";
import ProfileIcon from "@/components/icons/auth/profile.svg";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  user: User;
  onLogout: () => void;
  variant?: "compact" | "expanded";
};

type DropdownPosition = {
  top: number;
  right: number;
};

function deriveInitial(user: User): string {
  const source = user.email ?? user.user_metadata?.name ?? user.id;
  return source.slice(0, 1).toUpperCase();
}

function deriveDisplay(user: User): string {
  if (user.email) {
    return user.email;
  }
  return user.user_metadata?.name ?? user.id.slice(0, 8);
}

export function UserMenu({ user, onLogout, variant = "compact" }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) {
      return;
    }
    const rect = button.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const initial = deriveInitial(user);
  const display = deriveDisplay(user);

  const dropdown =
    open && position && mounted
      ? createPortal(
          <div
            className="fixed z-[200] min-w-[224px] overflow-hidden rounded-2xl border border-border bg-background p-1.5 shadow-overlay"
            ref={dropdownRef}
            role="menu"
            style={{ top: position.top, right: position.right }}
          >
            <div className="border-b border-border px-3 py-2.5">
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-subtle">
                登录身份
              </p>
              <p className="mt-1 truncate text-sm font-medium text-foreground">{display}</p>
            </div>

            <Link
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface hover:text-foreground"
              href="/user"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <ProfileIcon />
              <span>我的档案</span>
            </Link>

            <button
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface hover:text-foreground"
              onClick={() => {
                setOpen(false);
                void onLogout();
              }}
              role="menuitem"
              type="button"
            >
              <LogoutIcon />
              <span>登出</span>
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="账户菜单"
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-1.5 py-1 text-sm font-semibold text-foreground transition hover:border-white/25 hover:bg-panelHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
          variant === "expanded" ? "min-h-11 pr-3" : "min-h-9 pr-2.5",
        )}
        onClick={() => setOpen((prev) => !prev)}
        ref={buttonRef}
        type="button"
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-foreground text-[12px] font-black uppercase text-background",
            variant === "expanded" ? "h-8 w-8" : "h-7 w-7",
          )}
        >
          {initial}
        </span>
        {variant === "expanded" ? (
          <span className="hidden max-w-[120px] truncate sm:inline">{display}</span>
        ) : null}
        <ChevronDownIcon />
      </button>

      {dropdown}
    </div>
  );
}

