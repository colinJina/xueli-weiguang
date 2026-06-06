"use client";

import { Button } from "@/components/ui/button";

type ArchiveSubmitTriggerProps = {
  isAuthenticated: boolean;
  onRequestLogin: () => void;
  onRequestSubmit: () => void;
};

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M8 3.5v9M3.5 8h9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function ArchiveSubmitTrigger({
  isAuthenticated,
  onRequestLogin,
  onRequestSubmit,
}: ArchiveSubmitTriggerProps) {
  function handleClick() {
    if (isAuthenticated) {
      onRequestSubmit();
      return;
    }

    onRequestLogin();
  }

  return (
    <Button
      className="bg-white/[0.08] text-base font-bold text-foreground hover:bg-white/[0.06]"
      onClick={handleClick}
      size="md"
      type="button"
      variant="pill"
    >
      <PlusIcon />
      <span>推荐投稿</span>
    </Button>
  );
}
