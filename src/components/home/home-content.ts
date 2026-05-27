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

export const homeHeroContent: HomeHeroContent = {
  title: "Ethereal Genesis",
  description:
    "An exploration of generative landscapes and procedural textures in a unified digital space.",
  note: "A masterclass in lighting and composition.",
  actions: [
    { href: "/archive", label: "立即观看", variant: "primary" },
    { href: "#featured-grid", label: "查看详情", variant: "secondary" },
  ],
};

export const homeMetaStrip: readonly HomeMetaStripItem[] = [
  { label: "最多点赞", value: "142K" },
  { label: "近期热度", value: "持续上升" },
  { label: "归档状态", value: "静态精选" },
];

export const homeFeaturedCards: readonly HomeCardItem[] = [
  {
    id: "cybernetic-synthesis-v2",
    href: "/video/cybernetic-synthesis-v2",
    title: "Cybernetic Synthesis - V2 Rendering Breakdown",
    description: "高密度楼群、雾化光束与档案化构图的过程拆解。",
    source: "Bilibili",
    duration: "12:45",
    metric: "样本 01",
    tag: "结构光",
    stats: "142K 观看",
    layout: "standard",
    visual: "city",
  },
  {
    id: "fluid-dynamics-houdini",
    href: "/video/fluid-dynamics-houdini",
    title: "Fluid Dynamics Simulation in Houdini",
    description: "以流体丝带为主体的长幅试验，保留中心张力与极暗边缘。",
    source: "YouTube",
    duration: "03:20",
    metric: "样本 02",
    tag: "流形纹理",
    stats: "89K 观看",
    layout: "feature",
    visual: "ribbon",
  },
  {
    id: "archive-systems-masterclass",
    href: "/video/archive-systems-masterclass",
    title: "Archive Systems Masterclass: Structuring Data",
    description: "将材质拼缝与断裂反光用于视频档案封面的低饱和表达。",
    source: "Native",
    duration: "45:00",
    metric: "样本 03",
    tag: "切面数据",
    stats: "210K 观看",
    layout: "compact",
    visual: "slate",
  },
  {
    id: "stellar-nursery-ue5",
    href: "/video/stellar-nursery-ue5",
    title: "Stellar Nursery - UE5 Environment",
    description: "保留空白封面区，作为后续真实作品缩略图的静态占位槽。",
    source: "Bilibili",
    duration: "01:15",
    metric: "样本 04",
    tag: "占位封面",
    stats: "56K 观看",
    layout: "ghost",
    visual: "blank",
  },
];
