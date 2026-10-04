import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { ReactNode } from "react";

type PlaceholderPanelProps = {
  label: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PlaceholderPanel({
  label,
  title,
  description,
  children,
}: PlaceholderPanelProps) {
  return (
    <Card>
      <CardHeader>
        <svg aria-hidden="true" className="mb-2 h-8 w-8 text-subtle" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="6" width="24" height="20" rx="4" stroke="currentColor" />
          <path d="M10 6v20M22 6v20M4 12h6M4 20h6M22 12h6M22 20h6" stroke="currentColor" />
          <path d="m14 12 5 4-5 4v-8Z" fill="currentColor" />
        </svg>
        <p className="eyebrow mb-4">{label}</p>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-2xl">{description}</CardDescription>
      </CardHeader>
      {children ? <CardContent>{children}</CardContent> : null}
    </Card>
  );
}
