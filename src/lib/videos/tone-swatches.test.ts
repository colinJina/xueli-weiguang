import { describe, expect, it } from "vitest";

import {
  formatTonePercentage,
  getToneSwatchDiameter,
  getVisibleVideoTones,
  normalizeTonePercentage,
} from "@/lib/videos/tone-swatches";
import type { VideoToneItem } from "@/lib/videos/types";

function tone(id: string, percentage: number | null): VideoToneItem {
  return { id, name: id, colorHex: "#CFA0A9", percentage };
}

describe("video tone swatches", () => {
  it("reads decimal ratios and preserves a recorded zero", () => {
    expect(normalizeTonePercentage("0.2671")).toBe(0.2671);
    expect(normalizeTonePercentage(0)).toBe(0);
    expect(normalizeTonePercentage("0")).toBe(0);
    expect(normalizeTonePercentage(1)).toBe(1);
  });

  it.each([null, undefined, "", " ", "invalid", NaN, Infinity, -0.1, 1.1])(
    "treats %s as unrecorded instead of inventing an occupancy",
    (value) => {
      expect(normalizeTonePercentage(value)).toBeNull();
    },
  );

  it("selects the largest five shares before truncating, without mutating the source", () => {
    const tones = [
      tone("unrecorded", null),
      tone("small", 0.01),
      tone("medium", 0.12),
      tone("large", 0.4),
      tone("second", 0.2),
      tone("third", 0.15),
      { ...tone("no-color", 1), colorHex: undefined },
    ];
    const original = tones.map((item) => ({ ...item }));

    expect(getVisibleVideoTones(tones).map((item) => item.id)).toEqual([
      "large", "second", "third", "medium", "small",
    ]);
    expect(tones).toEqual(original);
  });

  it("preserves stored order for ties and places missing shares after a recorded zero", () => {
    expect(getVisibleVideoTones([
      tone("missing-first", null),
      tone("tie-first", 0.2),
      tone("zero", 0),
      tone("tie-later", 0.2),
      tone("missing-later", null),
    ]).map((item) => item.id)).toEqual([
      "tie-first", "tie-later", "zero", "missing-first", "missing-later",
    ]);
  });

  it("keeps circles bounded and nondecreasing as the share increases", () => {
    const diameters = [0, 0.03, 0.08, 0.12, 0.5, 1].map(getToneSwatchDiameter);
    expect(getToneSwatchDiameter(null)).toBe(diameters[0]);
    expect(diameters[0]).toBeGreaterThanOrEqual(7);
    expect(diameters.at(-1)).toBeLessThanOrEqual(14);
    expect(diameters[3]).toBeGreaterThan(diameters[0]);
    for (let index = 1; index < diameters.length; index += 1) {
      expect(diameters[index]).toBeGreaterThanOrEqual(diameters[index - 1]);
    }
  });

  it("rounds the stored percentage like PVDex without renormalizing", () => {
    expect(formatTonePercentage(0.2671)).toBe("27%");
    expect(formatTonePercentage(0.5)).toBe("50%");
    expect(formatTonePercentage(0)).toBe("0%");
    expect(formatTonePercentage(null)).toBe("占比未记录");
  });
});
