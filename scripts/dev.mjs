import { spawn } from 'node:child_process';
const children = [
  spawn(process.execPath, ['--env-file-if-exists=.env', 'server/index.mjs'], { stdio: 'inherit' }),
  spawn('npm', ['run', 'dev:client'], { stdio: 'inherit' }),
];
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    children.forEach((child) => child.kill(signal));
    process.exit(0);
  });
children.forEach((child) =>
  child.on('exit', (code) => {
    children.forEach((other) => {
      if (other !== child) other.kill();
    });
    process.exit(code ?? 0);
  }),
);
