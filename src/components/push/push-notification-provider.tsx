"use client";

import type { Workbox } from "workbox-window";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import BellIcon from "@/components/icons/home/bell.svg";
import AlertIcon from "@/components/icons/shared/alert-circle.svg";
import CheckIcon from "@/components/icons/shared/check-circle.svg";
import SpinnerIcon from "@/components/icons/shared/spinner-16.svg";
import { Button } from "@/components/ui/button";
import { DialogShell } from "@/components/ui/dialog-shell";
import { usePageTopMessage } from "@/components/ui/page-top-message-provider";

type PushNotificationContextValue = {
  closeDialog: () => void;
  enabled: boolean;
  isBusy: boolean;
  isReady: boolean;
  isSubscribed: boolean;
  openDialog: () => void;
  permission: NotificationPermission | "unsupported";
};

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PUSH_FEATURE_ENABLED =
  process.env.NEXT_PUBLIC_PUSH_ENABLED === "true" &&
  VAPID_PUBLIC_KEY.length > 0;

const PushNotificationContext =
  createContext<PushNotificationContextValue | null>(null);

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const { showMessage } = usePageTopMessage();
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReady, setIsReady] = useState(!PUSH_FEATURE_ENABLED);
  const [requiresIosInstall, setRequiresIosInstall] = useState(false);
  const refreshRequestedRef = useRef(false);

  useEffect(() => {
    if (!PUSH_FEATURE_ENABLED) {
      return;
    }

    if (!supportsBrowserPush()) {
      setPermission("unsupported");
      setIsReady(true);
      return;
    }

    let disposed = false;
    let workbox: Workbox | null = null;

    const handleWaiting = () => {
      if (!workbox) {
        return;
      }

      showMessage({
        actionLabel: "刷新并应用新版本",
        durationMs: null,
        onClick: () => {
          refreshRequestedRef.current = true;
          workbox?.messageSkipWaiting();
        },
        text: "新版本已就绪，点击刷新",
      });
    };
    const handleControlling = () => {
      if (refreshRequestedRef.current) {
        window.location.reload();
      }
    };

    void (async () => {
      try {
        const { Workbox: WorkboxConstructor } = await import("workbox-window");

        if (disposed) {
          return;
        }

        workbox = new WorkboxConstructor("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        workbox.addEventListener("waiting", handleWaiting);
        workbox.addEventListener("controlling", handleControlling);

        await workbox.register();
        const registration = await navigator.serviceWorker.ready;
        let currentSubscription = await registration.pushManager.getSubscription();
        const currentPermission = Notification.permission;

        if (currentPermission === "denied" && currentSubscription) {
          const endpoint = currentSubscription.endpoint;
          await currentSubscription.unsubscribe();
          await revokeSubscription(endpoint).catch(() => undefined);
          currentSubscription = null;
        } else if (currentPermission === "granted" && currentSubscription) {
          await persistSubscription(currentSubscription).catch(() => undefined);
        }

        if (!disposed) {
          setPermission(currentPermission);
          setSubscription(currentSubscription);
          setRequiresIosInstall(isIosWithoutHomeScreenInstall());
        }
      } catch {
        if (!disposed) {
          setPermission("unsupported");
        }
      } finally {
        if (!disposed) {
          setIsReady(true);
        }
      }
    })();

    return () => {
      disposed = true;
      if (workbox) {
        workbox.removeEventListener("waiting", handleWaiting);
        workbox.removeEventListener("controlling", handleControlling);
      }
    };
  }, [showMessage]);

  const openDialog = useCallback(() => setIsDialogOpen(true), []);
  const closeDialog = useCallback(() => {
    if (!isBusy) {
      setIsDialogOpen(false);
    }
  }, [isBusy]);

  const enableNotifications = useCallback(async () => {
    if (
      isBusy ||
      !supportsBrowserPush() ||
      isIosWithoutHomeScreenInstall()
    ) {
      return;
    }

    setIsBusy(true);

    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      const nextSubscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          userVisibleOnly: true,
        }));

      try {
        await persistSubscription(nextSubscription);
      } catch (error) {
        if (!existingSubscription) {
          await nextSubscription.unsubscribe();
        }
        throw error;
      }

      setSubscription(nextSubscription);
      setIsDialogOpen(false);
      showMessage({
        icon: <CheckIcon aria-hidden="true" />,
        text: "新 PV 通知已开启",
      });
    } catch {
      showMessage({
        icon: <AlertIcon aria-hidden="true" />,
        text: "通知开启失败，请稍后重试",
      });
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, showMessage]);

  const disableNotifications = useCallback(async () => {
    if (isBusy || !subscription) {
      return;
    }

    setIsBusy(true);
    const endpoint = subscription.endpoint;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      setIsDialogOpen(false);
      await revokeSubscription(endpoint).catch(() => undefined);
      showMessage({ text: "新 PV 通知已关闭" });
    } catch {
      showMessage({
        icon: <AlertIcon aria-hidden="true" />,
        text: "通知关闭失败，请稍后重试",
      });
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, showMessage, subscription]);

  const value = useMemo<PushNotificationContextValue>(
    () => ({
      closeDialog,
      enabled: PUSH_FEATURE_ENABLED,
      isBusy,
      isReady,
      isSubscribed: Boolean(subscription),
      openDialog,
      permission,
    }),
    [closeDialog, isBusy, isReady, openDialog, permission, subscription],
  );

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
      {PUSH_FEATURE_ENABLED && isDialogOpen ? (
        <PushNotificationDialog
          isBusy={isBusy}
          isReady={isReady}
          isSubscribed={Boolean(subscription)}
          onClose={closeDialog}
          onDisable={disableNotifications}
          onEnable={enableNotifications}
          permission={permission}
          requiresIosInstall={requiresIosInstall}
        />
      ) : null}
    </PushNotificationContext.Provider>
  );
}

