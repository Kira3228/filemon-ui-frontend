import { api } from "@/shared/api/http";
import { AnalysisFileItem } from "./file.types";
import { RequestParams } from "@/types/request.params";
import { PaginatedResult } from "../paginated-result.type";

interface IFileService {
  getFiles: (params?: RequestParams) => Promise<AnalysisFileItem[]>
}

export const FileService: IFileService = {
  async getFiles(params = {}): Promise<AnalysisFileItem[]> {

    const result = await api.get<PaginatedResult<AnalysisFileItem>>("/files", {
      page: params.page,
      limit: params.limit,
      _ts: params.force ? Date.now() : undefined,
    });

    return result.items;
  }
}
