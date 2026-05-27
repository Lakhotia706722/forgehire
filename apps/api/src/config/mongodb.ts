import { MongoClient, Db } from "mongodb";
import { getEnv, isMongoEnabled } from "./env";

let client: MongoClient | undefined;
let db: Db | undefined;

export async function connectMongoDB(): Promise<void> {
  if (!isMongoEnabled()) {
    console.log("ℹ️  MongoDB skipped (SKIP_MONGODB=true)");
    return;
  }

  try {
    const env = getEnv();
    client = new MongoClient(env.MONGODB_URL!);
    await client.connect();
    db = client.db("neuronhire");
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error(
      "❌ MongoDB connection failed:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
    console.log("MongoDB disconnected");
  }
}

export function getMongoClient(): MongoClient {
  if (!client) {
    throw new Error(
      "MongoDB client not initialized. Set SKIP_MONGODB=false and ensure MongoDB is reachable.",
    );
  }
  return client;
}

export function getMongoDB(): Db {
  if (!db) {
    throw new Error(
      "MongoDB database not initialized. Set SKIP_MONGODB=false and ensure MongoDB is reachable.",
    );
  }
  return db;
}
