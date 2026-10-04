"use client";

import type { KeyboardEvent, PointerEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { TextField } from "@/components/ui/text-field";
import { RangeField } from "@/components/ui/range-field";
import { clamp, hexToHsv, hsvToHex } from "@/lib/videos/color-picker";
import type { HsvColor } from "@/lib/videos/color-picker";
import { normalizeToneColorHex } from "@/lib/videos/tone-options";
import type { ColorTarget } from "@/lib/videos/types";

type Props = {
  color: ColorTarget;
  onChange: (color: ColorTarget, final: boolean) => void;
};

export function ArchiveColorPicker({ color, onChange }: Props) {
  const [hsv, setHsv] = useState(() => hexToHsv(color.hex));
  const hsvRef = useRef(hsv);
  const lastEmitted = useRef(color.hex);
  const [draftHex, setDraftHex] = useState(color.hex);
  const id = useId();
  const normalized = normalizeToneColorHex(
    draftHex.startsWith("#") ? draftHex : `#${draftHex}`,
  );

  useEffect(() => {
    if (color.hex !== lastEmitted.current) {
      const next = hexToHsv(color.hex);
      hsvRef.current = next;
      setHsv(next);
    }
    setDraftHex(color.hex);
  }, [color.hex]);

  function emitHsv(next: HsvColor, final: boolean) {
    hsvRef.current = next;
    setHsv(next);
    const hex = hsvToHex(next);
    lastEmitted.current = hex;
    setDraftHex(hex);
    onChange({ ...color, hex }, final);
  }

  function updateFromPointer(
    event: PointerEvent<HTMLDivElement>,
    final: boolean,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    emitHsv(
      {
        ...hsvRef.current,
        saturation: clamp(
          ((event.clientX - rect.left) / rect.width) * 100,
          0,
          100,
        ),
        value: clamp(
          100 - ((event.clientY - rect.top) / rect.height) * 100,
          0,
          100,
        ),
      },
      final,
    );
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1;
    const next = { ...hsvRef.current };
    switch (event.key) {
      case "ArrowLeft":
        next.saturation -= step;
        break;
      case "ArrowRight":
        next.saturation += step;
        break;
      case "ArrowUp":
        next.value += step;
        break;
      case "ArrowDown":
        next.value -= step;
        break;
      case "Home":
        next.saturation = 0;
        break;
      case "End":
        next.saturation = 100;
        break;
      default:
        return;
    }
    event.preventDefault();
    emitHsv(
      {
        ...next,
        saturation: clamp(next.saturation, 0, 100),
        value: clamp(next.value, 0, 100),
      },
      true,
    );
  }

  return (
    <div className="space-y-4">
      <div
        aria-describedby={`${id}-help`}
        aria-label="饱和度与亮度取色区域"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.saturation)}
        aria-valuetext={`饱和度 ${Math.round(hsv.saturation)}%，亮度 ${Math.round(hsv.value)}%，${color.hex}`}
        className="relative h-44 w-full touch-none rounded-md border border-borderStrong outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        onKeyDown={handleKeys}
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event, false);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            updateFromPointer(event, false);
          }
        }}
        onPointerUp={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
            return;
          }
          updateFromPointer(event, true);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() =>
          onChange({ ...color, hex: hsvToHex(hsvRef.current) }, true)
        }
        role="slider"
        tabIndex={0}
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${hsv.hue} 100% 50%)`,
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_#000]"
          style={{ left: `${hsv.saturation}%`, top: `${100 - hsv.value}%` }}
        />
      </div>
      <p className="text-[11px] leading-5 text-subtle" id={`${id}-help`}>
        方向键调整饱和度与亮度，按住 Shift 大步调整。
      </p>
      <RangeField
        label="色相"
        max={359}
        min={0}
        value={Math.round(hsv.hue)}
        valueLabel={`${Math.round(hsv.hue)}°`}
        trackStyle={{
          background:
            "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
        }}
        onValueChange={(hue) => emitHsv({ ...hsvRef.current, hue }, false)}
        onValueCommit={(hue) => emitHsv({ ...hsvRef.current, hue }, true)}
      />
      <TextField
        aria-describedby={!normalized ? `${id}-hex-error` : undefined}
        aria-invalid={!normalized}
        autoComplete="off"
        className="font-mono"
        label="HEX 色值"
        maxLength={7}
        placeholder="#CF3030"
        spellCheck={false}
        value={draftHex}
        onChange={(event) => {
          const value = event.target.value.toUpperCase();
          setDraftHex(value);
          const hex = normalizeToneColorHex(
            value.startsWith("#") ? value : `#${value}`,
          );
          if (hex) {
            lastEmitted.current = hex;
            const next = hexToHsv(hex);
            hsvRef.current = next;
            setHsv(next);
            onChange({ ...color, hex }, false);
          }
        }}
        onBlur={() => {
          if (normalized) {
            onChange({ ...color, hex: normalized }, true);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && normalized) {
            onChange({ ...color, hex: normalized }, true);
          }
        }}
      />
      {!normalized ? (
        <p className="text-xs text-muted" id={`${id}-hex-error`} role="alert">
          请输入完整的六位 HEX 色值。
        </p>
      ) : null}
      <RangeField
        label="精度"
        min={1}
        max={100}
        value={color.precision}
        valueLabel={`${color.precision} / 100`}
        onValueChange={(precision) => onChange({ ...color, precision }, false)}
        onValueCommit={(precision) => onChange({ ...color, precision }, true)}
      />
      <p className="text-xs leading-5 text-subtle">
        精度越高，颜色越接近；调整后作品会实时更新。
      </p>
    </div>
  );
}
