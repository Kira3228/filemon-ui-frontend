import { RawLocation } from "vue-router";

export const buildFileScopedLocation = (
  path: string, fileId?: number | null):
  RawLocation => ({
    path,
    query: fileId === null || fileId === undefined ? undefined : { fileId: String(fileId) },
  }
);