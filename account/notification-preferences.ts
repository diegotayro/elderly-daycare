export const NOTIFICATION_PREFERENCE_KEYS = [
  "notify_on_post",
  "daily_summary_enabled",
] as const;

export type NotificationPreferenceKey =
  (typeof NOTIFICATION_PREFERENCE_KEYS)[number];

export type NotificationPreference = {
  key: NotificationPreferenceKey;
  label: string;
};

// Copy del mockup staff; la equivalencia con la DB está en BACKLOG.
export const teamNotificationPreferences: NotificationPreference[] = [
  { key: "notify_on_post", label: "Nuevos comentarios de familias" },
  { key: "daily_summary_enabled", label: "Recordatorio de resumen (17:00)" },
];

// Copy del mockup familiar; coincide con los campos de la DB.
export const familyNotificationPreferences: NotificationPreference[] = [
  { key: "notify_on_post", label: "Avisos cuando se publica algo" },
  { key: "daily_summary_enabled", label: "Resumen diario (19:00)" },
];
