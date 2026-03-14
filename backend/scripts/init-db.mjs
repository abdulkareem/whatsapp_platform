#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
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
  run('npx', ['prisma', 'db', 'push']);
}
