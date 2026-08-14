const fs = require("fs");
const path = require("path");

const styleRaw = String(process.env.DRIVEBAY_PORT_STYLE || "static")
  .trim()
  .toLowerCase();
const style = styleRaw === "random" ? "random" : "static";
const dest = path.join(__dirname, "drivebay.port");

if (style === "random") {
  fs.writeFileSync(dest, "random", "utf8");
  console.log("Drivebay will use a random port each Start.");
  console.log("Saved " + dest);
  process.exit(0);
}

const raw = String(process.env.DRIVEBAY_PORT || "").trim();
const port = /^\d{2,5}$/.test(raw) ? Number(raw) : 42013;
if (port < 1024 || port > 65535) {
  console.error("Static port must be between 1024 and 65535.");
  process.exit(1);
}
fs.writeFileSync(dest, String(port), "utf8");
console.log("Drivebay will always use port " + port + ". Forward this on your router.");
console.log("Saved " + dest);
