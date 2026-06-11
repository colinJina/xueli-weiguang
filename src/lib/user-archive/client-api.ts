import type { UserArchiveErrorResponse } from "@/lib/user-archive/types";

export async function requestUserArchiveMutation<T>(
  input: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | UserArchiveErrorResponse
    | T
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? payload.message
        : fallbackMessage;

    throw new Error(message);
  }

  return payload as T;
}
