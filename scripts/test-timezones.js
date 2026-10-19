// Runs the date/scheduling tests once per time zone. Day-shift bugs only show
// up east or west of UTC, and TZ must be set before Node starts to take effect.
const { spawnSync } = require("child_process");

const ZONES = ["America/Los_Angeles", "UTC", "Asia/Riyadh", "Pacific/Kiritimati"];

let failed = false;
for (const zone of ZONES) {
  console.log(`\n=== TZ=${zone}`);
  const result = spawnSync("npx", ["jest", "utils"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, TZ: zone },
  });
  if (result.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
