import {
  DatabaseConnectionSettings,
  UpdateDatabaseSettingsRequest,
} from "@/shared/api/contracts";
import { useApi } from "@/shared/api/http";

interface IDatabaseService {
  getState: () => Promise<DatabaseConnectionSettings>;
  updateState: (
    payload: UpdateDatabaseSettingsRequest,
  ) => Promise<DatabaseConnectionSettings>;
}

export const DatabaseService: IDatabaseService = {
  async getState() {
    const api = useApi();
    return await api.get<DatabaseConnectionSettings>("/settings/database");
  },

  async updateState(payload) {
    const api = useApi();
    return await api.patch<
      DatabaseConnectionSettings,
      UpdateDatabaseSettingsRequest
    >("/settings/database", payload);
  },
};
