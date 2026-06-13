export type HomeAction = {
  href: string;
  label: string;
  variant: "primary" | "secondary";
};

export type HomeHeroContent = {
  title: string;
  description: string;
  note: string;
  actions: readonly [HomeAction, HomeAction];
};

export type HomeMetaStripItem = {
  label: string;
  value: string;
};

export type HomeCardLayout = "standard" | "feature" | "ghost" | "compact";

export type HomeCardVisual = "city" | "ribbon" | "slate" | "blank";

export type HomeCardItem = {
  id: string;
  href: string;
  title: string;
  description: string;
  source: string;
  duration: string;
  metric: string;
  tag: string;
  stats: string;
  layout: HomeCardLayout;
  visual: HomeCardVisual;
};
