export type NotificationPreferenceKey =
  "notify_on_post" | "daily_summary_enabled";

export type NotificationPreference = {
  key: NotificationPreferenceKey;
  label: string;
};

// Copy del mockup staff; la equivalencia con la DB está en BACKLOG.
export const notificationPreferences: NotificationPreference[] = [
  { key: "notify_on_post", label: "Nuevos comentarios de familias" },
  { key: "daily_summary_enabled", label: "Recordatorio de resumen (17:00)" },
];
