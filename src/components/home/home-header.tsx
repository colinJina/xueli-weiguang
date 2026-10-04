"use client";

import { SiteNavigation, type SiteNavigationProps } from "@/components/layout/site-navigation";

type HomeHeaderProps = Omit<SiteNavigationProps, "activeHref" | "onSubmitClick"> & {
  onUploadClick: () => void;
};

export function HomeHeader({ onUploadClick, ...props }: HomeHeaderProps) {
  return (
    <header className="sticky inset-x-0 top-0 z-50 border-b border-border bg-surface">
      <SiteNavigation {...props} activeHref="/" onSubmitClick={onUploadClick} />
    </header>
  );
}
