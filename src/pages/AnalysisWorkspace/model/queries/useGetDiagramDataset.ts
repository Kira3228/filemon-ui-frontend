import { DiagramDatasetService } from "@/services/diagram-dataset/diagram-data.service"
import { useQuery } from "@tanstack/vue-query"

export const useGetDiagramData = () => {
  const query = useQuery({
    queryKey: [`diagram-data`],
    queryFn: () => DiagramDatasetService.getDiagramData()
  })
  return { ...query }
}