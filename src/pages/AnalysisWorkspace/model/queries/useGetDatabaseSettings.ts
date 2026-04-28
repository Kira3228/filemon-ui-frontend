import { useQuery } from "@tanstack/vue-query";
import { DatabaseService } from "@/services/database.service";

export const DATABASE_SETTINGS_QUERY_KEY = ["database-settings"];

export const useGetDatabaseSettings = () => {
  const query = useQuery({
    queryKey: DATABASE_SETTINGS_QUERY_KEY,
    queryFn: () => DatabaseService.getState(),
  });

  return {
    ...query,
  };
};
