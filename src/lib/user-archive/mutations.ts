import type { SupabaseClient } from "@supabase/supabase-js";

import { isUuid } from "@/lib/user-archive/filters";
import {
  limitExceededError,
  mapDatabaseError,
  notFoundError,
  validationError,
} from "@/lib/user-archive/errors";
import {
  COLLECTION_DESCRIPTION_MAX_LENGTH,
  COLLECTION_ITEM_NOTE_MAX_LENGTH,
  COLLECTION_ITEM_PER_COLLECTION_LIMIT,
  COLLECTION_NAME_MAX_LENGTH,
  TAG_NAME_MAX_LENGTH,
  TAGS_PER_ITEM_LIMIT,
  USER_COLLECTION_ITEM_LIMIT,
  USER_COLLECTION_LIMIT,
  USER_COLLECTION_TAG_LIMIT,
} from "@/lib/user-archive/limits";

type MutationResult = {
  id: string;
};

function assertUuid(value: string, field: string, label: string) {
  if (!isUuid(value)) {
    throw validationError(`${label}无效，请刷新后重试。`, {
      [field]: `${label}无效`,
    });
  }
}

function normalizeRequiredText(
  value: unknown,
  field: string,
  label: string,
  maxLength: number,
) {
  if (typeof value !== "string") {
    throw validationError(`${label}不能为空。`, { [field]: `请输入${label}` });
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw validationError(`${label}不能为空。`, { [field]: `请输入${label}` });
  }

  if (trimmedValue.length > maxLength) {
    throw validationError(`${label}不能超过 ${maxLength} 个字符。`, {
      [field]: `${label}过长`,
    });
  }

  return trimmedValue;
}

function normalizeOptionalText(
  value: unknown,
  field: string,
  label: string,
  maxLength: number,
) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return "";
  }

  if (typeof value !== "string") {
    throw validationError(`${label}格式无效。`, { [field]: `${label}格式无效` });
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length > maxLength) {
    throw validationError(`${label}不能超过 ${maxLength} 个字符。`, {
      [field]: `${label}过长`,
    });
  }

  return trimmedValue;
}

function normalizeSortOrder(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw validationError("排序值必须是整数。", { sortOrder: "排序值无效" });
  }

  return value;
}

export function normalizeTagIds(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw validationError("标签列表无效，请重新选择。", { tagIds: "标签列表无效" });
  }

  const tagIds = Array.from(
    new Set(
      value.map((item) => (typeof item === "string" ? item.trim() : "")),
    ),
  ).filter(Boolean);

  if (tagIds.some((tagId) => !isUuid(tagId))) {
    throw validationError("标签列表无效，请重新选择。", { tagIds: "标签列表无效" });
  }

  if (tagIds.length > TAGS_PER_ITEM_LIMIT) {
    throw limitExceededError("单条收藏最多只能绑定 10 个标签。");
  }

  return tagIds;
}

async function ensureTagIdsBelongToUser(
  client: SupabaseClient,
  userId: string,
  tagIds: readonly string[] | undefined,
) {
  if (!tagIds || tagIds.length === 0) {
    return;
  }

  const { data, error } = await client
    .from("collection_tags")
    .select("id")
    .eq("user_id", userId)
    .in("id", [...tagIds]);

  if (error) {
    throw mapDatabaseError(error);
  }

  if ((data ?? []).length !== tagIds.length) {
    throw notFoundError("选择的标签不存在或已被删除。");
  }
}

async function countRows(
  query: PromiseLike<{ count: number | null; error: { code?: string; message?: string } | null }>,
) {
  const { count, error } = await query;

  if (error) {
    throw mapDatabaseError(error);
  }

  return count ?? 0;
}

async function ensureUserCollectionQuota(client: SupabaseClient, userId: string) {
  const count = await countRows(
    client
      .from("collections")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  );

  if (count >= USER_COLLECTION_LIMIT) {
    throw limitExceededError(`收藏夹最多只能创建 ${USER_COLLECTION_LIMIT} 个。`);
  }
}

async function ensureUserTagQuota(client: SupabaseClient, userId: string) {
  const count = await countRows(
    client
      .from("collection_tags")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  );

  if (count >= USER_COLLECTION_TAG_LIMIT) {
    throw limitExceededError(`标签最多只能创建 ${USER_COLLECTION_TAG_LIMIT} 个。`);
  }
}

