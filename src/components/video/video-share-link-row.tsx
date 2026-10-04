"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import CheckIcon from "@/components/icons/shared/check-circle.svg";
import AlertIcon from "@/components/icons/shared/alert-circle.svg";

export function VideoShareLinkRow({ label, url }: { label: string; url: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("error");
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }
  return (
    <div className="space-y-2 rounded-lg border border-border bg-surface p-3 sm:p-4">
      <div className="flex items-end gap-2">
        <TextField
          className="h-10 bg-panel px-3 font-mono text-xs"
          label={label}
          labelClassName="text-xs tracking-normal"
          onFocus={(event) => event.currentTarget.select()}
          readOnly
          ref={inputRef}
          value={url}
          wrapperClassName="min-w-0 flex-1"
        />
        <Button aria-label={`复制${label}`} className="shrink-0 gap-1.5" onClick={copyLink} size="md" type="button" variant={status === "copied" ? "secondary" : "primary"}>
          {status === "copied" ? <CheckIcon aria-hidden="true" className="h-4 w-4" /> : null}
          {status === "copied" ? "已复制" : "复制"}
        </Button>
      </div>
      <p aria-live="polite" className="flex items-start gap-1.5 text-xs leading-5 text-muted" role="status">
        {status === "copied" ? `${label}已复制` : null}
        {status === "error" ? <><AlertIcon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />复制失败，请长按或选中地址手动复制。</> : null}
      </p>
    </div>
  );
}
