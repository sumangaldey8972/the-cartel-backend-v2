import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("bufferCommands", false);

const cache = globalThis.__cartelMongoose ?? { connection: null, promise: null };
globalThis.__cartelMongoose = cache;

export async function connectDatabase() {
  if (cache.connection && mongoose.connection.readyState === 1) {
    return cache.connection;
  }

  if (!env.mongoUrl) {
    throw new Error("MONGO_URL is required");
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(env.mongoUrl, {
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30_000,
      serverSelectionTimeoutMS: 5_000,
    });
  }

  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch (error) {
    cache.promise = null;
    cache.connection = null;
    throw error;
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  cache.connection = null;
  cache.promise = null;
}

export async function checkDatabaseHealth() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return { ok: false, status: "not-connected" };
  }

  try {
    await mongoose.connection.db.admin().ping();
    return { ok: true, status: "connected" };
  } catch (error) {
    return { ok: false, status: error instanceof Error ? error.message : "ping-failed" };
  }
}
