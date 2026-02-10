export type ExportFormat = "json" | "markdown" | "csv";

export interface UserPreferences {
  exportFormat: ExportFormat;
  theme: "light" | "dark" | "auto";
  language: string;
}

const LOCAL_KEY = "user_preferences";

/**
 * TEMP (Frontend-only)
 * Later: replace localStorage with API calls
 */
export const getUserPreferences = (): UserPreferences => {
  const stored = localStorage.getItem(LOCAL_KEY);
  return stored
    ? JSON.parse(stored)
    : {
        exportFormat: "json",
        theme: "light",
        language: "en",
      };
};

export const saveUserPreferences = async (
  preferences: UserPreferences
) => {
  // 🔹 CURRENT: localStorage
  localStorage.setItem(LOCAL_KEY, JSON.stringify(preferences));

  // 🔹 FUTURE (backend)
  // await api.post("/user/preferences", preferences);
};
