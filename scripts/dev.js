import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('🚀 Starting JourneyMan Development Environment...');

const serverProc = spawn(npmCmd, ['run', 'dev', '--workspace=server'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

const clientProc = spawn(npmCmd, ['run', 'dev', '--workspace=client'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\n🛑 Shutting down server and client processes...');
  serverProc.kill();
  clientProc.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
