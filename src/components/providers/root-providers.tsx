"use client";

import type { ReactNode } from "react";

import { PageTopMessageProvider } from "@/components/ui/page-top-message-provider";

export function RootProviders({
  children,
}: {
  children: ReactNode;
}) {
  return <PageTopMessageProvider>{children}</PageTopMessageProvider>;
}
