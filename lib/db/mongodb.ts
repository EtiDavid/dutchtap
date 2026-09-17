import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  return new MongoClient(uri).connect();
}

let clientPromise: Promise<MongoClient> | undefined;

/**
 * Lazily creates the MongoDB client on first use (not at module load, so
 * builds without MONGODB_URI don't crash) and reuses a single connection
 * across hot reloads in development.
 */
export function getMongoClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = createClientPromise();
    }
    return global._mongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = createClientPromise();
  }
  return clientPromise;
}

export async function getDb() {
  const client = await getMongoClientPromise();
  return client.db();
}
