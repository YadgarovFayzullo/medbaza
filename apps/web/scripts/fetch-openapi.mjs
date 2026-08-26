/**
 * Pull the OpenAPI document from a running API into `lib/api-client/openapi.json`.
 *
 * The typed client is generated from this file — the frontend never hand-writes
 * a type for an API payload (CLAUDE.md §2). Run `npm run generate:api` whenever a
 * router schema changes, and commit the generated diff in the same PR.
 */
import { writeFile } from 'node:fs/promises';

const source = process.env.API_URL ?? 'http://localhost:8000';
const target = new URL('../lib/api-client/openapi.json', import.meta.url);

const response = await fetch(`${source}/openapi.json`);
if (!response.ok) {
  console.error(
    `Could not read ${source}/openapi.json (${response.status}).\n` +
      'Start the API first: cd apps/api && uvicorn app.main:app --reload',
  );
  process.exit(1);
}

await writeFile(target, `${JSON.stringify(await response.json(), null, 2)}\n`);
console.log(`Wrote ${target.pathname}`);
