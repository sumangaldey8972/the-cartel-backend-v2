import app from "./app.js";
import { checkDatabaseHealth, connectDatabase, disconnectDatabase } from "./config/database.js";
import { assertServerEnvironment, env } from "./config/env.js";
import { checkSupabaseHealth } from "./services/realtime.service.js";

assertServerEnvironment();
await connectDatabase();

const databaseHealth = await checkDatabaseHealth();
if (databaseHealth.ok) {
  console.info(`MongoDB health: connected (${databaseHealth.status})`);
} else {
  console.warn(`MongoDB health: unavailable (${databaseHealth.status})`);
}

const supabaseHealth = await checkSupabaseHealth();
if (supabaseHealth.ok) {
  console.info(`Supabase realtime health: connected (${supabaseHealth.status})`);
} else {
  console.warn(`Supabase realtime health: unavailable (${supabaseHealth.status})`);
}

const server = app.listen(env.port, () => {
  console.info(`The Cartel API listening on http://localhost:${env.port}`);
});

async function shutdown(signal) {
  console.info(`${signal} received; shutting down`);
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
