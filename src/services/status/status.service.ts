import { RequestParams } from "@/types/request.params";
import { AnalysisStatusHistoryItem } from "./status.type";
import { useApi } from "@/shared/api/http";

interface IStatusService {
  getStatuses(params: RequestParams): Promise<AnalysisStatusHistoryItem[]>;
}


export const StatusService: IStatusService = {
  async getStatuses(params = {}): Promise<AnalysisStatusHistoryItem[]> {
    const api = useApi()

    return await api.get<AnalysisStatusHistoryItem[]>("/analysis/report/status-history", {
      page: params.page,
      limit: params.limit,
      _ts: params.force ? Date.now() : undefined,
    });
  }
}