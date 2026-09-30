"use client";

import type { ReactNode } from "react";

import { PushNotificationProvider } from "@/components/push/push-notification-provider";
import { PageTopMessageProvider } from "@/components/ui/page-top-message-provider";

export function RootProviders({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PageTopMessageProvider>
      <PushNotificationProvider>{children}</PushNotificationProvider>
    </PageTopMessageProvider>
  );
}
