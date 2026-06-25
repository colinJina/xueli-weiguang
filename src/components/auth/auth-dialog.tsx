"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogShell } from "@/components/ui/dialog-shell";
import { FormMessage } from "@/components/ui/form-message";
import ArrowRightIcon from "@/components/icons/auth/arrow-right.svg";
import LockIcon from "@/components/icons/auth/lock.svg";
import MailIcon from "@/components/icons/auth/mail.svg";
import AlertIcon from "@/components/icons/shared/alert-circle.svg";
import CheckIcon from "@/components/icons/shared/check-circle.svg";
import { TextField } from "@/components/ui/text-field";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth/translate-error";

type AuthMode = "login" | "register";
type RegisterStep = "credentials" | "code";

type AuthDialogProps = {
  mode: AuthMode;
  open: boolean;
  onClose: () => void;
  onSwitchMode: (next: AuthMode) => void;
  onSuccess?: () => void;
};

const AUTH_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTER_CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
const REGISTERED_EMAIL_MESSAGE = "该邮箱已注册，请改用登录方式进入。";

const registerCopy: Record<RegisterStep, { title: string; description: string }> = {
  credentials: {
    title: "创建你的档案",
    description: "使用邮箱和密码创建账号，随后输入邮箱中的验证码完成确认。",
  },
  code: {
    title: "验证邮箱",
    description: "请输入邮箱里收到的 6 位验证码，验证通过后即可完成注册。",
  },
};

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
  const [token, setToken] = useState("");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("credentials");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!open) {
      setPassword("");
      setToken("");
      setRegisterStep("credentials");
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
      setCooldownUntil(null);
    }
  }, [open]);

  useEffect(() => {
    setPassword("");
    setToken("");
    setRegisterStep("credentials");
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
    setCooldownUntil(null);
  }, [mode]);

  useEffect(() => {
    if (!cooldownUntil) {
      return;
    }
    const interval = window.setInterval(() => {
      setNowTick(Date.now());
    }, 500);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  if (!open) {
    return null;
  }

  const isRegister = mode === "register";
  const currentCopy = isRegister
    ? registerCopy[registerStep]
    : {
        title: "登录你的档案",
        description: "使用注册时填写的邮箱与密码登录，登录后即可访问推荐投稿入口。",
      };
  const cooldownSeconds = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - nowTick) / 1000))
    : 0;
  const isOnCooldown = cooldownSeconds > 0;

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
    setEmail(normalizedEmail);

    if (registerStep === "code") {
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token,
        type: "email",
      });

      if (error) {
        setErrorMessage(translateAuthError(error.message));
        setIsSubmitting(false);
        return;
      }

      if (!data.session) {
        setSuccessMessage("邮箱已验证，请使用邮箱与密码登录。");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("注册完成，正在返回。");
      setIsSubmitting(false);
      onSuccess?.();
      onClose();
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
      setRegisterStep("code");
      setToken("");
      setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      setSuccessMessage("验证码已发送，请查收邮箱（含垃圾邮件目录）。");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("注册完成，正在返回。");
    setIsSubmitting(false);
    onSuccess?.();
    onClose();
  }

  async function handleResendSignupCode() {
    if (isOnCooldown || isSubmitting) {
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage("邮箱格式不合法，请检查后重试。");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
    });

    if (error) {
      setErrorMessage(translateAuthError(error.message));
      setIsSubmitting(false);
      return;
    }

    setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
    setSuccessMessage("验证码已重新发送，请稍候查收邮箱。");
    setIsSubmitting(false);
  }

  const submitDisabled =
    isSubmitting ||
    email.length === 0 ||
    (isRegister && registerStep === "code"
      ? token.length !== REGISTER_CODE_LENGTH
      : password.length === 0);

  const submitLabel = isSubmitting
    ? "处理中…"
    : isRegister
      ? registerStep === "credentials"
        ? "发送验证码"
        : "验证验证码"
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
          disabled={isRegister && registerStep === "code"}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          type="email"
          value={email}
        />

        {!isRegister || registerStep === "credentials" ? (
          <TextField
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            icon={<LockIcon />}
            label="密码"
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === "login" ? "输入密码" : "设置至少 8 位密码"}
            type="password"
            value={password}
          />
        ) : null}

        {isRegister && registerStep === "code" ? (
          <div className="space-y-2">
            <TextField
              autoComplete="one-time-code"
              className="text-center text-lg tracking-[0.6em] placeholder:tracking-[0.3em]"
              inputMode="numeric"
              label="6 位验证码"
              maxLength={REGISTER_CODE_LENGTH}
              onChange={(event) =>
                setToken(
                  event.target.value.replace(/\D/g, "").slice(0, REGISTER_CODE_LENGTH),
                )
              }
              placeholder="000000"
              value={token}
            />
            <div className="flex items-center justify-between text-xs text-subtle">
              <span>未收到验证码？</span>
              <button
                className="inline-flex items-center gap-1 underline-offset-2 text-foreground hover:underline disabled:cursor-not-allowed disabled:text-subtle disabled:no-underline"
                disabled={isOnCooldown || isSubmitting}
                onClick={handleResendSignupCode}
                type="button"
              >
                {isOnCooldown ? `${cooldownSeconds} 秒后可重发` : "重新发送"}
              </button>
            </div>
          </div>
        ) : null}

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

