"use client";

import Link from "next/link";

import UnavailableIcon from "@/components/icons/video/unavailable.svg";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RouteErrorViewProps = {
  backHref: string;
  backLabel: string;
  description: string;
  eyebrow: string;
  onRetry: () => void;
  title: string;
};

export function RouteErrorView({
  backHref,
  backLabel,
  description,
  eyebrow,
  onRetry,
  title,
}: RouteErrorViewProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090909] px-5 py-12 text-white">
      <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/30">
          <UnavailableIcon aria-hidden="true" className="h-7 w-7 text-white/70" />
        </div>
        <p className="mt-8 font-sans text-[0.7rem] uppercase tracking-[0.22em] text-white/45">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-white/60">{description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={onRetry} type="button">
            重新尝试
          </Button>
          <Link
            className={cn(buttonVariants({ variant: "pill" }), "inline-flex items-center")}
            href={backHref}
          >
            {backLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
