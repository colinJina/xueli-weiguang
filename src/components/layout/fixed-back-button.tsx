"use client";

import { useRouter } from "next/navigation";

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
      <BackArrowIcon />
    </IconButton>
  );
}

function BackArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[1.15rem] w-[1.15rem]"
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M12.8 4.6 7.4 10l5.4 5.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M8 10h8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
