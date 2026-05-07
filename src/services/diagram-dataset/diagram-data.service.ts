import { api } from "@/shared/api/http"
import { DiagramDataItem } from "./diagram-data.type";

interface IDiagramDatasetService {
  getDiagramData: (params?: any) => Promise<DiagramDataItem>
}

export const DiagramDatasetService: IDiagramDatasetService = {
  async getDiagramData(params = {}) {
    return api.get(`/diagram-dataset`, params)
  }
}