// @vitest-environment jsdom
import "../../../tests/dom-setup";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ArchiveSubmitDialog } from "@/components/archive/archive-submit-dialog";
import type { CroppedImageResult } from "@/components/ui/image-crop-dialog";

const { putObject } = vi.hoisted(() => ({ putObject: vi.fn() }));

vi.mock("cos-js-sdk-v5", () => ({
  default: class {
    putObject = putObject;
  },
}));

vi.mock("@/components/ui/image-crop-dialog", () => ({
  ImageCropDialog: ({ onConfirm }: { onConfirm: (result: CroppedImageResult) => void }) => (
    <button
      onClick={() => onConfirm({
        file: new File(["cover"], "cover.jpg", { type: "image/jpeg" }),
        objectUrl: "",
      })}
    >
      确认裁切
    </button>
  ),
}));

beforeEach(() => putObject.mockReset().mockResolvedValue({}));
afterEach(() => vi.restoreAllMocks());

async function prepareUpload(file: File) {
  const user = userEvent.setup();
  render(<ArchiveSubmitDialog allowNativeUpload onClose={() => {}} open />);
  await user.click(screen.getByRole("tab", { name: "本地上传" }));
  await user.type(screen.getByRole("textbox", { name: "标题" }), "手机 PV");
  // fireEvent preserves the supplied MIME instead of letting user-event infer it.
  fireEvent.change(screen.getByLabelText("PV 文件"), { target: { files: [file] } });
  fireEvent.change(screen.getByLabelText("封面图"), {
    target: { files: [new File(["cover"], "cover.jpg", { type: "image/jpeg" })] },
  });
  await user.click(screen.getByRole("button", { name: "确认裁切" }));
  return user;
}

describe("mobile local PV upload", () => {
  function uploadCredential(submissionId = "submission-test") {
    return new Response(JSON.stringify({
      submissionId,
      bucket: "bucket-test",
      region: "region-test",
      videoKey: `${submissionId}/video.mp4`,
      coverKey: `${submissionId}/cover.jpg`,
      credential: {},
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }));
  }

  function completionError(code: string) {
    return new Response(JSON.stringify({ code }), { status: 503 });
  }

  it("retries saving the same uploaded files without allocating three upload slots", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(uploadCredential())
      .mockResolvedValueOnce(completionError("STORAGE_VERIFICATION_FAILED"))
      .mockResolvedValueOnce(completionError("INTERNAL_ERROR"))
      .mockResolvedValueOnce(new Response("{}"));
    const user = await prepareUpload(new File(["pv"], "phone.mp4", { type: "video/mp4" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "提交 PV" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "提交 PV" }));
    expect(await screen.findByText("文件已上传，暂时无法确认，请点击重试")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "重试提交" }));
    expect(await screen.findByText("投稿保存失败，请点击重试")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "重试提交" }));
    expect(await screen.findByText("投稿已收到，等待审核")).toBeVisible();

    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/submissions/native/cos/upload-signature")).toHaveLength(1);
    const completions = fetchMock.mock.calls.filter(([url]) => url === "/api/submissions/native/complete");
    expect(completions).toHaveLength(3);
    for (const [, options] of completions) {
      expect(JSON.parse(String(options?.body)).submissionId).toBe("submission-test");
    }
    expect(putObject).toHaveBeenCalledTimes(2);
  });

  it("retries only the cover when its upload fails after the PV succeeded", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(uploadCredential())
      .mockResolvedValueOnce(new Response("{}"));
    putObject.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("Network error")).mockResolvedValueOnce({});
    const user = await prepareUpload(new File(["pv"], "phone.mp4", { type: "video/mp4" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "提交 PV" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "提交 PV" }));
    expect(await screen.findByText("网络异常，请稍后重试")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "重试提交" }));
    expect(await screen.findByText("投稿已收到，等待审核")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(putObject).toHaveBeenCalledTimes(3);
    expect(putObject.mock.calls.map(([input]) => input.Key)).toEqual([
      "submission-test/video.mp4", "submission-test/cover.jpg", "submission-test/cover.jpg",
    ]);
  });

  it("starts a new upload only after the server reports the previous one expired", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(uploadCredential("old-session"))
      .mockResolvedValueOnce(completionError("UPLOAD_SESSION_EXPIRED"))
      .mockResolvedValueOnce(uploadCredential("new-session"))
      .mockResolvedValueOnce(new Response("{}"));
    const user = await prepareUpload(new File(["pv"], "phone.mp4", { type: "video/mp4" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "提交 PV" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "提交 PV" }));
    expect(await screen.findByText("上传已过期，请重新选择文件")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "重试提交" }));
    expect(await screen.findByText("投稿已收到，等待审核")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(JSON.parse(String(fetchMock.mock.calls[3][1]?.body)).submissionId).toBe("new-session");
    expect(putObject).toHaveBeenCalledTimes(4);
  });

  it.each([
    ["", "手机.MP4", "video/mp4", false],
    ["application/octet-stream", "手机.MP4", "video/mp4", false],
    ["video/x-mp4", "手机.MP4", "video/mp4", false],
    ["video/quicktime", "IMG_2566.MP4", "video/quicktime", true],
    ["video/mp4", "IMG_2566.MP4", "video/quicktime", true],
    ["", "IMG_2566.MOV", "video/quicktime", true],
  ] as const)(
    "uses the detected container throughout upload when the browser reports %s for %s",
    async (type, name, expectedMime, quickTime) => {
      const fetchMock = vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response(JSON.stringify({
          submissionId: "submission-test",
          bucket: "bucket-test",
          region: "region-test",
          videoKey: quickTime ? "video.mov" : "video.mp4",
          coverKey: "cover.jpg",
          credential: {},
        }), { status: 200 }))
        .mockResolvedValueOnce(new Response("{}", { status: 200 }));
      const header = new Uint8Array([0,0,0,20,102,116,121,112,113,116,32,32,0,0,0,0,113,116,32,32]);
      const file = new File([quickTime ? header : "pv"], name, { type });
      const user = await prepareUpload(file);
      expect(screen.getByLabelText("PV 文件")).toHaveAttribute(
        "accept", ".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime",
      );
      await waitFor(() => expect(screen.getByRole("button", { name: "提交 PV" })).toBeEnabled());
      await user.click(screen.getByRole("button", { name: "提交 PV" }));
      await waitFor(() => expect(screen.getByText("投稿已收到，等待审核")).toBeVisible());

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0]).toEqual([
        "/api/submissions/native/cos/upload-signature",
        expect.objectContaining({ body: expect.stringContaining(JSON.stringify(expectedMime)) }),
      ]);
      expect(fetchMock.mock.calls[1]).toEqual([
        "/api/submissions/native/complete",
        expect.objectContaining({ body: expect.stringContaining(JSON.stringify(expectedMime)) }),
      ]);
      expect(putObject).toHaveBeenNthCalledWith(1, expect.objectContaining({
        Body: file,
        Key: quickTime ? "video.mov" : "video.mp4",
        ContentType: expectedMime,
      }));
      expect(putObject).toHaveBeenNthCalledWith(2, expect.objectContaining({
        ContentType: "image/jpeg",
      }));
    },
  );

  it("keeps AVI files blocked", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await prepareUpload(new File(["pv"], "手机.AVI", { type: "video/x-msvideo" }));
    expect(await screen.findByText("PV 仅支持 MP4/WebM/MOV，请选择支持的格式")).toBeVisible();
    expect(screen.getByRole("button", { name: "提交 PV" })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(putObject).not.toHaveBeenCalled();
  });
});