export function usePushNotifications() {
  const context = useContext(PushNotificationContext);

  if (!context) {
    throw new Error(
      "usePushNotifications must be used within PushNotificationProvider.",
    );
  }

  return context;
}

function PushNotificationDialog({
  isBusy,
  isReady,
  isSubscribed,
  onClose,
  onDisable,
  onEnable,
  permission,
  requiresIosInstall,
}: {
  isBusy: boolean;
  isReady: boolean;
  isSubscribed: boolean;
  onClose: () => void;
  onDisable: () => void;
  onEnable: () => void;
  permission: NotificationPermission | "unsupported";
  requiresIosInstall: boolean;
}) {
  const state = getDialogState({
    isReady,
    isSubscribed,
    permission,
    requiresIosInstall,
  });

  return (
    <DialogShell
      closeLabel="关闭通知设置"
      description="只在新 PV 正式公开时提醒，不会推送待审核投稿"
      onClose={onClose}
      title="新 PV 通知"
    >
      <div className="space-y-5 pt-5">
        <div className="flex items-start gap-4 rounded-lg border border-border bg-surface px-4 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-borderStrong bg-panel text-foreground">
            <BellIcon aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-foreground">{state.title}</p>
            <p className="text-sm leading-6 text-muted">{state.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={onClose} type="button" variant="secondary">
            {state.closeLabel}
          </Button>
          {state.action === "enable" ? (
            <Button disabled={isBusy || !isReady} onClick={onEnable} type="button">
              {isBusy ? (
                <SpinnerIcon aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <BellIcon aria-hidden="true" className="h-4 w-4" />
              )}
              <span>{isBusy ? "正在开启" : "开启通知"}</span>
            </Button>
          ) : null}
          {state.action === "disable" ? (
            <Button disabled={isBusy} onClick={onDisable} type="button">
              {isBusy ? (
                <SpinnerIcon aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <BellIcon aria-hidden="true" className="h-4 w-4" />
              )}
              <span>{isBusy ? "正在关闭" : "关闭通知"}</span>
            </Button>
          ) : null}
        </div>
      </div>
    </DialogShell>
  );
}

function getDialogState({
  isReady,
  isSubscribed,
  permission,
  requiresIosInstall,
}: {
  isReady: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | "unsupported";
  requiresIosInstall: boolean;
}) {
  if (!isReady) {
    return {
      action: "none" as const,
      closeLabel: "稍后",
      description: "正在确认当前浏览器的通知状态",
      title: "正在准备通知",
    };
  }

  if (permission === "unsupported") {
    return {
      action: "none" as const,
      closeLabel: "知道了",
      description: "请使用支持通知的新版 Chrome、Edge、Firefox 或 Safari",
      title: "当前浏览器不支持通知",
    };
  }

  if (requiresIosInstall) {
    return {
      action: "none" as const,
      closeLabel: "知道了",
      description: "请先通过浏览器分享菜单添加到主屏幕，再从主屏幕打开雪笠微光",
      title: "需要先添加到主屏幕",
    };
  }

  if (permission === "denied") {
    return {
      action: "none" as const,
      closeLabel: "知道了",
      description: "浏览器已经阻止通知，请在地址栏的站点设置中重新允许通知",
      title: "通知权限已被关闭",
    };
  }

  if (isSubscribed) {
    return {
      action: "disable" as const,
      closeLabel: "保持开启",
      description: "当前浏览器会在新 PV 首次公开后收到一条系统通知",
      title: "通知已开启",
    };
  }

  return {
    action: "enable" as const,
    closeLabel: "稍后",
    description: "点击开启后，浏览器会询问系统通知权限，你可以随时回来关闭",
    title: "及时看到新 PV",
  };
}

function supportsBrowserPush() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function isIosWithoutHomeScreenInstall() {
  const navigatorWithStandalone = navigator as NavigatorWithStandalone;
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone =
    navigatorWithStandalone.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;

  return isIos && !isStandalone;
}

async function persistSubscription(
  subscription: PushSubscription,
  previousEndpoint?: string,
) {
  const serialized = subscription.toJSON();

  if (!serialized.endpoint || !serialized.keys) {
    throw new Error("Browser returned an incomplete push subscription.");
  }

  const response = await fetch("/api/push/subscriptions", {
    body: JSON.stringify({
      endpoint: serialized.endpoint,
      expirationTime: serialized.expirationTime ?? null,
      keys: serialized.keys,
      previousEndpoint,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to persist push subscription.");
  }
}

async function revokeSubscription(endpoint: string) {
  const response = await fetch("/api/push/subscriptions", {
    body: JSON.stringify({ endpoint }),
    headers: { "Content-Type": "application/json" },
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to revoke push subscription.");
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(rawData.length));

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output;
}
