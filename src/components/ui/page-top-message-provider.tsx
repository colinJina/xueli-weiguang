"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  PageTopMessage,
  type PageTopMessagePayload,
} from "@/components/ui/page-top-message";

type ShowPageTopMessageInput = {
  actionLabel?: string;
  durationMs?: number | null;
  icon?: ReactNode;
  onClick?: () => void;
  text: string;
};

type PageTopMessageContextValue = {
  dismissMessage: () => void;
  showMessage: (input: ShowPageTopMessageInput) => void;
};

const PAGE_TOP_MESSAGE_DURATION_MS = 2600;

const PageTopMessageContext = createContext<PageTopMessageContextValue | null>(
  null,
);

export function PageTopMessageProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<PageTopMessagePayload | null>(null);
  const nextIdRef = useRef(1);

  const dismissMessage = useCallback(() => setMessage(null), []);

  const dismissCurrentMessage = useCallback((id: number) => {
    setMessage((current) => (current?.id === id ? null : current));
  }, []);

  const showMessage = useCallback(
    ({
      durationMs = PAGE_TOP_MESSAGE_DURATION_MS,
      actionLabel,
      icon,
      onClick,
      text,
    }: ShowPageTopMessageInput) => {
      const nextMessage = {
        actionLabel,
        durationMs,
        id: nextIdRef.current++,
        icon,
        onClick,
        text,
      };

      setMessage(nextMessage);
    },
    [],
  );

  const value = useMemo<PageTopMessageContextValue>(
    () => ({
      dismissMessage,
      showMessage,
    }),
    [dismissMessage, showMessage],
  );

  return (
    <PageTopMessageContext.Provider value={value}>
      {children}
      <PageTopMessage message={message} onDismiss={dismissCurrentMessage} />
    </PageTopMessageContext.Provider>
  );
}

export function usePageTopMessage() {
  const context = useContext(PageTopMessageContext);

  if (!context) {
    throw new Error(
      "usePageTopMessage must be used within a PageTopMessageProvider.",
    );
  }

  return context;
}
