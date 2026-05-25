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
    <div className="surface-panel p-6">
      <p className="eyebrow mb-4">{label}</p>
      <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="max-w-2xl text-sm leading-7 text-muted">{description}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
