import * as fs from 'fs';
import * as path from 'path';

const PID_FILE = path.join(__dirname, '.api.pid');

export default async function globalTeardown() {
  if (!fs.existsSync(PID_FILE)) return;

  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'), 10);
  try {
    process.kill(pid, 'SIGTERM');
    console.log(`\n[e2e] API process ${pid} stopped\n`);
  } catch {
    // Process already gone — fine
  }
  fs.unlinkSync(PID_FILE);
}
