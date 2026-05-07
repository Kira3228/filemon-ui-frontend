import { RequestParams } from "@/types/request.params";
import { AnalysisStatusHistoryItem } from "./status.type";
import { api } from "@/shared/api/http";
import { PaginatedResult } from "../paginated-result.type";

interface IStatusService {
  getStatuses(params: RequestParams): Promise<AnalysisStatusHistoryItem[]>;
}


export const StatusService: IStatusService = {
  async getStatuses(params = {}): Promise<AnalysisStatusHistoryItem[]> {

    const result = await api.get<PaginatedResult<AnalysisStatusHistoryItem>>("/status-history", {
      page: params.page,
      limit: params.limit,
      _ts: params.force ? Date.now() : undefined,
    });

    return result.items;
  }
}
