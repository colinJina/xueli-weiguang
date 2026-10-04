"use client";

import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { PushNotificationProvider } from "@/components/push/push-notification-provider";
import { PageTopMessageProvider } from "@/components/ui/page-top-message-provider";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={250}>
      <PageTopMessageProvider>
        <PushNotificationProvider>{children}</PushNotificationProvider>
      </PageTopMessageProvider>
    </TooltipProvider>
  );
}
