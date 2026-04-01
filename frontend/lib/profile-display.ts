export function buildProfileInitials(
  displayName: string | null | undefined,
  handle: string | null | undefined,
): string {
  const source = (displayName?.trim() || handle?.trim() || "U").replace(/^@/, "");
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}
