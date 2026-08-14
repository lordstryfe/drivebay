import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type PortStyle = "random" | "static";

export type PortSettings = {
  style: PortStyle;
  port: number;
};

export type AppSettings = PortSettings & {
  dataDir: string;
  portFile: string;
  lockPersists: true;
};

function fallbackPort(): number {
  const raw = String(process.env.DRIVEBAY_FALLBACK_PORT || process.env.PORT || "42013").trim();
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1024 && n <= 65535 ? n : 42013;
}

export function resolveDataDir(): string {
  const fromEnv = process.env.DRIVEBAY_DATA_DIR?.trim();
  if (fromEnv) return resolve(fromEnv);
  if (process.env.DRIVEBAY_PINOKIO === "true") {
    return resolve(process.cwd(), "..", "data");
  }
  return resolve(process.cwd(), "data");
}

export function resolvePortFile(): string {
  const fromEnv = process.env.DRIVEBAY_PORT_FILE?.trim();
  if (fromEnv) return resolve(fromEnv);
  if (process.env.DRIVEBAY_PINOKIO === "true") {
    return resolve(process.cwd(), "..", "drivebay.port");
  }
  return resolve(process.cwd(), "drivebay.port");
}

export function readPortSettings(): PortSettings {
  try {
    const raw = readFileSync(resolvePortFile(), "utf8").trim().toLowerCase();
    if (raw === "random") return { style: "random", port: fallbackPort() };
    if (/^\d{2,5}$/.test(raw)) return { style: "static", port: Number(raw) };
  } catch {
    /* missing */
  }
  return { style: "random", port: fallbackPort() };
}

export function writePortSettings(style: PortStyle, port: number): PortSettings {
  const file = resolvePortFile();
  mkdirSync(dirname(file), { recursive: true });
  if (style === "random") {
    writeFileSync(file, "random", "utf8");
    return { style: "random", port: fallbackPort() };
  }
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("Port must be between 1024 and 65535");
  }
  writeFileSync(file, String(port), "utf8");
  return { style: "static", port };
}

export function readAppSettings(): AppSettings {
  return {
    ...readPortSettings(),
    dataDir: resolveDataDir(),
    portFile: resolvePortFile(),
    lockPersists: true,
  };
}
