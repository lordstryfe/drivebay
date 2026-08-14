const fs = require("fs");
const path = require("path");

const raw = String(process.env.DRIVEBAY_PORT || "").trim();
const port = /^\d{2,5}$/.test(raw) ? Number(raw) : 42013;
if (port < 1024 || port > 65535) {
  console.error("Port must be between 1024 and 65535.");
  process.exit(1);
}
const dest = path.join(__dirname, "drivebay.port");
fs.writeFileSync(dest, String(port), "utf8");
console.log("Drivebay will use port " + port + ". Forward this port on your router.");
console.log("Saved " + dest);
