import { DatabaseService } from "@/services/database/database.service"
import { DATABASE_SETTINGS_QUERY_KEY } from "@/pages/AnalysisWorkspace/model/queries/useGetDatabaseSettings"
import { useQuery } from "@tanstack/vue-query"

export const useGetDatabaseState = () => {
  const query = useQuery({
    queryKey: DATABASE_SETTINGS_QUERY_KEY,
    queryFn: () => DatabaseService.getState()
  })
  return {
    ...query
  }
}
