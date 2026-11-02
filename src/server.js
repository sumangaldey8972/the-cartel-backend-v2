import app from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { assertServerEnvironment, env } from "./config/env.js";

assertServerEnvironment();
await connectDatabase();

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
