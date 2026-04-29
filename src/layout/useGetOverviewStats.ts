import { OverviewService } from "@/services/overview/overview.service"
import { useQuery } from "@tanstack/vue-query"

export const useGetOverviewStats = () => {
  const query = useQuery({
    queryKey: ['overview'],
    queryFn: () => OverviewService.getOverviews(),

  })
  return { ...query }
}