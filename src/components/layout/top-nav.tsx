"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-surface backdrop-blur-xl">
      <div className="page-container flex min-h-20 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link className="font-display text-2xl font-bold tracking-tight text-foreground" href="/">
            雪笠微光
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {siteConfig.navigation.map((item) => {
              const isActive =
                item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  className={cn(
                    "rounded-md border px-4 py-2 text-sm font-medium transition duration-200",
                    isActive
                      ? "border-white/10 bg-white text-black"
                      : "border-transparent text-subtle hover:border-white/10 hover:bg-white/5 hover:text-foreground",
                  )}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-subtle sm:block">Strict B/W Tokens</span>
          <Button size="sm" variant="secondary">
            骨架阶段
          </Button>
          <Button size="sm">TopNav 占位</Button>
        </div>
      </div>
    </header>
  );
}
