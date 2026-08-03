import { randomUUID } from "node:crypto";

const RUN_ID = process.env.TEST_RUN_ID || randomUUID().slice(0, 8);
const WORKTREE_ID = process.env.WORKTREE_ID || process.cwd().split("/").pop() || "default";
const PORT_OFFSET = hashString(`${WORKTREE_ID}:${RUN_ID}`) % 100;

export const testEnv = {
  RUN_ID,
  WORKTREE_ID,

  SUPABASE_URL: process.env.SUPABASE_URL || "http://localhost:54321",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  SUPABASE_DB_PORT: 54321 + PORT_OFFSET,
  WEB_PORT: 3000 + PORT_OFFSET,

  REDIS_URL: process.env.REDIS_URL || `redis://localhost:${6379 + PORT_OFFSET}`,

  DB_SCHEMA: `test_${RUN_ID}`,
  REDIS_PREFIX: `lddc:test:${RUN_ID}:`,
  REALTIME_CHANNEL: `test_${RUN_ID}`,
  QSTASH_QUEUE: `test-queue-${RUN_ID}`,
  EVIDENCE_DIR: `.omo/evidence/lendas-do-dc/${RUN_ID}`,
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export default testEnv;
