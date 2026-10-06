"use client";

import { useRef } from "react";
import Link from "next/link";
import { AccountActions } from "@/components/auth/account-actions";
import { ArchiveSubmitTrigger } from "@/components/archive/archive-submit-trigger";
import MenuIcon from "@/components/icons/shared/menu.svg";
import UploadIcon from "@/components/icons/shared/upload.svg";
import { SiteBrand } from "@/components/layout/site-brand";
import { PushNotificationButton } from "@/components/push/push-notification-button";
import { IconButton } from "@/components/ui/icon-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

export const siteNavigation = [
  { href: "/", label: "首页" },
  { href: "/archive", label: "PV" },
  { href: "/user", label: "我的收藏" },
] as const;

export type SiteNavigationProps = {
  activeHref?: string;
  user: User | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogout: () => void;
  onSubmitClick: () => void;
};

export function SiteNavigation({ activeHref, user, onLoginClick, onRegisterClick, onLogout, onSubmitClick }: SiteNavigationProps) {
  const submitAfterClose = useRef(false);
  return (
    <div className="page-container flex h-[72px] items-center justify-between gap-2 lg:gap-6">
      <div className="flex min-w-0 items-center gap-8">
        <SiteBrand className="min-w-0" />
        <nav aria-label="主导航" className="hidden items-center gap-6 lg:flex">
          {siteNavigation.map((item) => (
            <Link key={item.href} href={item.href} aria-current={activeHref === item.href ? "page" : undefined}
              className={cn("border-b-2 border-transparent py-6 text-sm font-semibold text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", activeHref === item.href && "border-foreground text-foreground")}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-1 lg:gap-2">
        <PushNotificationButton className="h-11 w-11" />
        <div className="hidden lg:block">
          <ArchiveSubmitTrigger isAuthenticated={Boolean(user)} onRequestLogin={onSubmitClick} onRequestSubmit={onSubmitClick} />
        </div>
        <AccountActions user={user} onLoginClick={onLoginClick} onRegisterClick={onRegisterClick} onLogout={onLogout} />
        <nav aria-label="主导航" className="lg:hidden">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <IconButton aria-label="打开导航菜单" size="lg" variant="ghost"><MenuIcon aria-hidden="true" className="h-5 w-5" /></IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48" onCloseAutoFocus={() => {
              if (submitAfterClose.current) {
                submitAfterClose.current = false;
                queueMicrotask(onSubmitClick);
              }
            }}>
              {siteNavigation.map((item) => (
                <DropdownMenuItem asChild key={item.href}>
                  <Link href={item.href} aria-current={activeHref === item.href ? "page" : undefined}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => { submitAfterClose.current = true; }}>
                <UploadIcon aria-hidden="true" className="h-5 w-5" />投稿 PV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </div>
  );
}
