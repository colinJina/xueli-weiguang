export type VideoDetail = {
  slug: string;
  title: string;
  sourceLabel: string;
  visibilityLabel: string;
  authorUid: string;
  curatorName: string;
  addedAt: string;
  likeCount: string;
  description: string;
  tags: readonly string[];
  coverImageUrl: string;
  coverImageAlt: string;
  playHint: string;
};

const coverImageUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDpET1UWLSD4w8iaRy2mUgA3pSZtBooYIIpzDx8WS_tfAyhl-i7k83kMZCpdwYziO1F2qEQPYogolzQ9XGBLDX477KLNb6bMbVDPDqvPnRey6ugyXCbithcoRi4E0zsFOzJzREIyA2yjoFyGdz5mnYHLrcdQ7Lc3nweUOM5mzlbgroKdtXQ3ymEvj4dS8aXQq4kCOcfZfuHuoX7yFm-xO5q5TzxJ0oetv_2ASbxl9LFjlmd1a7Ldn689SaN4g0j4O6_k1HzOgxCxH8";

const defaultVideoDetail: VideoDetail = {
  slug: "genshin-photo-share-001",
  title: "我在原神摄影里的531天 | 原神摄影分享#1",
  sourceLabel: "Bilibili Source",
  visibilityLabel: "公开 (Public)",
  authorUid: "123324339",
  curatorName: "Curator_X",
  addedAt: "2024-03-20",
  likeCount: "2.4万",
  description:
    "这是一段关于游戏内摄影的深度分享。记录了 531 天里捕捉到的绝美光影与构图技巧。通过镜头语言，重新发现开放世界的细节之美。视频包含调色思路、取景角度以及后期处理的完整流程展示。",
  tags: ["#原神", "#摄影", "#光影", "#教程"],
  coverImageUrl,
  coverImageAlt:
    "一处被冷色天光笼罩的森林空地，画面中心是一座带暖色窗光的小屋，前景站着一位注视小屋的人物。",
  playHint: "点击开始播放 (Click to play)",
};

export const videoDetails: Record<string, VideoDetail> = {
  [defaultVideoDetail.slug]: defaultVideoDetail,
  "cybernetic-synthesis-v2": {
    ...defaultVideoDetail,
    slug: "cybernetic-synthesis-v2",
  },
  "fluid-dynamics-houdini": {
    ...defaultVideoDetail,
    slug: "fluid-dynamics-houdini",
  },
  "archive-systems-masterclass": {
    ...defaultVideoDetail,
    slug: "archive-systems-masterclass",
  },
  "stellar-nursery-ue5": {
    ...defaultVideoDetail,
    slug: "stellar-nursery-ue5",
  },
};

export function getVideoDetail(slug: string): VideoDetail {
  return videoDetails[slug] ?? {
    ...defaultVideoDetail,
    slug,
  };
}
