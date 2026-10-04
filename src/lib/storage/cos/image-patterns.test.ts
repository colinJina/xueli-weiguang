import { describe, expect, it } from "vitest";

import { getCosCoverImagePatterns } from "@/lib/storage/cos/image-patterns";

describe("COS cover optimization allowlist", () => {
  it("restricts the configured CDN and bucket to uploaded covers", () => {
    expect(getCosCoverImagePatterns({ COS_CDN_DOMAIN: "https://cdn.example.com/assets/", COS_BUCKET: "test-123", COS_REGION: "ap-test" }))
      .toEqual([
        { protocol: "https", hostname: "cdn.example.com", port: "", pathname: "/assets/submissions/*/*/cover.*", search: "" },
        { protocol: "https", hostname: "cdn.example.com", port: "", pathname: "/assets/videos/*/cover.*", search: "" },
        { protocol: "https", hostname: "test-123.cos.ap-test.myqcloud.com", port: "", pathname: "/submissions/*/*/cover.*", search: "" },
        { protocol: "https", hostname: "test-123.cos.ap-test.myqcloud.com", port: "", pathname: "/videos/*/cover.*", search: "" },
      ]);
  });

  it("matches the public URL resolver's HTTPS upgrade and host-only configuration", () => {
    for (const COS_CDN_DOMAIN of ["cdn.example.com", "http://cdn.example.com"]) {
      expect(getCosCoverImagePatterns({ COS_CDN_DOMAIN })[0]).toMatchObject({ protocol: "https", hostname: "cdn.example.com" });
    }
  });

  it("does not allow arbitrary COS hosts when configuration is absent", () => {
    expect(getCosCoverImagePatterns({})).toEqual([]);
  });

  it.each(["ftp://cdn.example.com", "https://**.example.com", "https://user:pass@cdn.example.com", "https://cdn.example.com?token=secret", "https://cdn.example.com#hash", "https://"])(
    "ignores malformed or non-public CDN configuration: %s", (COS_CDN_DOMAIN) => {
      expect(getCosCoverImagePatterns({ COS_CDN_DOMAIN })).toEqual([]);
    },
  );
});
