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
    <button className="archive-submit-button" onClick={handleClick} type="button">
      <span aria-hidden="true" className="archive-submit-button__plus">
        +
      </span>
      <span>推荐投稿</span>
    </button>
  );
}
