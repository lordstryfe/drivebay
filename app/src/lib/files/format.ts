export function formatBytes(size: number | null | undefined): string {
  if (size == null) return "—";
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let n = size / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} ${units[i]}`;
}

export function formatWhen(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function splitPath(p: string): { label: string; path: string }[] {
  if (!p) return [];
  const win = /^[A-Za-z]:[\\/]/.test(p) || p.includes("\\");
  const sep = win ? "\\" : "/";
  const normalized = win ? p.replace(/\//g, "\\") : p;
  if (normalized === "/" || /^[A-Za-z]:\\?$/.test(normalized)) {
    return [{ label: normalized.replace(/\\$/, ""), path: normalized }];
  }
  const parts = normalized.split(/[\\/]/).filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];
  if (!win) {
    crumbs.push({ label: "/", path: "/" });
    let acc = "";
    for (const part of parts) {
      acc += `/${part}`;
      crumbs.push({ label: part, path: acc });
    }
    return crumbs;
  }
  let acc = parts[0] ?? "";
  crumbs.push({ label: acc, path: `${acc}\\` });
  for (let i = 1; i < parts.length; i += 1) {
    acc += `${sep}${parts[i]}`;
    crumbs.push({ label: parts[i] ?? "", path: acc });
  }
  return crumbs;
}

export function defaultStartPath(drives: { kind: string; path: string }[]): string {
  const project = drives.find((d) => d.kind === "project");
  if (project) return project.path;
  const home = drives.find((d) => d.kind === "home");
  if (home) return home.path;
  return drives[0]?.path ?? "/";
}