async function ensureCollectionItemQuota(
  client: SupabaseClient,
  collectionId: string,
) {
  const [userItemCount, collectionItemCount] = await Promise.all([
    countRows(
      client
        .from("collection_items")
        .select("id", { count: "exact", head: true }),
    ),
    countRows(
      client
        .from("collection_items")
        .select("id", { count: "exact", head: true })
        .eq("collection_id", collectionId),
    ),
  ]);

  if (userItemCount >= USER_COLLECTION_ITEM_LIMIT) {
    throw limitExceededError(`最多只能收藏 ${USER_COLLECTION_ITEM_LIMIT} 条视频。`);
  }

  if (collectionItemCount >= COLLECTION_ITEM_PER_COLLECTION_LIMIT) {
    throw limitExceededError(
      `单个收藏夹最多只能收藏 ${COLLECTION_ITEM_PER_COLLECTION_LIMIT} 条视频。`,
    );
  }
}

export async function createCollection(
  client: SupabaseClient,
  userId: string,
  input: Record<string, unknown>,
): Promise<MutationResult> {
  const name = normalizeRequiredText(input.name, "name", "收藏夹名称", COLLECTION_NAME_MAX_LENGTH);
  const description =
    normalizeOptionalText(
      input.description,
      "description",
      "收藏夹描述",
      COLLECTION_DESCRIPTION_MAX_LENGTH,
    ) ?? "";
  const sortOrder = normalizeSortOrder(input.sortOrder);
  await ensureUserCollectionQuota(client, userId);

  const { data, error } = await client
    .from("collections")
    .insert({
      user_id: userId,
      name,
      description,
      ...(sortOrder === undefined ? {} : { sort_order: sortOrder }),
    })
    .select("id")
    .single();

  if (error) {
    throw mapDatabaseError(error);
  }

  return { id: (data as MutationResult).id };
}

