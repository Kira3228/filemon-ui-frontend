import { RequestParams } from "@/types/request.params";
import { AnalysisSourceItem } from "./source.types";
import { api } from "@/shared/api/http";

interface ISourceService {
  getServices: (params?: RequestParams) => Promise<AnalysisSourceItem[]>
}

export const SourceService: ISourceService = {
  async getServices(params = {}): Promise<AnalysisSourceItem[]> {

    return await api.get<AnalysisSourceItem[]>("/analysis/report/sources", {
      page: params.page,
      limit: params.limit,
      _ts: params.force ? Date.now() : undefined,
    });
  }
}
