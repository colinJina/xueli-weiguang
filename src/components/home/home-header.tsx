"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { UserMenu } from "@/components/auth/user-menu";
import { createFadeUp } from "@/components/home/home-motion";
import HomeArchiveIcon from "@/components/icons/home/archive.svg";
import HomeCompassIcon from "@/components/icons/home/compass.svg";
import HomeLoginIcon from "@/components/icons/home/login.svg";
import HomeProfileIcon from "@/components/icons/home/profile.svg";
import HomeUploadIcon from "@/components/icons/home/upload.svg";
import { SiteBrand } from "@/components/layout/site-brand";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

type HomeNavigationItem = {
  href: string;
  icon: "explore" | "library" | "profile";
  label: string;
};

type HomeHeaderProps = {
  navigation: readonly HomeNavigationItem[];
  motionReady?: boolean;
  user: User | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogout: () => void;
  onUploadClick: () => void;
};

const headerVariants = createFadeUp(10, 0.04, 0.32);

function getNavigationIcon(icon: HomeNavigationItem["icon"]) {
  switch (icon) {
    case "explore":
      return HomeCompassIcon;
    case "library":
      return HomeArchiveIcon;
    case "profile":
      return HomeProfileIcon;
  }
}

export function HomeHeader({
  navigation,
  motionReady = true,
  user,
  onLoginClick,
  onRegisterClick,
  onLogout,
  onUploadClick,
}: HomeHeaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const isAuthenticated = Boolean(user);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 border-b border-white/6 bg-[rgba(3,3,4,0.94)] backdrop-blur-[14px]"
      initial={prefersReducedMotion ? false : "hidden"}
      animate={
        prefersReducedMotion ? undefined : motionReady ? "visible" : "hidden"
      }
      variants={headerVariants}
    >
      <div className="page-container flex h-[72px] items-center justify-between gap-2 sm:gap-3 md:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:flex-none md:gap-8">
          <SiteBrand
            className="min-w-0 shrink"
            markClassName="max-sm:h-5 max-sm:w-5"
            subtitle="PV WORKS ARCHIVE"
            subtitleClassName="hidden"
            titleClassName="max-w-[7ch] truncate text-[1.2rem] tracking-[-0.04em] sm:max-w-none sm:text-[1.45rem] md:text-[1.85rem]"
          />

          <nav className="flex shrink-0 items-center gap-1 sm:gap-2 md:min-w-0 md:gap-7" aria-label="主导航">
            {navigation.map((item) => {
              const NavigationIcon = getNavigationIcon(item.icon);
              const isActive = item.href === "/";
              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative inline-flex shrink-0 items-center justify-center text-[#a5a9b1] transition duration-200 hover:text-white md:pb-1",
                    "max-md:h-9 max-md:w-9 max-md:rounded-full max-md:border max-md:border-transparent sm:max-md:h-10 sm:max-md:w-10",
                    isActive &&
                      "text-white md:after:absolute md:after:inset-x-0 md:after:-bottom-[19px] md:after:h-[2px] md:after:bg-white max-md:border-white/[0.12] max-md:bg-white/[0.06]",
                    !isActive &&
                      "max-md:hover:border-white/10 max-md:hover:bg-white/[0.04]",
                  )}
                >
                  <span className="hidden text-[1.05rem] font-semibold tracking-[-0.02em] md:inline">
                    {item.label}
                  </span>
                  <span className="md:hidden">
                    <NavigationIcon aria-hidden="true" className="h-4 w-4 sm:h-[1.05rem] sm:w-[1.05rem]" />
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 md:gap-2">
          <IconButton
            aria-label="上传"
            className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11"
            onClick={onUploadClick}
            size="sm"
            variant="ghost"
          >
            <HomeUploadIcon aria-hidden="true" className="h-[1.2rem] w-[1.2rem]" />
          </IconButton>
          {isAuthenticated && user ? (
            <div className="ml-0.5 sm:ml-1 md:ml-2">
              <UserMenu onLogout={onLogout} user={user} variant="expanded" />
            </div>
          ) : (
            <div className="ml-0.5 flex shrink-0 items-center gap-1 sm:ml-1 sm:gap-2 md:ml-2">
              <Button
                className="hidden text-base md:inline-flex"
                onClick={onRegisterClick}
                size="default"
                type="button"
                variant="secondary"
              >
                <span>注册</span>
              </Button>
              <IconButton
                aria-label="登录"
                className="h-9 w-9 md:hidden"
                onClick={onLoginClick}
                size="sm"
                variant="ghost"
              >
                <HomeLoginIcon aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" />
              </IconButton>
              <Button
                className="hidden gap-2 text-base md:inline-flex"
                onClick={onLoginClick}
                size="default"
                type="button"
                variant="primary"
              >
                <HomeLoginIcon aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" />
                <span>登录</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
