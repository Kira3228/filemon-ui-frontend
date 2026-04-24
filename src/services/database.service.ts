import { DatabaseConnectionSettings } from "@/shared/api/contracts";
import { useApi } from "@/shared/api/http";

interface IDatabaseService {
  getState: () => Promise<DatabaseConnectionSettings>
}

export const DatabaseService: IDatabaseService = {
  async getState() {
    const api = useApi()
    return await api.get<DatabaseConnectionSettings>("/settings/database");
  }
}