import { spawn } from 'child_process';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { clerkSetup } from '@clerk/testing/playwright';

const API_PORT = 8080;
const API_DIR = path.join(__dirname, '../apps/api');
const PID_FILE = path.join(__dirname, '.api.pid');

function isPortListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.connect(port, 'localhost');
  });
}

async function waitForPort(port: number, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortListening(port)) return;
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`API did not become ready on :${port} within ${timeoutMs}ms`);
}

export default async function globalSetup() {
  // Set up Clerk testing — fetches a testing token from Clerk Backend API.
  // Requires CLERK_SECRET_KEY (and optionally NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).
  // The token is used by setupClerkTestingToken() in the authenticated fixture.
  if (process.env.CLERK_SECRET_KEY) {
    try {
      await clerkSetup();
      console.log('[e2e] Clerk testing configured');
    } catch (err) {
      console.warn('[e2e] Clerk testing setup failed:', (err as Error).message);
    }
  } else {
    console.log('[e2e] CLERK_SECRET_KEY not set — authenticated tests will be skipped');
  }

  // Reuse an already-running API (common in local dev)
  if (await isPortListening(API_PORT)) {
    console.log(`\n[e2e] API already running on :${API_PORT} — reusing\n`);
    return;
  }

  console.log('\n[e2e] Building Go API...');
  try {
    execSync('go build -o ./server ./cmd/server/...', {
      cwd: API_DIR,
      stdio: 'inherit',
    });
  } catch {
    console.warn('[e2e] Go API build failed — API tests will be skipped. Frontend-only tests will still run.');
    return;
  }

  console.log('[e2e] Starting Go API...');
  const api = spawn('./server', [], {
    cwd: API_DIR,
    env: {
      ...process.env,
      PORT: String(API_PORT),
      GIN_MODE: 'release',
      ALLOWED_ORIGINS: 'http://localhost:3000',
    },
    stdio: 'ignore',
  });

  if (!api.pid) throw new Error('Failed to spawn API process');
  fs.writeFileSync(PID_FILE, String(api.pid));

  await waitForPort(API_PORT);
  console.log(`[e2e] API ready on :${API_PORT}\n`);
}
