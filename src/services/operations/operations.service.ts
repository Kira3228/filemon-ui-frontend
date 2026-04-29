import { api } from "@/shared/api/http";
import { RequestParams } from "@/types/request.params";
import { AnalysisOperationItem } from "./analysis-operation-item.type";

interface IOperationsService {
  getOperation: (param?: RequestParams) => Promise<AnalysisOperationItem[]>
}

export const OperationsService: IOperationsService = {
  async getOperation(param = {}) {

    return await api.get<AnalysisOperationItem[]>("/analysis/report/operations", {
      page: param.page,
      limit: param.limit,
      _ts: param.force ? Date.now() : undefined,
    });
  },
};


