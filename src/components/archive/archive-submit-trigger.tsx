"use client";

import { Button } from "@/components/ui/button";
import UploadIcon from "@/components/icons/shared/upload.svg";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ArchiveSubmitTriggerProps = {
  isAuthenticated: boolean;
  onRequestLogin: () => void;
  onRequestSubmit: () => void;
  iconOnly?: boolean;
  className?: string;
};

export function ArchiveSubmitTrigger({
  isAuthenticated,
  onRequestLogin,
  onRequestSubmit,
  iconOnly = false,
  className,
}: ArchiveSubmitTriggerProps) {
  function handleClick() {
    if (isAuthenticated) {
      onRequestSubmit();
      return;
    }

    onRequestLogin();
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label="投稿 PV"
          className={className}
          onClick={handleClick}
          size={iconOnly ? "icon" : "default"}
          type="button"
          variant="secondary"
        >
          <UploadIcon aria-hidden="true" className="h-5 w-5" />
          {iconOnly ? null : <span>投稿 PV</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent>投稿 PV</TooltipContent>
    </Tooltip>
  );
}
