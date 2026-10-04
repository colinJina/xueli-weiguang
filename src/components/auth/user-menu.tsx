"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import ChevronDownIcon from "@/components/icons/auth/chevron-down.svg";
import LogoutIcon from "@/components/icons/shared/logout.svg";
import ProfileIcon from "@/components/icons/shared/user.svg";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  user: User;
  onLogout: () => void;
  variant?: "compact" | "expanded";
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
  const initial = deriveInitial(user);
  const display = deriveDisplay(user);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="账户菜单"
          className={cn(
            "h-11 gap-2 px-2 py-1 text-sm",
            variant === "expanded" ? "lg:pr-3" : "pr-2.5",
          )}
          size="sm"
          type="button"
          variant="secondary"
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
            <span className="hidden max-w-[120px] truncate lg:inline">{display}</span>
          ) : null}
          <ChevronDownIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[224px] rounded-2xl p-1.5" sideOffset={8}>
        <DropdownMenuLabel>
          <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-subtle">
            登录身份
          </p>
          <p className="mt-1 truncate text-sm font-medium text-foreground">{display}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-xl">
          <Link href="/user">
            <ProfileIcon aria-hidden="true" />
            <span>我的收藏</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-xl" onSelect={() => { void onLogout(); }}>
          <LogoutIcon aria-hidden="true" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
