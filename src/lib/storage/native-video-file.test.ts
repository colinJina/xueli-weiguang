import { describe, expect, it } from "vitest";

import { getNativeVideoMimeType } from "@/lib/storage/native-video-file";

describe("native PV file format compatibility", () => {
  it.each([
    ["PV.MOV", "video/quicktime", "video/quicktime"],
    ["pv.mov", "", "video/quicktime"],
    ["pv.mov", "video/mp4", "video/quicktime"],
    ["IMG_2566.MP4", "video/quicktime", "video/quicktime"],
    ["pv.mov", "video/x-quicktime", "video/quicktime"],
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
    ["pv.avi", "video/x-msvideo"],
    ["pv.mov", "video/webm"],
    ["pv.mp4", "text/plain"],
    ["pv.mp4", "video/webm"],
    ["pv.webm", "video/mp4"],
    ["pv", ""],
    ["pv.mp4.exe", "application/octet-stream"],
  ])("rejects unsupported or conflicting %s with type %s", (name, type) => {
    expect(getNativeVideoMimeType({ name, type })).toBeNull();
  });
});

// The first 20 bytes of IMG_2566.MP4, without any personal metadata.
const quickTimeHeader = new Uint8Array([0,0,0,20,102,116,121,112,113,116,32,32,0,0,0,0,113,116,32,32]).buffer;
it.each(["video/mp4", "video/quicktime", "", "application/octet-stream"])("identifies identical QuickTime bytes regardless of browser label %s", (type) => {
  expect(getNativeVideoMimeType({name: "IMG_2566.MP4", type}, quickTimeHeader)).toBe("video/quicktime");
});
