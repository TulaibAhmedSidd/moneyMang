import { connectToDatabase } from "./db";
import RateLimit from "@/models/RateLimit";

/**
 * Checks if a given IP address is rate limited on an endpoint.
 * Returns true if rate limited, false otherwise.
 *
 * @param ip Client IP address
 * @param endpoint Endpoint identifier (e.g. "/api/v1/auth/login")
 * @param limit Max hits allowed in the window
 * @param windowMs Time window in milliseconds
 */
export async function isRateLimited(
  ip: string,
  endpoint: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  await connectToDatabase();

  const key = `${ip}:${endpoint}`;

  // Find existing rate limit record
  const record = await RateLimit.findOne({ key });

  if (record) {
    if (record.hits >= limit) {
      return true;
    }

    // Increment count
    record.hits += 1;
    await record.save();
    return false;
  } else {
    // Create new rate limit window log
    await RateLimit.create({
      key,
      hits: 1,
      resetAt: new Date(Date.now() + windowMs),
    });
    return false;
  }
}
