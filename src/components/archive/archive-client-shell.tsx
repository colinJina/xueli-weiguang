import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";

export function ArchiveClientShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader activeHref="/archive" />
      {children}
    </div>
  );
}
