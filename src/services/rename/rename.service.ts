import { RequestParams } from "@/types/request.params";
import { AnalysisRenameHistoryItem } from "./rename-history.type";
import { api } from "@/shared/api/http";
import { PaginatedResult } from "../paginated-result.type";

interface IRenameService {
  getRenameHistory: (params?: RequestParams) => Promise<AnalysisRenameHistoryItem[]>;
}

export const RenameService: IRenameService = {
  async getRenameHistory(params = {}) {

    const result = await api.get<PaginatedResult<AnalysisRenameHistoryItem>>("/rename-history", {
      page: params.page,
      limit: params.limit,
      _ts: params.force ? Date.now() : undefined,
    });

    return result.items;
  },
};
