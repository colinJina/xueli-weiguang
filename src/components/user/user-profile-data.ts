export type UserCollectionSummary = {
  id: string;
  name: string;
  itemCount: number;
  active?: boolean;
};

export type UserTagSummary = {
  id: string;
  name: string;
  active?: boolean;
};

export type UserArchiveCard = {
  id: string;
  title: string;
  coverUrl: string;
  duration: string;
  viewCountLabel: string;
  likeCountLabel: string;
  source: "bilibili" | "youtube" | "link";
  tall?: boolean;
};

export const userArchiveProfile = {
  name: "Curator_X",
  role: "Professional Archive",
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAEegZIgqAmzE6p45xTXrPxVdSRdnqsjQqPoxoRFaouPuHDEJHgnASbyMTJLUsfISGKC4BejYuTPW81_fULeXWArwJXuT2tWjPzj_POKW5urBIi7JsEQHa6EE6oRq_Pf_jDi6Tt41UiHMEJLw22WorYC22BFYZBeBZKXuv2i_gxWqGt8qrsoOWBH-8MtSUeoRX9WaSSjcj_OEHBrX6h1dPfa4uxjTMKZ_U2ooIbQIoRYw3HpNa5gT05gSPFTiLE5E-Jk0p8pSNPVNY",
};

export const userCollections: UserCollectionSummary[] = [
  { id: "motion-picks", name: "动态图形精选", itemCount: 24, active: true },
  { id: "game-trailers", name: "游戏预告片", itemCount: 12 },
  { id: "render-practice", name: "渲染练习", itemCount: 9 },
];

export const userTags: UserTagSummary[] = [
  { id: "beginner", name: "初级" },
  { id: "fat-burning", name: "燃脂", active: true },
  { id: "stretch", name: "拉伸" },
  { id: "home", name: "居家" },
  { id: "hiit", name: "HIIT" },
  { id: "legs", name: "腿部" },
  { id: "recovery", name: "放松" },
];

export const userArchiveCards: UserArchiveCard[] = [
  {
    id: "neon-flow",
    title: "Neon Flow - Abstract Motion Exploration",
    coverUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA-CDd85dX39YQUaOEmNIXZ0q6ZQkarVzN1y7l3zz3hd4EsNulvyKPYDtI9WboDnMuHX-YhqA0qltyFPI630n82m1cSuk6OlZ4HwdBp3_Bm_U2AyG-evUpG6vEEU-cYSHufcb8RdDWg_spM_3gmLf1zIXD29f5y0nCc2WI9wFmd_tEIK3XEQpJxV1s_XW3HSE13vR_tUVyHIL5PdaCkqZz5RYdZUQPGlvX1xB3oR0S6qh_c4J7cOUHHgfKArC1alMz5pZA2TBn2f7g",
    duration: "03:42",
    viewCountLabel: "12.4k",
    likeCountLabel: "842",
    source: "bilibili",
  },
  {
    id: "retro-wave-loop",
    title: "Retro Wave Loop #04",
    coverUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAMCZNv9lvSecjPLUIDZozzgWDdQQB1XQvbhJu_tHhjJZ_CBFxJz1L3Ck-u9_1Zhpi9PRtQkDAGk-aDbm2fGVCnOAyjsbipVh_Bp-I-ETPS8KgYLpE9XjdeFjUGWuK4h1Sr_LoDeWiaRLoZrn5Ls83kpvOOX1HriCu4vSfAJjhC8DiMlBpoAVeRpkk-ZCGIWMc8pb9G6DOBWjS-n22EBfLuNHco5BM0jthHTczJTUfOVcXAAti-vT7edLN74ihBsonmutwim1OdV_g",
    duration: "01:15",
    viewCountLabel: "5.2k",
    likeCountLabel: "310",
    source: "youtube",
    tall: true,
  },
  {
    id: "glassmorphism-type",
    title: "Glassmorphism Type Experiments 2024",
    coverUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDh1J69qtI66CNzSWOolA5m50nGFKefILl8G1O1cARky2-C4mGS3xvFEPFigYaMnpwkGYIaGohDmddIwhEOEaWOn2lpS3pCjuPsCgO3M03nLCd6pheBzLkanrYgR3SdShmJZ6wo1SWSyQW5Vrk1XvovDjNtRYn4ZYfvObRLaqhFuQnfA83QKbBLP9LMUdmAjB0ktk5vUTp_UrMuXKdkDktGSU2yQjRmPvS4DkgbodH0zY7aheQiHSlSd86w9vB5ZzKAffjFSOnrUNI",
    duration: "05:22",
    viewCountLabel: "89k",
    likeCountLabel: "4.5k",
    source: "bilibili",
  },
  {
    id: "fui-reel",
    title: "FUI (Fictional User Interface) Design Reel",
    coverUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYkaHWqfyA4ofXXg9Um5FQiszSyI9t33JaqaZul5ua-eh93WNieBGrfwTUjq_hxbFIJ58r7JX6jdSUB4jHExvEO1nrQROzcDmSDayNLgryZqVPwWy0f-cINejDw0Vgi_cpbgdGpD2pfTCw2-1WkBGcL8tAc5HP5kho11-ZHCBxKSyG4kIgXEt0ehGfuvGFCrkfsRSLEmFQ21Nqdk5VA4AVJNdt4Zql49Ver5WSCAPawnSwaWtk17OoGkhbiVJjAL4B85H3F-M_96g",
    duration: "02:10",
    viewCountLabel: "33.1k",
    likeCountLabel: "2.1k",
    source: "link",
  },
];
