import { useApi } from "@/shared/api/http";
import { AnalysisFileItem } from "./types/file.types";


interface GetFilesParams {
  page?: number;
  limit?: number;
  force?: boolean;
}

interface IFileService {
  getFiles: (params?: GetFilesParams) => Promise<AnalysisFileItem[]>
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