const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const portFile = path.join(__dirname, "drivebay.port");
let mode = "random";
let port = String(process.env.DRIVEBAY_FALLBACK_PORT || process.env.PORT || "42013").trim();

if (fs.existsSync(portFile)) {
  const raw = fs.readFileSync(portFile, "utf8").trim().toLowerCase();
  if (raw === "random") {
    mode = "random";
  } else if (/^\d{2,5}$/.test(raw)) {
    mode = "static";
    port = raw;
  }
}

console.log(
  mode === "static"
    ? "Drivebay static port: " + port
    : "Drivebay random port: " + port,
);

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(
  npmCmd,
  ["run", "dev", "--", "--host", "0.0.0.0", "--port", String(port)],
  {
    cwd: path.join(__dirname, "app"),
    stdio: "inherit",
    env: process.env,
    shell: true,
  },
);
child.on("exit", (code) => process.exit(code == null ? 0 : code));
