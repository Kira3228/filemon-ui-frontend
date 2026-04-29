import { useQuery } from "@tanstack/vue-query";
import { AnalysisReportService } from "@/services/analysis-report/analysis-report.service";

export const ANALYSIS_REPORT_QUERY_KEY = ["analysis-report"];

export const useGetAnalysisReport = () => {
  const query = useQuery({
    queryKey: ANALYSIS_REPORT_QUERY_KEY,
    queryFn: () => AnalysisReportService.getReport(),
  });

  return {
    ...query,
  };
};
