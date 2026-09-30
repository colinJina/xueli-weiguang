export class JsonRequestError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "JsonRequestError";
    this.status = status;
  }
}

function getContentLength(request: Request) {
  const value = request.headers.get("content-length");

  if (!value) {
    return null;
  }

  const contentLength = Number(value);
  return Number.isSafeInteger(contentLength) && contentLength >= 0
    ? contentLength
    : null;
}

export async function readLimitedJsonObject(
  request: Request,
  maxBytes: number,
): Promise<Record<string, unknown>> {
  const contentLength = getContentLength(request);

  if (contentLength !== null && contentLength > maxBytes) {
    throw new JsonRequestError("请求内容过大，请减少内容后重试。", 413);
  }

  const reader = request.body?.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let rawBody = "";
  let receivedBytes = 0;

  try {
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        receivedBytes += value.byteLength;

        if (receivedBytes > maxBytes) {
          await reader.cancel().catch(() => undefined);
          throw new JsonRequestError("请求内容过大，请减少内容后重试。", 413);
        }

        rawBody += decoder.decode(value, { stream: true });
      }

      rawBody += decoder.decode();
    }
  } catch (error) {
    if (error instanceof JsonRequestError) {
      throw error;
    }

    throw new JsonRequestError("请求内容无效，请重新提交。");
  } finally {
    reader?.releaseLock();
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new JsonRequestError("请求内容无效，请重新提交。");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new JsonRequestError("请求内容无效，请重新提交。");
  }

  return payload as Record<string, unknown>;
}
