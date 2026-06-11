"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogShell } from "@/components/ui/dialog-shell";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth/translate-error";

type AuthMode = "login" | "register";

type AuthDialogProps = {
  mode: AuthMode;
  open: boolean;
  onClose: () => void;
  onSwitchMode: (next: AuthMode) => void;
  onSuccess?: () => void;
};

const AUTH_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTERED_EMAIL_MESSAGE = "该邮箱已注册，请改用登录方式进入。";

const registerCopy = {
  title: "创建你的档案",
  description: "使用邮箱和密码创建账号。如需邮箱确认，注册后请先查收确认邮件。",
};

function AlertIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 flex-none" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      <circle cx="8" cy="11.2" r="0.7" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 flex-none" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="m5.5 8 1.8 1.8L10.8 6.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <rect height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" width="12" x="2" y="3.5" />
      <path d="m2.5 4.5 5.5 4 5.5-4" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <rect height="7" rx="1.4" stroke="currentColor" strokeWidth="1.3" width="10" x="3" y="7" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16">
      <path
        d="M3 8h10m0 0-4-4m4 4-4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ModeTab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      className={active ? undefined : "hover:border-white/20"}
      onClick={onClick}
      role="tab"
      aria-selected={active}
      type="button"
      variant={active ? "pillActive" : "pill"}
      size="md"
    >
      {children}
    </Button>
  );
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return AUTH_EMAIL_PATTERN.test(value);
}

function isSupabaseObfuscatedExistingUser(
  user: { identities?: unknown[] | null } | null | undefined,
) {
  return Array.isArray(user?.identities) && user.identities.length === 0;
}

export function AuthDialog({ mode, open, onClose, onSwitchMode, onSuccess }: AuthDialogProps) {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    setPassword("");
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
  }, [mode]);

  if (!open) {
    return null;
  }

  const isRegister = mode === "register";
  const currentCopy = isRegister
    ? registerCopy
    : {
        title: "登录你的档案",
        description: "使用注册时填写的邮箱与密码登录，登录后即可访问推荐投稿入口。",
      };

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage("邮箱格式不合法，请检查后重试。");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setErrorMessage(translateAuthError(error.message));
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("登录成功，正在返回。");
    setIsSubmitting(false);
    onSuccess?.();
    onClose();
  }

  async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage("邮箱格式不合法，请检查后重试。");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setErrorMessage("密码长度过短，请使用至少 8 位密码。");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setErrorMessage(translateAuthError(error.message));
      setIsSubmitting(false);
      return;
    }

    if (isSupabaseObfuscatedExistingUser(data.user)) {
      // Supabase may return an obfuscated user for existing confirmed emails to reduce
      // account enumeration. This UI maps that documented shape to a stable business
      // hint; it is not a replacement for Supabase Auth's database-level uniqueness.
      setErrorMessage(REGISTERED_EMAIL_MESSAGE);
      setIsSubmitting(false);
      return;
    }

    if (!data.session) {
      setSuccessMessage("注册申请已提交，请查收邮箱并完成确认后再登录。");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("注册完成，正在返回。");
    setIsSubmitting(false);
    onSuccess?.();
    onClose();
  }

  const submitDisabled =
    isSubmitting ||
    email.length === 0 ||
    password.length === 0;

  const submitLabel = isSubmitting
    ? "处理中…"
    : isRegister
      ? "完成注册"
      : "登录";

  return (
    <DialogShell
      closeLabel="关闭认证弹窗"
      description={currentCopy.description}
      maxWidthClassName="max-w-[460px]"
      onClose={onClose}
      title={currentCopy.title}
    >
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="tablist" aria-label="登录或注册">
          <ModeTab active={mode === "login"} onClick={() => onSwitchMode("login")}>
            登录
          </ModeTab>
          <ModeTab active={mode === "register"} onClick={() => onSwitchMode("register")}>
            注册
          </ModeTab>
        </div>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={isRegister ? handleRegisterSubmit : handleLoginSubmit}
      >
        <TextField
          autoComplete="email"
          icon={<MailIcon />}
          label="邮箱"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          type="email"
          value={email}
        />

        <TextField
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          icon={<LockIcon />}
          label="密码"
          onChange={(event) => setPassword(event.target.value)}
          placeholder={mode === "login" ? "输入密码" : "设置至少 8 位密码"}
          type="password"
          value={password}
        />

        {errorMessage ? (
          <FormMessage icon={<AlertIcon />} variant="error">
            {errorMessage}
          </FormMessage>
        ) : null}

        {successMessage ? (
          <FormMessage icon={<CheckIcon />} variant="success">
            {successMessage}
          </FormMessage>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <Button className="w-full" disabled={submitDisabled} type="submit">
            <span className="inline-flex items-center gap-2">
              {submitLabel}
              {!isSubmitting ? <ArrowRightIcon /> : null}
            </span>
          </Button>

          {isRegister ? (
            <p className="text-xs leading-6 text-subtle">
              已有账号？
              <button
                className="ml-1 underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => onSwitchMode("login")}
                type="button"
              >
                改用登录
              </button>
            </p>
          ) : (
            <p className="text-xs leading-6 text-subtle">
              尚无账号？
              <button
                className="ml-1 underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => onSwitchMode("register")}
                type="button"
              >
                去注册
              </button>
            </p>
          )}
        </div>
      </form>
    </DialogShell>
  );
}
