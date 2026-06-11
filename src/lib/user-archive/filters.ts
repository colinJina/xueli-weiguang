import {
  USER_ARCHIVE_ALL_COLLECTION_ID,
  type UserArchiveFilters,
  type UserArchiveSearchParamValue,
  type UserArchiveSearchParams,
  type UserArchiveView,
} from "@/lib/user-archive/types";

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

function getSingleParam(value: UserArchiveSearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function parseIdList(value: UserArchiveSearchParamValue) {
  const rawValue = getSingleParam(value);

  if (!rawValue) {
    return [];
  }

  return Array.from(
    new Set(
      rawValue
        .split(",")
        .map((item) => item.trim())
        .filter((item) => UUID_PATTERN.test(item)),
    ),
  );
}

function parseCollectionId(value: UserArchiveSearchParamValue) {
  const rawValue = getSingleParam(value)?.trim();

  if (!rawValue || rawValue === USER_ARCHIVE_ALL_COLLECTION_ID) {
    return null;
  }

  return UUID_PATTERN.test(rawValue) ? rawValue : null;
}

function parseView(value: UserArchiveSearchParamValue): UserArchiveView {
  return getSingleParam(value) === "list" ? "list" : "grid";
}

function parseTagQuery(value: UserArchiveSearchParamValue) {
  return (getSingleParam(value) ?? "").trim().slice(0, 80);
}

export function parseUserArchiveFilters(
  searchParams: UserArchiveSearchParams,
): UserArchiveFilters {
  return {
    collectionId: parseCollectionId(searchParams.collectionId),
    tagIds: parseIdList(searchParams.tagIds ?? searchParams.tags),
    tagQuery: parseTagQuery(searchParams.tagQuery ?? searchParams.q),
    view: parseView(searchParams.view),
  };
}

export function urlSearchParamsToUserArchiveSearchParams(
  searchParams: URLSearchParams,
): UserArchiveSearchParams {
  return {
    collectionId: searchParams.get("collectionId") ?? undefined,
    tagIds: searchParams.get("tagIds") ?? undefined,
    tagQuery: searchParams.get("tagQuery") ?? undefined,
    view: searchParams.get("view") ?? undefined,
  };
}
