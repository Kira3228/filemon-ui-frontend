import { useApi } from "@/shared/api/http";
import { AnalysisReportResult } from "@/pages/AnalysisWorkspace/model/analysis-report.types";

interface IAnalysisReportService {
  getReport: () => Promise<AnalysisReportResult>;
}

export const AnalysisReportService: IAnalysisReportService = {
  async getReport() {
    const api = useApi();
    return await api.get<AnalysisReportResult>("/analysis/report", {
      limit: 500,
    });
  },
};
