// @vitest-environment jsdom
import "../../../tests/dom-setup";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeferredVideoPlayer } from "@/components/video/deferred-video-player";
import type { VideoDetail } from "@/lib/videos/types";
import { video } from "../../../tests/ui/fixtures";

const localVideo: VideoDetail = {
  ...video,
  storageProvider: "cos",
  sourceLabel: "站内 PV",
  playbackUrl: "https://media.test/pv.mp4",
};

afterEach(() => vi.restoreAllMocks());

describe("detail playback preparation", () => {
  it("preloads without playing or counting a view and reuses the element on click", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const onPlay = vi.fn();
    const view = render(<DeferredVideoPlayer onCosPlay={onPlay} preloadOnMount video={localVideo} />);
    const media = view.container.querySelector("video");
    expect(media).toHaveAttribute("preload", "auto");
    expect(media).not.toHaveAttribute("autoplay");
    expect(media).not.toHaveAttribute("controls");
    expect(play).not.toHaveBeenCalled();
    fireEvent.loadedData(media!);
    expect(onPlay).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: `播放 ${video.title}` }));
    expect(view.container.querySelector("video")).toBe(media);
    expect(play).toHaveBeenCalledOnce();
    expect(media).toHaveAttribute("controls");
    expect(screen.getByRole("button", { name: `播放 ${video.title}` })).toBeVisible();
    expect(onPlay).not.toHaveBeenCalled();
    fireEvent.playing(media!);
    expect(screen.queryByRole("button", { name: `播放 ${video.title}` })).toBeNull();
    expect(onPlay).toHaveBeenCalledOnce();
  });

  it("keeps home playback deferred and does not preload external embeds", () => {
    const view = render(<DeferredVideoPlayer video={localVideo} />);
    expect(view.container.querySelector("video")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: `播放 ${video.title}` }));
    expect(view.container.querySelector("video")).toHaveAttribute("autoplay");
    view.rerender(<DeferredVideoPlayer key="external" preloadOnMount video={video} />);
    expect(view.container.querySelector("iframe")).toBeNull();
    expect(view.container.querySelector("video")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: `播放 ${video.title}` }));
    expect(view.container.querySelector("iframe")).not.toBeNull();
  });

  it("recovers from a preload failure by mounting a fresh paused element", () => {
    const view = render(<DeferredVideoPlayer preloadOnMount video={localVideo} />);
    const failedMedia = view.container.querySelector("video");
    fireEvent.error(failedMedia!);
    expect(view.container.querySelector("video")).toBeNull();
    expect(screen.queryByRole("button", { name: `播放 ${video.title}` })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(view.container.querySelector("video")).not.toBe(failedMedia);
    expect(view.container.querySelector("video")).not.toHaveAttribute("autoplay");
    expect(screen.getByRole("button", { name: `播放 ${video.title}` })).toBeVisible();
  });

  it("offers retry when user-initiated playback is rejected", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(new Error("Playback failed"));
    render(<DeferredVideoPlayer preloadOnMount video={localVideo} />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: `播放 ${video.title}` })));
    expect(screen.getByRole("button", { name: "重试" })).toBeVisible();
  });

  it("does not let a rejected old play request break a retry", async () => {
    let reject!: (error: Error) => void;
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    const view = render(<DeferredVideoPlayer preloadOnMount video={localVideo} />);
    fireEvent.click(screen.getByRole("button", { name: `播放 ${video.title}` }));
    fireEvent.error(view.container.querySelector("video")!);
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    await act(async () => reject(new Error("Old playback failed")));
    expect(screen.queryByRole("button", { name: "重试" })).toBeNull();
    expect(screen.getByRole("button", { name: `播放 ${video.title}` })).toBeVisible();
  });
});
