import { describe, expect, it } from "vitest";

import { translateSubmissionError } from "./translate-submission-error";

describe("submission error copy", () => {
  it("replaces unknown implementation errors with a readable operation message", () => {
    expect(translateSubmissionError("Internal Server Error")).toBe("投稿失败，请稍后重试");
    expect(translateSubmissionError("COS AccessDenied", "上传失败，请稍后重试")).toBe("上传失败，请稍后重试");
  });

  it("keeps recovery instructions and translates recognized network failures", () => {
    expect(translateSubmissionError("上传已过期，请重新选择文件", "上传失败，请稍后重试")).toBe("上传已过期，请重新选择文件");
    expect(translateSubmissionError("Failed to fetch", "上传失败，请稍后重试")).toBe("网络异常，请稍后重试");
  });
});
