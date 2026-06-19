const ERROR_MAP: ReadonlyArray<{ match: RegExp; message: string }> = [
  { match: /already submitted|duplicate|已投稿/i, message: "该视频已投稿，请勿重复提交。" },
  {
    match: /valid bilibili|有效的 bilibili|valid youtube|有效的 youtube|bv 号/i,
    message: "请输入有效的 Bilibili 或 YouTube 视频链接。",
  },
  { match: /unauthorized|请先登录/i, message: "请先登录后再投稿。" },
  { match: /network error|failed to fetch/i, message: "网络异常，请稍后重试。" },
];

export function translateSubmissionError(raw: string | null | undefined): string {
  if (!raw) {
    return "投稿失败，请稍后重试。";
  }

  for (const entry of ERROR_MAP) {
    if (entry.match.test(raw)) {
      return entry.message;
    }
  }

  return raw;
}
