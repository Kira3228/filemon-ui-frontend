import { ref } from "vue";
import { useApi } from "@/shared/api/http";
import {
  DatabaseConnectionStatus,
  DatabaseConnectionSettings,
} from "@/shared/api/contracts";

const { get } = useApi();

const databasePath = ref("");
const databaseExists = ref(false);
const databaseConnected = ref(false);
const databaseStatus = ref<DatabaseConnectionStatus>("path-not-set");
const databaseStatusMessage = ref("");
const databaseStatusDetails = ref<unknown>(undefined);
const databaseConfigPath = ref("");
const databaseUpdatedAt = ref("");

const applyDatabaseState = (settings: DatabaseConnectionSettings) => {
  databasePath.value = settings.databasePath || "";
  databaseExists.value = Boolean(settings.exists);
  databaseConnected.value = settings.connected;
  databaseStatus.value = settings.status;
  databaseStatusMessage.value = settings.statusMessage || "";
  databaseStatusDetails.value = settings.statusDetails;
  databaseConfigPath.value = settings.configPath || "";
  databaseUpdatedAt.value = settings.updatedAt || "";
};

const loadDatabaseState = async () => {
  try {
    const settings = await get<DatabaseConnectionSettings>("/settings/database");
    applyDatabaseState(settings);
    return settings;
  } catch (error) {
    databasePath.value = "";
    databaseExists.value = false;
    databaseConnected.value = false;
    databaseStatus.value = "path-not-set";
    databaseStatusMessage.value = "";
    databaseStatusDetails.value = undefined;
    databaseConfigPath.value = "";
    databaseUpdatedAt.value = "";
    throw error;
  }
};

export const useDatabaseState = () => ({
  databasePath,
  databaseExists,
  databaseConnected,
  databaseStatus,
  databaseStatusMessage,
  databaseStatusDetails,
  databaseConfigPath,
  databaseUpdatedAt,
  applyDatabaseState,
  loadDatabaseState,
});

export type { DatabaseConnectionStatus, DatabaseConnectionSettings };
