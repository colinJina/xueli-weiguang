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
  it.each(["", "application/octet-stream", "video/x-mp4"])(
    "uses standard MP4 throughout upload when the browser reports %s",
    async (type) => {
      const fetchMock = vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response(JSON.stringify({
          submissionId: "submission-test",
          bucket: "bucket-test",
          region: "region-test",
          videoKey: "video.mp4",
          coverKey: "cover.jpg",
          credential: {},
        }), { status: 200 }))
        .mockResolvedValueOnce(new Response("{}", { status: 200 }));
      const file = new File(["pv"], "手机.MP4", { type });
      const user = await prepareUpload(file);
      expect(screen.getByLabelText("PV 文件")).toHaveAttribute(
        "accept", ".mp4,.webm,video/mp4,video/webm",
      );
      expect(screen.getByRole("button", { name: "提交 PV" })).toBeEnabled();
      await user.click(screen.getByRole("button", { name: "提交 PV" }));
      await waitFor(() => expect(screen.getByText("投稿已收到，等待审核")).toBeVisible());

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0]).toEqual([
        "/api/submissions/native/cos/upload-signature",
        expect.objectContaining({ body: expect.stringContaining('"videoMimeType":"video/mp4"') }),
      ]);
      expect(fetchMock.mock.calls[1]).toEqual([
        "/api/submissions/native/complete",
        expect.objectContaining({ body: expect.stringContaining('"videoMimeType":"video/mp4"') }),
      ]);
      expect(putObject).toHaveBeenNthCalledWith(1, expect.objectContaining({
        Body: file,
        ContentType: "video/mp4",
      }));
      expect(putObject).toHaveBeenNthCalledWith(2, expect.objectContaining({
        ContentType: "image/jpeg",
      }));
    },
  );

  it("keeps MOV files blocked and asks for a format conversion", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await prepareUpload(new File(["pv"], "手机.MOV", { type: "video/quicktime" }));
    expect(screen.getByText("PV 仅支持 MP4/WebM，请先转换格式后再上传")).toBeVisible();
    expect(screen.getByRole("button", { name: "提交 PV" })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(putObject).not.toHaveBeenCalled();
  });
});
