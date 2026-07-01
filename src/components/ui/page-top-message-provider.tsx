"use client";

import {
  createContext,
  useEffect,
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
  durationMs?: number;
  icon?: ReactNode;
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

export function PageTopMessageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [message, setMessage] = useState<PageTopMessagePayload | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const nextIdRef = useRef(1);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const dismissMessage = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setMessage(null);
  }, []);

  const showMessage = useCallback(
    ({
      durationMs = PAGE_TOP_MESSAGE_DURATION_MS,
      icon,
      text,
    }: ShowPageTopMessageInput) => {
      dismissMessage();

      const nextMessage = {
        id: nextIdRef.current++,
        icon,
        text,
      };

      setMessage(nextMessage);
      timeoutRef.current = window.setTimeout(() => {
        setMessage((current) =>
          current?.id === nextMessage.id ? null : current,
        );
        timeoutRef.current = null;
      }, durationMs);
    },
    [dismissMessage],
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
      <PageTopMessage message={message} onDismiss={dismissMessage} />
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
