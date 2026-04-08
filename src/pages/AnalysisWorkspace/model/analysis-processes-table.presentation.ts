import { formatProcessMetaValue } from "./analysis-processes-table.helpers";
import type { Nullable } from "./analysis-report.types";
import type { ProcessBucket, ProcessGroupRow } from "./analysis-processes-table.types";

export const formatProcessTableMetaValue = (value: unknown) =>
  String(formatProcessMetaValue(value));

export const buildProcessBucketTitle = (
  bucketKey: string,
  processBucketSummary: Record<string, ProcessBucket>,
) => {
  const bucket = processBucketSummary[bucketKey];
  if (!bucket) { return ""; }

  return `PID ${formatProcessTableMetaValue(bucket.pid)} · UID ${formatProcessTableMetaValue(bucket.uid)} · пользователь ${bucket.user || "—"}${bucket.executablePath ? ` · ${bucket.executablePath}` : ""}`;
};

export const buildProcessGroupTitle = (
  item: ProcessGroupRow,
  formatTs: (value?: Nullable<string>) => string,
) =>
  `WRITE ${item.writeFileName} · PV ${formatProcessTableMetaValue(item.processVersionId)} · ${formatTs(item.writeAt)}${item.writePath ? ` · ${item.writePath}` : ""}`;
