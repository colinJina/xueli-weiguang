"use client";

import { Button } from "@/components/ui/button";
import SubmitPlusIcon from "@/components/icons/shared/plus-16.svg";

type ArchiveSubmitTriggerProps = {
  isAuthenticated: boolean;
  onRequestLogin: () => void;
  onRequestSubmit: () => void;
};

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
      <SubmitPlusIcon aria-hidden="true" className="h-4 w-4" />
      <span>推荐投稿</span>
    </Button>
  );
}
