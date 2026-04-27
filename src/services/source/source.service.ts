import { AnalysisSourceItem } from "./source.types";

import { useApi } from "@/shared/api/http";

interface ISourceService {
  getServices: (params?: GetServicesParams) => Promise<AnalysisSourceItem[]>
}

interface GetServicesParams {
  page?: number;
  limit?: number;
  force?: boolean;
}

export const SourceService: ISourceService = {
  async getServices(params = {}): Promise<AnalysisSourceItem[]> {
    const api = useApi()

    return await api.get<AnalysisSourceItem[]>("/analysis/report/sources", {
      page: params.page,
      limit: params.limit,
      _ts: params.force ? Date.now() : undefined,
    });
  }
}
