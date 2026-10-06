import type { UserArchiveErrorResponse } from "@/lib/user-archive/types";

export async function requestUserArchiveMutation<T>(
  input: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (init.signal?.aborted) { throw error; }
    throw new Error(fallbackMessage);
  }
  const payload = (await response.json().catch(() => null)) as
    | UserArchiveErrorResponse
    | T
    | null;

  if (!response.ok || payload === null) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? payload.message
        : fallbackMessage;

    throw new Error(message);
  }

  return payload as T;
}
