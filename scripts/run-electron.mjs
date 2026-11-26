import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const electronBinary = require('electron');

const cleanEnv = { ...process.env };
delete cleanEnv.ELECTRON_RUN_AS_NODE;

const args = process.argv.slice(2);
const child = spawn(electronBinary, args, {
  stdio: 'inherit',
  env: cleanEnv,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
