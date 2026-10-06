/* eslint-disable @typescript-eslint/no-require-imports -- plain CommonJS so both Node scripts and the app can load it */
// The built-in database can only be used by one process at a time; two at once corrupt it.
// The dev server holds this lock while it's running.
const fs = require("node:fs");
const path = require("node:path");

const LOCK = path.join(".data", "pglite.lock");

function lockHolder() {
  try {
    const pid = Number(fs.readFileSync(LOCK, "utf8"));
    if (pid && pid !== process.pid) {
      process.kill(pid, 0); // throws if that process is gone
      return pid;
    }
  } catch {}
  return null;
}

function alreadyRunningMessage(pid) {
  return (
    `The app is already running (process ${pid}) and using the local database.\n` +
    "Stop it first (Ctrl+C in its terminal), or open the address it printed."
  );
}

function acquireLock() {
  const holder = lockHolder();
  if (holder) throw new Error(alreadyRunningMessage(holder));
  fs.mkdirSync(".data", { recursive: true });
  fs.writeFileSync(LOCK, String(process.pid));
  process.on("exit", () => {
    try {
      if (Number(fs.readFileSync(LOCK, "utf8")) === process.pid) fs.unlinkSync(LOCK);
    } catch {}
  });
}

module.exports = { acquireLock, lockHolder, alreadyRunningMessage };
