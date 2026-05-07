import { api } from "@/shared/api/http";
import { AnalysisTimelineEntry } from "./timeline.types";
import { RequestParams } from "@/types/request.params";
import { PaginatedResult } from "../paginated-result.type";

interface ITimelineService {
  getTimeline(params?: RequestParams): Promise<AnalysisTimelineEntry[]>
}

export const TimelineService: ITimelineService = {
  async getTimeline(param = {}): Promise<AnalysisTimelineEntry[]> {
    const result = await api.get<PaginatedResult<AnalysisTimelineEntry>>("/timeline", {
      page: param.page,
      limit: param.limit,
      _ts: param.force ? Date.now() : undefined,
    });

    return result.items;
  }
}
