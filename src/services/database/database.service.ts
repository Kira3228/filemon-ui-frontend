import {
  DatabaseConnectionSettings,
  UpdateDatabaseSettingsRequest,
} from "@/shared/api/contracts";
import { api } from "@/shared/api/http";

interface IDatabaseService {
  getState: () => Promise<DatabaseConnectionSettings>;
  updateState: (
    payload: UpdateDatabaseSettingsRequest,
  ) => Promise<DatabaseConnectionSettings>;
}

export const DatabaseService: IDatabaseService = {
  async getState() {
    return await api.get<DatabaseConnectionSettings>("/settings/database");
  },

  async updateState(payload) {
    return await api.patch<
      DatabaseConnectionSettings,
      UpdateDatabaseSettingsRequest
    >("/settings/database", payload);
  },
};
