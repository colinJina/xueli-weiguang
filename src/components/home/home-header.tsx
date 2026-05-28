"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

import {
  HomeCogIcon,
  HomeLoginIcon,
  HomeSearchIcon,
  HomeUploadIcon,
} from "@/components/home/home-icons";
import { createFadeUp } from "@/components/home/home-motion";
import { SiteBrand } from "@/components/layout/site-brand";
import { cn } from "@/lib/utils";

type HomeNavigationItem = {
  href: string;
  label: string;
};

type HomeHeaderProps = {
  navigation: readonly HomeNavigationItem[];
  motionReady?: boolean;
};

const iconButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-transparent text-[#a8adb6] transition duration-200 hover:border-white/10 hover:bg-white/[0.04] hover:text-white";

const headerVariants = createFadeUp(10, 0.04, 0.32);

export function HomeHeader({ navigation, motionReady = true }: HomeHeaderProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 border-b border-white/6 bg-[rgba(3,3,4,0.94)] backdrop-blur-[14px]"
      initial={prefersReducedMotion ? false : "hidden"}
      animate={prefersReducedMotion ? undefined : motionReady ? "visible" : "hidden"}
      variants={headerVariants}
    >
      <div className="page-container flex h-[72px] items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-8">
          <SiteBrand
            className="shrink-0"
            markClassName="hidden"
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
          <button aria-label="搜索" className={iconButtonClassName} type="button">
            <HomeSearchIcon className="h-[1.35rem] w-[1.35rem]" />
          </button>
          <button aria-label="上传" className={iconButtonClassName} type="button">
            <HomeUploadIcon className="h-[1.2rem] w-[1.2rem]" />
          </button>
          <button aria-label="设置" className={iconButtonClassName} type="button">
            <HomeCogIcon className="h-[1.3rem] w-[1.3rem]" />
          </button>

          <Link
            className="ml-2 inline-flex min-h-11 items-center gap-2 rounded-[14px] border border-black/10 bg-white px-5 text-[1rem] font-semibold text-black shadow-[0_4px_16px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-px hover:bg-[#f5f5f3]"
            href="/profile/curator-x"
          >
            <HomeLoginIcon className="h-[1.1rem] w-[1.1rem]" />
            <span>登录</span>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
