"use client";

import type { User } from "@supabase/supabase-js";
import { UserMenu } from "@/components/auth/user-menu";
import LoginIcon from "@/components/icons/shared/login.svg";
import RegisterIcon from "@/components/icons/shared/user-plus.svg";
import { Button } from "@/components/ui/button";

type AccountActionsProps = {
  user: User | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogout: () => void;
};

export function AccountActions({ user, onLoginClick, onRegisterClick, onLogout }: AccountActionsProps) {
  if (user) {
    return <UserMenu user={user} onLogout={onLogout} variant="expanded" />;
  }
  return (
    <div aria-label="账户操作" className="flex shrink-0 items-center gap-2">
      <Button className="hidden gap-2 lg:inline-flex" onClick={onRegisterClick} type="button" variant="secondary">
        <RegisterIcon aria-hidden="true" className="h-5 w-5" />
        注册
      </Button>
      <Button aria-label="登录" className="h-11 gap-2 max-lg:w-11 max-lg:px-0" onClick={onLoginClick} type="button">
        <LoginIcon aria-hidden="true" className="h-5 w-5" />
        <span className="hidden lg:inline">登录</span>
      </Button>
    </div>
  );
}
