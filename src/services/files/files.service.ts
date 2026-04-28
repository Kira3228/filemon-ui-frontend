import { useApi } from "@/shared/api/http";
import { AnalysisFileItem } from "./file.types";
import { RequestParams } from "@/types/request.params";

interface IFileService {
  getFiles: (params?: RequestParams) => Promise<AnalysisFileItem[]>
}

export const FileService: IFileService = {
  async getFiles(params = {}): Promise<AnalysisFileItem[]> {
    const api = useApi()

    return await api.get<AnalysisFileItem[]>("/analysis/report/files", {
      page: params.page,
      limit: params.limit,
      _ts: params.force ? Date.now() : undefined,
    });
  }
}