export async function updateCollection(
  client: SupabaseClient,
  collectionId: string,
  input: Record<string, unknown>,
): Promise<MutationResult> {
  assertUuid(collectionId, "id", "收藏夹");

  const patch: Record<string, string | number> = {};

  if (input.name !== undefined) {
    patch.name = normalizeRequiredText(input.name, "name", "收藏夹名称", COLLECTION_NAME_MAX_LENGTH);
  }

  const description = normalizeOptionalText(
    input.description,
    "description",
    "收藏夹描述",
    COLLECTION_DESCRIPTION_MAX_LENGTH,
  );

  if (description !== undefined) {
    patch.description = description;
  }

  const sortOrder = normalizeSortOrder(input.sortOrder);

  if (sortOrder !== undefined) {
    patch.sort_order = sortOrder;
  }

  if (Object.keys(patch).length === 0) {
    throw validationError("没有可保存的收藏夹变更。");
  }

  const { data, error } = await client
    .from("collections")
    .update(patch)
    .eq("id", collectionId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  if (!data) {
    throw notFoundError("收藏夹不存在或已被删除。");
  }

  return { id: (data as MutationResult).id };
}

export async function deleteCollection(
  client: SupabaseClient,
  collectionId: string,
): Promise<MutationResult> {
  assertUuid(collectionId, "id", "收藏夹");

  const { data, error } = await client
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  if (!data) {
    throw notFoundError("收藏夹不存在或已被删除。");
  }

  return { id: (data as MutationResult).id };
}

export async function createTag(
  client: SupabaseClient,
  userId: string,
  input: Record<string, unknown>,
): Promise<MutationResult> {
  const name = normalizeRequiredText(input.name, "name", "标签名称", TAG_NAME_MAX_LENGTH);
  const sortOrder = normalizeSortOrder(input.sortOrder);
  await ensureUserTagQuota(client, userId);

  const { data, error } = await client
    .from("collection_tags")
    .insert({
      user_id: userId,
      name,
      ...(sortOrder === undefined ? {} : { sort_order: sortOrder }),
    })
    .select("id")
    .single();

  if (error) {
    throw mapDatabaseError(error);
  }

  return { id: (data as MutationResult).id };
}

export async function updateTag(
  client: SupabaseClient,
  tagId: string,
  input: Record<string, unknown>,
): Promise<MutationResult> {
  assertUuid(tagId, "id", "标签");

  const patch: Record<string, string | number> = {};

  if (input.name !== undefined) {
    patch.name = normalizeRequiredText(input.name, "name", "标签名称", TAG_NAME_MAX_LENGTH);
  }

  const sortOrder = normalizeSortOrder(input.sortOrder);

  if (sortOrder !== undefined) {
    patch.sort_order = sortOrder;
  }

  if (Object.keys(patch).length === 0) {
    throw validationError("没有可保存的标签变更。");
  }

  const { data, error } = await client
    .from("collection_tags")
    .update(patch)
    .eq("id", tagId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  if (!data) {
    throw notFoundError("标签不存在或已被删除。");
  }

  return { id: (data as MutationResult).id };
}

export async function deleteTag(
  client: SupabaseClient,
  tagId: string,
): Promise<MutationResult> {
  assertUuid(tagId, "id", "标签");

  const { data, error } = await client
    .from("collection_tags")
    .delete()
    .eq("id", tagId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  if (!data) {
    throw notFoundError("标签不存在或已被删除。");
  }

  return { id: (data as MutationResult).id };
}

export async function setCollectionItemTags(
  client: SupabaseClient,
  userId: string,
  collectionItemId: string,
  tagIds: readonly string[],
) {
  assertUuid(collectionItemId, "id", "收藏记录");
  await ensureTagIdsBelongToUser(client, userId, tagIds);

  const { error } = await client.rpc("set_collection_item_tags", {
    p_collection_item_id: collectionItemId,
    p_tag_ids: [...tagIds],
  });

  if (error) {
    throw mapDatabaseError(error);
  }
}

export async function createCollectionItem(
  client: SupabaseClient,
  userId: string,
  collectionId: string,
  input: Record<string, unknown>,
): Promise<MutationResult> {
  assertUuid(collectionId, "collectionId", "收藏夹");

  const videoId = normalizeRequiredText(input.videoId, "videoId", "视频标识", 80);
  assertUuid(videoId, "videoId", "视频");

  const note =
    normalizeOptionalText(input.note, "note", "收藏备注", COLLECTION_ITEM_NOTE_MAX_LENGTH) ?? "";
  const sortOrder = normalizeSortOrder(input.sortOrder);
  const tagIds = normalizeTagIds(input.tagIds);

  await ensureTagIdsBelongToUser(client, userId, tagIds);
  await ensureCollectionItemQuota(client, collectionId);

  const { data, error } = await client.rpc("create_collection_item_with_tags", {
    p_collection_id: collectionId,
    p_video_id: videoId,
    p_note: note,
    p_sort_order: sortOrder ?? null,
    p_tag_ids: tagIds ?? [],
  });

  if (error) {
    throw mapDatabaseError(error);
  }

  if (typeof data !== "string") {
    throw notFoundError("收藏记录保存失败，请刷新后重试。");
  }

  return { id: data };
}

export async function updateCollectionItem(
  client: SupabaseClient,
  userId: string,
  collectionItemId: string,
  input: Record<string, unknown>,
): Promise<MutationResult> {
  assertUuid(collectionItemId, "id", "收藏记录");

  const note = normalizeOptionalText(input.note, "note", "收藏备注", COLLECTION_ITEM_NOTE_MAX_LENGTH);
  const sortOrder = normalizeSortOrder(input.sortOrder);
  const tagIds = normalizeTagIds(input.tagIds);

  if (note === undefined && sortOrder === undefined && tagIds === undefined) {
    throw validationError("没有可保存的收藏记录变更。");
  }

  await ensureTagIdsBelongToUser(client, userId, tagIds);

  const { data, error } = await client.rpc("update_collection_item_with_tags", {
    p_collection_item_id: collectionItemId,
    p_note: note ?? null,
    p_sort_order: sortOrder ?? null,
    p_tag_ids: tagIds ?? null,
  });

  if (error) {
    throw mapDatabaseError(error);
  }

  if (typeof data !== "string") {
    throw notFoundError("收藏记录不存在或已被移除。");
  }

  return { id: data };
}

export async function deleteCollectionItem(
  client: SupabaseClient,
  collectionItemId: string,
): Promise<MutationResult> {
  assertUuid(collectionItemId, "id", "收藏记录");

  const { data, error } = await client
    .from("collection_items")
    .delete()
    .eq("id", collectionItemId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw mapDatabaseError(error);
  }

  if (!data) {
    throw notFoundError("收藏记录不存在或已被移除。");
  }

  return { id: (data as MutationResult).id };
}
