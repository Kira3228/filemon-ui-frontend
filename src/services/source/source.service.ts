import { RequestParams } from "@/types/request.params";
import { api } from "@/shared/api/http";
import { SourceListResult } from "./source.types";

interface ISourceService {
  getServices: (params?: RequestParams) => Promise<SourceListResult>
}



export const SourceService: ISourceService = {
  async getServices(params = {}): Promise<SourceListResult> {

    return await api.get<SourceListResult>("/sources", {
      page: params.page,
      limit: params.limit,
      _ts: params.force ? Date.now() : undefined,
    });
  }
}
