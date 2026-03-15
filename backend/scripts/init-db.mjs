#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const run = (command, args, { exitOnError = true } = {}) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0 && exitOnError) {
    process.exit(result.status ?? 1);
  }

  return result.status ?? 1;
};

const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
const hasMigrations = existsSync(migrationsDir) && readdirSync(migrationsDir).some((entry) => {
  return existsSync(join(migrationsDir, entry, 'migration.sql'));
});

if (hasMigrations) {
  console.log('Applying Prisma migrations...');
  run('npx', ['prisma', 'migrate', 'deploy']);
} else {
  console.log('No Prisma migrations found. Syncing schema with prisma db push...');
  const pushStatus = run('npx', ['prisma', 'db', 'push'], { exitOnError: false });

  if (pushStatus !== 0) {
    console.log('Retrying prisma db push in non-interactive mode with --accept-data-loss...');
    run('npx', ['prisma', 'db', 'push', '--accept-data-loss']);
  }
}
