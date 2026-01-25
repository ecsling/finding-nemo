import { MongoClient } from 'mongodb';

// Allow builds without MongoDB during static generation
const uri = process.env.MONGODB_URI || '';
const options = {};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

// Only connect if URI is provided (skip during build if not needed)
if (uri && typeof window === 'undefined') {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable to preserve the MongoDB client across hot reloads
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

export default clientPromise;
