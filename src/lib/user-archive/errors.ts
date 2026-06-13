import type { UserArchiveErrorCode } from "@/lib/user-archive/types";
import {
  COLLECTION_ITEM_PER_COLLECTION_LIMIT,
  TAGS_PER_ITEM_LIMIT,
  USER_COLLECTION_ITEM_LIMIT,
  USER_COLLECTION_LIMIT,
  USER_COLLECTION_TAG_LIMIT,
} from "@/lib/user-archive/limits";

type UserArchiveErrorInput = {
  code: UserArchiveErrorCode;
  message: string;
  status: number;
  fields?: Record<string, string>;
};

export class UserArchiveError extends Error {
  readonly code: UserArchiveErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(input: UserArchiveErrorInput) {
    super(input.message);
    this.name = "UserArchiveError";
    this.code = input.code;
    this.status = input.status;
    this.fields = input.fields;
  }
}

export function unauthenticatedError() {
  return new UserArchiveError({
    code: "UNAUTHENTICATED",
    message: "请先登录后再打开我的档案。",
    status: 401,
  });
}

export function validationError(message: string, fields?: Record<string, string>) {
  return new UserArchiveError({
    code: "VALIDATION_FAILED",
    message,
    status: 400,
    fields,
  });
}

export function notFoundError(message = "没有找到对应的档案资源。") {
  return new UserArchiveError({
    code: "NOT_FOUND",
    message,
    status: 404,
  });
}

export function conflictError(message: string) {
  return new UserArchiveError({
    code: "CONFLICT",
    message,
    status: 409,
  });
}

export function limitExceededError(message: string, status = 400) {
  return new UserArchiveError({
    code: "LIMIT_EXCEEDED",
    message,
    status,
  });
}

export function forbiddenError(message = "没有权限访问该档案资源。") {
  return new UserArchiveError({
    code: "FORBIDDEN",
    message,
    status: 403,
  });
}

export function databaseUnavailableError(message = "档案服务暂时不可用，请稍后重试。") {
  return new UserArchiveError({
    code: "DATABASE_UNAVAILABLE",
    message,
    status: 503,
  });
}

export function mapDatabaseError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return databaseUnavailableError();
  }

  const message = (error.message ?? "").toLowerCase();

  switch (error.code) {
    case "23505":
      return conflictError("同名资源或重复收藏已经存在。");
    case "23514":
      if (message.includes("user_collection_limit_exceeded")) {
        return limitExceededError(`收藏夹最多只能创建 ${USER_COLLECTION_LIMIT} 个。`);
      }
      if (message.includes("user_collection_tag_limit_exceeded")) {
        return limitExceededError(`标签最多只能创建 ${USER_COLLECTION_TAG_LIMIT} 个。`);
      }
      if (message.includes("user_collection_item_limit_exceeded")) {
        return limitExceededError(`最多只能收藏 ${USER_COLLECTION_ITEM_LIMIT} 条视频。`);
      }
      if (message.includes("collection_item_per_collection_limit_exceeded")) {
        return limitExceededError(
          `单个收藏夹最多只能收藏 ${COLLECTION_ITEM_PER_COLLECTION_LIMIT} 条视频。`,
        );
      }
      if (message.includes("at most 10 tags")) {
        return limitExceededError(`单条收藏最多只能绑定 ${TAGS_PER_ITEM_LIMIT} 个标签。`);
      }
      return validationError("档案内容不符合保存规则，请检查后重试。");
    case "22023":
      return validationError("档案内容不符合保存规则，请检查后重试。");
    case "23503":
    case "P0002":
    case "PGRST116":
      return notFoundError();
    case "42501":
      return forbiddenError();
    default:
      return databaseUnavailableError();
  }
}
