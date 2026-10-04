export type HsvColor = { hue: number; saturation: number; value: number };
export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function hsvToHex({ hue, saturation, value }: HsvColor) {
  const h = (((hue % 360) + 360) % 360) / 60;
  const s = clamp(saturation, 0, 100) / 100;
  const v = clamp(value, 0, 100) / 100;
  const c = v * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;
  const rgb =
    h < 1
      ? [c, x, 0]
      : h < 2
        ? [x, c, 0]
        : h < 3
          ? [0, c, x]
          : h < 4
            ? [0, x, c]
            : h < 5
              ? [x, 0, c]
              : [c, 0, x];
  return `#${rgb
    .map((channel) =>
      Math.round((channel + m) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}

export function hexToHsv(hex: string): HsvColor {
  const rgb = [1, 3, 5].map(
    (start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255,
  );
  const [r, g, b] = rgb;
  const max = Math.max(...rgb),
    min = Math.min(...rgb),
    delta = max - min;
  let hue = 0;
  if (delta) {
    hue =
      max === r
        ? (g - b) / delta
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return { hue, saturation: max ? (delta / max) * 100 : 0, value: max * 100 };
}
