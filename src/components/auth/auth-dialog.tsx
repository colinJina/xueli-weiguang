"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogShell } from "@/components/ui/dialog-shell";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth/translate-error";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";
type RegisterStep = "email" | "code" | "password";

type AuthDialogProps = {
  mode: AuthMode;
  open: boolean;
  onClose: () => void;
  onSwitchMode: (next: AuthMode) => void;
  onSuccess?: () => void;
};

const REGISTER_STEPS: RegisterStep[] = ["email", "code", "password"];
const RESEND_COOLDOWN_SECONDS = 60;

const registerCopy: Record<RegisterStep, { title: string; description: string }> = {
  email: {
    title: "创建你的档案",
    description: "输入邮箱以获取一次性验证码，完成初次身份确认。",
  },
  code: {
    title: "验证邮箱",
    description: "请输入邮箱里收到的 6 位验证码，验证通过后继续设置密码。",
  },
  password: {
    title: "设置登录密码",
    description: "为后续登录创建密码。建议使用至少 8 位的强密码。",
  },
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

function StepIndicator({ current }: { current: RegisterStep }) {
  const currentIndex = REGISTER_STEPS.indexOf(current);

  return (
    <div className="flex items-center gap-2" aria-label={`注册进度：第 ${currentIndex + 1} 步，共 3 步`}>
      {REGISTER_STEPS.map((step, index) => {
        const reached = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <span
            key={step}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              reached ? "bg-foreground" : "bg-border",
              isCurrent ? "w-8" : "w-4",
            )}
          />
        );
      })}
    </div>
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

export function AuthDialog({ mode, open, onClose, onSwitchMode, onSuccess }: AuthDialogProps) {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!open) {
      setPassword("");
      setToken("");
      setRegisterStep("email");
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
      setCooldownUntil(null);
    }
  }, [open]);

  useEffect(() => {
    setPassword("");
    setToken("");
    setRegisterStep("email");
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

  async function sendOtp(): Promise<boolean> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setErrorMessage(translateAuthError(error.message));
      return false;
    }

    setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
    return true;
  }

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
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

    if (registerStep === "email") {
      const ok = await sendOtp();
      if (ok) {
        setRegisterStep("code");
        setSuccessMessage("验证码已发送，请查收邮箱（含垃圾邮件目录）。");
      }
      setIsSubmitting(false);
      return;
    }

    if (registerStep === "code") {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (error) {
        setErrorMessage(translateAuthError(error.message));
        setIsSubmitting(false);
        return;
      }

      setRegisterStep("password");
      setSuccessMessage("验证通过，请设置登录密码。");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setErrorMessage(translateAuthError(error.message));
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("注册完成，后续可直接用邮箱与密码登录。");
    setIsSubmitting(false);
    onSuccess?.();
    onClose();
  }

  async function handleResend() {
    if (isOnCooldown || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const ok = await sendOtp();
    if (ok) {
      setSuccessMessage("验证码已重新发送，请稍候查收邮箱。");
    }
    setIsSubmitting(false);
  }

  const submitDisabled =
    isSubmitting ||
    email.length === 0 ||
    (isRegister && registerStep === "code" && token.length !== 6) ||
    ((!isRegister || registerStep === "password") && password.length === 0);

  const submitLabel = isSubmitting
    ? "处理中…"
    : isRegister
      ? registerStep === "email"
        ? "发送验证码"
        : registerStep === "code"
          ? "验证验证码"
          : "完成注册"
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
        {isRegister ? <StepIndicator current={registerStep} /> : null}
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

        {isRegister && registerStep === "code" ? (
          <div className="space-y-2">
            <TextField
              autoComplete="one-time-code"
              className="text-center text-lg tracking-[0.6em] placeholder:tracking-[0.3em]"
              inputMode="numeric"
              label="6 位验证码"
              maxLength={6}
              onChange={(event) =>
                setToken(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              value={token}
            />
            <div className="flex items-center justify-between text-xs text-subtle">
              <span>未收到验证码？</span>
              <button
                className={cn(
                  "inline-flex items-center gap-1 underline-offset-2",
                  isOnCooldown
                    ? "cursor-not-allowed text-subtle"
                    : "text-foreground hover:underline",
                )}
                disabled={isOnCooldown || isSubmitting}
                onClick={handleResend}
                type="button"
              >
                {isOnCooldown ? `${cooldownSeconds} 秒后可重发` : "重新发送"}
              </button>
            </div>
          </div>
        ) : null}

        {!isRegister || registerStep === "password" ? (
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

          {isRegister && registerStep === "email" ? (
            <p className="text-xs leading-6 text-subtle">
              已经注册过？
              <button
                className="ml-1 underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => onSwitchMode("login")}
                type="button"
              >
                改用登录
              </button>
            </p>
          ) : !isRegister ? (
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
          ) : null}
        </div>
      </form>
    </DialogShell>
  );
}
