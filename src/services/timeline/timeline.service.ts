import { api } from "@/shared/api/http";
import { AnalysisTimelineEntry } from "./timeline.types";
import { RequestParams } from "@/types/request.params";

interface ITimelineService {
  getTimeline(params?: RequestParams): Promise<AnalysisTimelineEntry[]>
}

export const TimelineService: ITimelineService = {
  async getTimeline(param = {}): Promise<AnalysisTimelineEntry[]> {
    return await api.get<AnalysisTimelineEntry[]>("/analysis/report/timeline", {
      page: param.page,
      limit: param.limit,
      _ts: param.force ? Date.now() : undefined,
    });
  }
}