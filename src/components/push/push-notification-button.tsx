"use client";

import BellIcon from "@/components/icons/home/bell.svg";
import { usePushNotifications } from "@/components/push/push-notification-provider";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

export function PushNotificationButton({ className }: { className?: string }) {
  const {
    enabled,
    isBusy,
    isReady,
    isSubscribed,
    openDialog,
    permission,
  } = usePushNotifications();

  if (!enabled) {
    return null;
  }

  const isDisabled = !isReady || isBusy || permission === "unsupported";
  const label = isSubscribed ? "管理新 PV 通知" : "开启新 PV 通知";

  return (
    <IconButton
      aria-label={label}
      aria-pressed={isSubscribed}
      className={cn("relative", className)}
      disabled={isDisabled}
      onClick={openDialog}
      size="sm"
      title={permission === "unsupported" ? "当前浏览器不支持通知" : label}
      type="button"
      variant="ghost"
    >
      <BellIcon aria-hidden="true" className="h-[1.15rem] w-[1.15rem]" />
      {isSubscribed ? (
        <span
          aria-hidden="true"
          className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-white ring-2 ring-background"
        />
      ) : null}
    </IconButton>
  );
}
