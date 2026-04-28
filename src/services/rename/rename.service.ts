import { RequestParams } from "@/types/request.params";
import { AnalysisRenameHistoryItem } from "./rename-history.type";
import { useApi } from "@/shared/api/http";

interface IRenameService {
  getRenameHistory: (params?: RequestParams) => Promise<AnalysisRenameHistoryItem[]>;
}

export const RenameService: IRenameService = {
  async getRenameHistory(params = {}) {
    const api = useApi()

    return await api.get<AnalysisRenameHistoryItem[]>("/analysis/report/rename-history", {
      page: params.page,
      limit: params.limit,
      _ts: params.force ? Date.now() : undefined,
    });
  },
};