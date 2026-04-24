import { DatabaseService } from "@/services/database.service"
import { useQuery } from "@tanstack/vue-query"

export const useGetDatabaseState = () => {
  const query = useQuery({
    queryKey: [`database-state`],
    queryFn: () => DatabaseService.getState()
  })
  return {
    ...query
  }
}