import { describe, expect, it } from "vitest";

import { getNativeVideoMimeType } from "@/lib/storage/native-video-file";

describe("native PV file format compatibility", () => {
  it.each([
    ["PV.MP4", "", "video/mp4"],
    ["PV.MP4", "application/octet-stream", "video/mp4"],
    ["pv.mp4", "video/x-mp4", "video/mp4"],
    ["pv.mp4", "application/mp4", "video/mp4"],
    ["pv.mp4", " VIDEO/MP4; codecs=avc1 ", "video/mp4"],
    ["pv.WEBM", "", "video/webm"],
    ["pv.webm", "application/octet-stream", "video/webm"],
    ["pv.webm", "video/x-webm", "video/webm"],
    ["pv.webm", "video/webm", "video/webm"],
    ["pv", "video/mp4", "video/mp4"],
  ])("recognizes %s with browser type %s", (name, type, expected) => {
    expect(getNativeVideoMimeType({ name, type })).toBe(expected);
  });

  it.each([
    ["pv.MOV", "video/quicktime"],
    ["pv.mov", "video/mp4"],
    ["pv.avi", "video/x-msvideo"],
    ["pv.mp4", "video/quicktime"],
    ["pv.mp4", "text/plain"],
    ["pv.mp4", "video/webm"],
    ["pv.webm", "video/mp4"],
    ["pv", ""],
    ["pv.mp4.exe", "application/octet-stream"],
  ])("rejects unsupported or conflicting %s with type %s", (name, type) => {
    expect(getNativeVideoMimeType({ name, type })).toBeNull();
  });
});
