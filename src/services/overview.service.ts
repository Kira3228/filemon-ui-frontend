import { useApi } from "@/shared/api/http";

interface IOverviewService {
  getOverviews: (force?: boolean) => Promise<AnalysisReportOverview>
}

export interface AnalysisReportOverview {
  files: number;
  fileVersions: number;
  sources: number;
  maxDepth: number;
  reads: number;
  writes: number;
}
export const OverviewService: IOverviewService = {
  async getOverviews(force = false) {
    const api = useApi()
    console.log(`ОВЕРВЮ`);
    
    return await api.get<AnalysisReportOverview>("/analysis/report/overview", {
      limit: 500,
      _ts: force ? Date.now() : undefined,
    });
  }
}