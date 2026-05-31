"use client";

type ArchiveSubmitTriggerProps = {
  isAuthenticated: boolean;
  onRequestLogin: () => void;
  onRequestSubmit: () => void;
};

export function ArchiveSubmitTrigger({
  isAuthenticated,
  onRequestLogin,
  onRequestSubmit,
}: ArchiveSubmitTriggerProps) {
  function handleClick() {
    if (isAuthenticated) {
      onRequestSubmit();
      return;
    }

    onRequestLogin();
  }

  return (
    <button
      className="inline-flex min-h-[42px] items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.08] px-[18px] text-base font-bold text-foreground transition duration-200 hover:border-white/15 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/90"
      onClick={handleClick}
      type="button"
    >
      <span aria-hidden="true" className="text-[1.35rem] leading-none">
        +
      </span>
      <span>推荐投稿</span>
    </button>
  );
}
