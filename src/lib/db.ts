import mongoose from "mongoose";

import { seedSystemCategories } from "@/services/seeder";

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGO_URI environment variable inside .env");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseGlobalConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseConnectionCache: MongooseGlobalConnection | undefined;
}

if (!global.mongooseConnectionCache) {
  global.mongooseConnectionCache = { conn: null, promise: null };
}

const cached = global.mongooseConnectionCache!;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then(async (mongooseInstance) => {
      // Trigger category seeding on initial connection boot
      try {
        await seedSystemCategories();
      } catch (err) {
        console.error("Seeding error in connection helper:", err);
      }
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
