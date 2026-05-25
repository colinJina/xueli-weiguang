export type ArchiveCardSize = "short" | "medium" | "tall";

export type ArchiveSource = "bilibili" | "youtube" | "native";

export type ArchiveVideoItem = {
  id: string;
  title: string;
  subtitle: string;
  source: ArchiveSource;
  category: string;
  chipLabel: string;
  tags: string[];
  tone: number;
  metric: string;
  cardSize: ArchiveCardSize;
  order: number;
};

export const archiveCategories = [
  "歌曲 PV",
  "2D 动态图形",
  "游戏 PV",
  "3DCG",
  "MAD",
  "动画短片",
  "广告",
  "模型展示",
] as const;

export const archiveToneLabels = [
  "偏冷",
  "冷白",
  "银灰",
  "柔雾",
  "中性",
  "亮面",
  "对比强",
  "多图手书",
] as const;

export const archiveNavSummary = {
  activeChannel: "游戏 PV",
  channelCount: "186",
  supportCount: "08",
} as const;

export const archiveVideos: ArchiveVideoItem[] = [
  {
    id: "lian-feng-xie",
    title: "恋风邪",
    subtitle: "FULL-WIDTH TYPE",
    source: "bilibili",
    category: "歌曲 PV",
    chipLabel: "歌曲 PV",
    tags: ["标题字设", "2D 动态图形"],
    tone: 2,
    metric: "04",
    cardSize: "medium",
    order: 1,
  },
  {
    id: "scapegoat",
    title: "Scapegoat",
    subtitle: "COOL GLOSS",
    source: "native",
    category: "游戏 PV",
    chipLabel: "本土投稿",
    tags: ["紫调", "角色"],
    tone: 5,
    metric: "03",
    cardSize: "tall",
    order: 2,
  },
  {
    id: "kmnz",
    title: "KMNZ",
    subtitle: "FLAT IMPACT",
    source: "youtube",
    category: "MAD",
    chipLabel: "原创热区",
    tags: ["拼贴", "高饱和"],
    tone: 4,
    metric: "02",
    cardSize: "medium",
    order: 3,
  },
  {
    id: "unwound",
    title: "Unwound",
    subtitle: "SHARP PATH",
    source: "youtube",
    category: "2D 动态图形",
    chipLabel: "2D 动态图形",
    tags: ["蓝白", "几何"],
    tone: 6,
    metric: "02",
    cardSize: "medium",
    order: 4,
  },
  {
    id: "shiromuku",
    title: "白无垢",
    subtitle: "LOW GLOW",
    source: "bilibili",
    category: "动画短片",
    chipLabel: "支持",
    tags: ["光晕", "仪式感"],
    tone: 3,
    metric: "02",
    cardSize: "tall",
    order: 5,
  },
  {
    id: "stormy",
    title: "Stormy",
    subtitle: "DENSE TITLE",
    source: "native",
    category: "模型展示",
    chipLabel: "排版密集",
    tags: ["灰调", "双角色"],
    tone: 1,
    metric: "02",
    cardSize: "medium",
    order: 6,
  },
];
