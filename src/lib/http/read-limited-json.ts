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

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    throw new JsonRequestError("请求内容无效，请重新提交。");
  }

  if (new TextEncoder().encode(rawBody).byteLength > maxBytes) {
    throw new JsonRequestError("请求内容过大，请减少内容后重试。", 413);
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
