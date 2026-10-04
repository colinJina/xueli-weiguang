"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatePanel } from "@/components/ui/state-panel";

type RouteErrorViewProps = {
  backHref: string;
  backLabel: string;
  description: string;
  onRetry: () => void;
  title: string;
};
export function RouteErrorView({ backHref, backLabel, description, onRetry, title }: RouteErrorViewProps) {
  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
    <StatePanel className="w-full max-w-xl" kind="error" headingLevel={1} title={title} description={description}>
      <Button onClick={onRetry} type="button">重试</Button>
      <Button asChild variant="secondary"><Link href={backHref}>{backLabel}</Link></Button>
    </StatePanel>
  </main>;
}
