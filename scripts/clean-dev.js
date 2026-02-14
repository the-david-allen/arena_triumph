/**
 * Delete .next before starting dev to avoid EINVAL readlink errors
 * on Windows (e.g. when project is under OneDrive).
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const nextDir = path.join(process.cwd(), ".next");
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, maxRetries: 3 });
  } catch (_) {
    // ignore
  }
}

const isWindows = process.platform === "win32";
spawn(isWindows ? "npx.cmd" : "npx", ["next", "dev"], {
  stdio: "inherit",
  shell: true,
});
