"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { UserMenu } from "@/components/auth/user-menu";
import {
  // HomeCogIcon,
  HomeLoginIcon,
  // HomeSearchIcon,
  HomeUploadIcon,
} from "@/components/home/home-icons";
import { createFadeUp } from "@/components/home/home-motion";
import { SiteBrand } from "@/components/layout/site-brand";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

type HomeNavigationItem = {
  href: string;
  label: string;
};

type HomeHeaderProps = {
  navigation: readonly HomeNavigationItem[];
  motionReady?: boolean;
  user: User | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogout: () => void;
};

const headerVariants = createFadeUp(10, 0.04, 0.32);

export function HomeHeader({
  navigation,
  motionReady = true,
  user,
  onLoginClick,
  onRegisterClick,
  onLogout,
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
      <div className="page-container flex h-[72px] items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-8">
          <SiteBrand
            className="shrink-0"
            subtitle="VIDEO ARCHIVE"
            subtitleClassName="hidden"
            titleClassName="text-[1.85rem] tracking-[-0.04em]"
          />

          <nav className="flex min-w-0 items-center gap-7" aria-label="主导航">
            {navigation.map((item) => {
              const isActive = item.href === "/";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative shrink-0 pb-1 text-[1.05rem] font-semibold tracking-[-0.02em] text-[#a5a9b1] transition duration-200 hover:text-white",
                    isActive &&
                      "text-white after:absolute after:inset-x-0 after:-bottom-[19px] after:h-[2px] after:bg-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* <IconButton aria-label="搜索" size="lg" variant="ghost">
            <HomeSearchIcon className="h-[1.35rem] w-[1.35rem]" />
          </IconButton> */}
          <IconButton aria-label="上传" size="lg" variant="ghost">
            <HomeUploadIcon className="h-[1.2rem] w-[1.2rem]" />
          </IconButton>
          {/* <IconButton aria-label="设置" size="lg" variant="ghost">
            <HomeCogIcon className="h-[1.3rem] w-[1.3rem]" />
          </IconButton> */}

          {isAuthenticated && user ? (
            <div className="ml-2">
              <UserMenu onLogout={onLogout} user={user} variant="expanded" />
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Button
                className="text-base"
                onClick={onRegisterClick}
                size="default"
                type="button"
                variant="secondary"
              >
                <span>注册</span>
              </Button>
              <Button
                className="gap-2 text-base"
                onClick={onLoginClick}
                size="default"
                type="button"
                variant="primary"
              >
                <HomeLoginIcon className="h-[1.1rem] w-[1.1rem]" />
                <span>登录</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
