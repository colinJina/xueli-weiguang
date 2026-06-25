"use client";

import { useRouter } from "next/navigation";

import BackArrowIcon from "@/components/icons/layout/back-arrow.svg";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

type FixedBackButtonProps = {
  className?: string;
  fallbackHref?: string;
  label?: string;
};

export function FixedBackButton({
  className,
  fallbackHref = "/",
  label = "返回上一页",
}: FixedBackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <IconButton
      aria-label={label}
      className={cn(
        "fixed left-5 top-[100px] z-40 -translate-y-1/2 border-white/12 bg-[rgba(10,10,11,0.82)] text-foreground shadow-overlay backdrop-blur-[14px] hover:border-white/20 hover:bg-white/[0.08] sm:left-6",
        className,
      )}
      onClick={handleBack}
      size="lg"
      type="button"
      variant="surface"
    >
      <BackArrowIcon aria-hidden="true" className="h-[1.15rem] w-[1.15rem]" />
    </IconButton>
  );
}
