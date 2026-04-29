import { api } from "@/shared/api/http"
import { RequestParams } from "@/types/request.params"

interface IProcessService {
  getProcesses: (params?: RequestParams) => Promise<void>
}

export const ProcessService: IProcessService = {
  async getProcesses(params = {}) {

    return await api.get("/analysis/report/process-reads", {
      page: params.page,
      limit: params.limit,
      _ts: params.force ? Date.now() : undefined,
    })
  }
}