"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session, User, UserResponse } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

export type AuthDialogMode = "login" | "register";

const USER_CACHE_KEY = "xlwg:cached-user";

function readCachedUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(USER_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function writeCachedUser(user: User | null) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (user) {
      window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_CACHE_KEY);
    }
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded). Ignore.
  }
}

export function useAuth() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [dialogMode, setDialogMode] = useState<AuthDialogMode | null>(null);

  useEffect(() => {
    let mounted = true;

    // 乐观渲染：首次挂载先用 localStorage 缓存的用户填充 UI，避免"未登录闪一下"
    const cached = readCachedUser();
    if (cached) {
      setUser(cached);
      setIsReady(true);
    }

    // 真实校验：用 Supabase 验证当前 session，覆盖乐观值
    void supabase.auth.getUser().then(({ data }: UserResponse) => {
      if (!mounted) {
        return;
      }
      const next = data.user ?? null;
      setUser(next);
      setIsReady(true);
      writeCachedUser(next);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (!mounted) {
        return;
      }
      const next = session?.user ?? null;
      setUser(next);
      setIsReady(true);
      writeCachedUser(next);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    writeCachedUser(null);
  }, [supabase]);

  const openLogin = useCallback(() => setDialogMode("login"), []);
  const openRegister = useCallback(() => setDialogMode("register"), []);
  const closeDialog = useCallback(() => setDialogMode(null), []);
  const switchMode = useCallback((next: AuthDialogMode) => setDialogMode(next), []);

  return {
    user,
    isReady,
    isAuthenticated: Boolean(user),
    logout,
    dialogMode,
    openLogin,
    openRegister,
    closeDialog,
    switchMode,
  };
}
