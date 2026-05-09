import { MongoClient, Db } from 'mongodb';
import { getEnv } from './env';

let client: MongoClient;
let db: Db;

export async function connectMongoDB(): Promise<void> {
  try {
    const env = getEnv();
    client = new MongoClient(env.MONGODB_URL);
    await client.connect();
    db = client.db('neuronhire');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    console.log('MongoDB disconnected');
  }
}

export function getMongoClient(): MongoClient {
  if (!client) {
    throw new Error('MongoDB client not initialized. Call connectMongoDB() first.');
  }
  return client;
}

export function getMongoDB(): Db {
  if (!db) {
    throw new Error('MongoDB database not initialized. Call connectMongoDB() first.');
  }
  return db;
}
