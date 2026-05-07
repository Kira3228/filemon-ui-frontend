import { api } from "@/shared/api/http";
import { RequestParams } from "@/types/request.params";
import { AnalysisOperationItem } from "./analysis-operation-item.type";
import { PaginatedResult } from "../paginated-result.type";

interface IOperationsService {
  getOperation: (param?: RequestParams) => Promise<AnalysisOperationItem[]>
}

export const OperationsService: IOperationsService = {
  async getOperation(param = {}) {

    const result = await api.get<PaginatedResult<AnalysisOperationItem>>("/operations", {
      page: param.page,
      limit: param.limit,
      _ts: param.force ? Date.now() : undefined,
    });

    return result.items;
  },
};


