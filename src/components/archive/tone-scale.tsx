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
  const dotButtonClass =
    "grid h-[18px] w-[18px] place-items-center rounded-full border border-transparent bg-transparent transition duration-200 hover:border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/90";

  return (
    <div className="flex items-center justify-end">
      <div className="flex items-center gap-3 max-md:flex-wrap" role="group" aria-label="色调预设">
        <p className="shrink-0 font-sans text-[0.68rem] tracking-[0.18em] text-subtle">色调</p>

        <div className="flex items-center gap-2">
          {hasLabels ? (
            labels.map((label, index) => {
              const isActive = index === safeValue;

              return (
                <button
                  aria-label={`切换到 ${label}`}
                  aria-pressed={isActive}
                  className={cn(
                    dotButtonClass,
                    isActive && "border-white/50",
                  )}
                  key={label}
                  onClick={() => onChange(index)}
                  type="button"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-white/15 bg-white/40"
                    style={{ opacity: 0.48 + index * 0.06 }}
                  />
                </button>
              );
            })
          ) : (
            <span className="whitespace-nowrap text-[0.78rem] text-subtle">{EMPTY_TONE_LABEL}</span>
          )}
        </div>
      </div>
    </div>
  );
}
