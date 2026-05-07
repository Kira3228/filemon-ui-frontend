import { RequestParams } from "@/types/request.params";
import { api } from "@/shared/api/http";
import { AnalysisSourceItem } from "./source.types";
import { PaginatedResult } from "../paginated-result.type";

interface ISourceService {
  getServices: (params?: RequestParams) => Promise<AnalysisSourceItem[]>
}

export const SourceService: ISourceService = {
  async getServices(params = {}): Promise<AnalysisSourceItem[]> {

    const result = await api.get<PaginatedResult<AnalysisSourceItem>>("/sources", {
      page: params.page,
      limit: params.limit,
      _ts: params.force ? Date.now() : undefined,
    });

    return result.items;
  }
}
