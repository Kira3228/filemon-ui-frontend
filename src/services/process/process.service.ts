import { api } from "@/shared/api/http"
import { RequestParams } from "@/types/request.params"
import { PaginatedResult } from "../paginated-result.type"
import { AnalysisProcessReadGroup } from "./process.type"

interface IProcessService {
  getProcesses: (params?: RequestParams) => Promise<AnalysisProcessReadGroup[]>
}

export const ProcessService: IProcessService = {
  async getProcesses(params = {}) {

    const result = await api.get<PaginatedResult<AnalysisProcessReadGroup>>("/process-reads", {
      page: params.page,
      limit: params.limit,
      _ts: params.force ? Date.now() : undefined,
    })

    return result.items
  }
}
