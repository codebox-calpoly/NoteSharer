/**
 * Parses COURSE_REQUEST_NOTIFY_EMAIL: one address or several separated by comma or semicolon.
 */
export function parseNotifyEmailList(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((addr) => addr.trim())
    .filter(Boolean);
}
