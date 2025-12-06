import mongoose from 'mongoose';

// Define the structure of our cached connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the global object to include our mongoose cache
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

// Retrieve MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI as string;

// Validate that the MongoDB URI is defined
if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global cache to store the mongoose connection across hot reloads in development.
 * In production, this variable will be scoped to the serverless function.
 */
let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

// Persist cache in global scope for development hot reloading
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Establishes and returns a cached MongoDB connection using Mongoose.
 * Reuses existing connections to prevent connection pool exhaustion.
 * 
 * @returns Promise resolving to the Mongoose instance
 */
async function connectToDatabase(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // If no connection exists but a connection promise is pending, await it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable command buffering for better error handling
    };

    // Create new connection promise
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    // Await the connection promise and cache the result
    cached.conn = await cached.promise;
  } catch (error) {
    // Clear the promise on error to allow retry
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;
