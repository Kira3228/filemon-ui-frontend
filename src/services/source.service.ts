import { useApi } from "@/shared/api/http";

interface ISourceService {
  getServices: (params?: GetServicesParams) => Promise<AnalysisSource[]>
}

export interface AnalysisSource {
}

interface GetServicesParams {
  page?: number;
  limit?: number;
  force?: boolean;
}

export const SourceService: ISourceService = {
  async getServices(params = {}): Promise<AnalysisSource[]> {
    const api = useApi()

    return await api.get<AnalysisSource[]>("/analysis/report/sources", {
      page: params.page,
      limit: params.limit,
      _ts: params.force ? Date.now() : undefined,
    });
  }
}
