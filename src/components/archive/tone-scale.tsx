import { cn } from "@/lib/utils";

type ToneScaleProps = {
  labels: readonly string[];
  value: number;
  onChange: (value: number) => void;
};

const EMPTY_TONE_LABEL = "未设置";

export function ToneScale({ labels, value, onChange }: ToneScaleProps) {
  const hasLabels = labels.length > 0;
  const lastIndex = hasLabels ? labels.length - 1 : 0;
  const safeValue = hasLabels ? Math.min(Math.max(value, 0), lastIndex) : 0;
  const leftLabel = hasLabels ? labels[0] : EMPTY_TONE_LABEL;
  const rightLabel = hasLabels ? labels[lastIndex] : EMPTY_TONE_LABEL;

  return (
    <div className="archive-tone-scale">
      <div className="archive-tone-scale__dots" role="group" aria-label="色调预设">
        <p className="archive-tone-scale__label">色调</p>

        <div className="archive-tone-scale__dot-list">
          {hasLabels ? (
            labels.map((label, index) => {
              const isActive = index === safeValue;

              return (
                <button
                  aria-label={`切换到 ${label}`}
                  aria-pressed={isActive}
                  className={cn(
                    "archive-tone-scale__dot",
                    isActive && "archive-tone-scale__dot--active",
                  )}
                  key={label}
                  onClick={() => onChange(index)}
                  type="button"
                >
                  <span
                    className="archive-tone-scale__dot-core"
                    style={{ opacity: 0.48 + index * 0.06 }}
                  />
                </button>
              );
            })
          ) : (
            <span className="archive-tone-scale__empty">{EMPTY_TONE_LABEL}</span>
          )}
        </div>
      </div>

      <div className="archive-tone-scale__range-wrap">
        <span className="archive-tone-scale__edge">{leftLabel}</span>
        <input
          aria-label="色调范围"
          className="archive-range archive-range--compact"
          disabled={!hasLabels}
          max={lastIndex}
          min={0}
          onChange={(event) => onChange(Number(event.target.value))}
          step={1}
          type="range"
          value={safeValue}
        />
        <span className="archive-tone-scale__edge">{rightLabel}</span>
      </div>
    </div>
  );
}
