const LOCAL_DOMAIN = "drivebay.local";

export function usernameToEmail(username: string): string {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed) throw new Error("Username is required");
  if (trimmed.includes("@")) return trimmed;
  return `${trimmed}@${LOCAL_DOMAIN}`;
}

export function emailToUsername(email: string | null | undefined): string {
  if (!email) return "owner";
  if (email.endsWith(`@${LOCAL_DOMAIN}`)) return email.slice(0, -(`@${LOCAL_DOMAIN}`.length));
  return email;
}
