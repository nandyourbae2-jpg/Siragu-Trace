// Local dev database without Docker. Usage: node scripts/dev-db.mjs [start|test]
// "start" keeps a persistent DB on :5432 (matches .env.example); "test" prints a throwaway URL after boot.
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';

const mode = process.argv[2] ?? 'start';
const dir = mode === 'test' ? './.pgdata-test' : './.pgdata';
const port = mode === 'test' ? 54329 : 5432;
const fresh = !existsSync(dir);

const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: 'siragu',
  password: 'siragupassword',
  port,
  persistent: mode !== 'test',
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
});

if (fresh) await pg.initialise();
await pg.start();
if (fresh) await pg.createDatabase('siragu_trace');
console.log(`READY postgresql://siragu:siragupassword@localhost:${port}/siragu_trace?schema=public`);

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
