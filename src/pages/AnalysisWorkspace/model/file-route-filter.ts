import type { RawLocation, Route } from "vue-router";

type QueryValue = string | string[] | null | undefined;

const normalizeQueryValue = (value: QueryValue) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export const parseRouteFileId = (route: Pick<Route, "query">) => {
  const rawValue = normalizeQueryValue(route.query?.fileId as QueryValue);
  const fileId = Number(rawValue);
  return Number.isFinite(fileId) ? fileId : null;
};

export const filterItemsByFileId = <T extends { fileId?: number | string | null | undefined }>(
  items: T[],
  fileId: number | null,
) => {
  if (fileId === null) {
    return items;
  }

  return items.filter((item) => Number(item?.fileId) === fileId);
};

export const buildFileScopedLocation = (path: string, fileId?: number | null): RawLocation => ({
  path,
  query: fileId === null || fileId === undefined ? undefined : { fileId: String(fileId) },
});

export const stripFileIdFromQuery = (query: Route["query"]) => {
  const nextQuery = { ...query };
  delete nextQuery.fileId;
  return nextQuery;
};
