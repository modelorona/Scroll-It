// Use any to avoid type conflicts between express versions
/* eslint-disable @typescript-eslint/no-explicit-any */
import {getFirestore} from "firebase-admin/firestore";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
}

/**
 * Production-ready rate limiting middleware using Firestore
 * @param config - Rate limit configuration
 * @return Middleware function
 */
export function rateLimit(config: RateLimitConfig) {
  return async (req: any, res: any, next: () => void) => {
    try {
      const db = getFirestore();
      const rateLimitCollection = db.collection("rateLimits");

      // Get client identifier (IP address or user agent)
      const clientId = req.ip ||
        (req.headers["x-forwarded-for"] as string) ||
        (req.headers["user-agent"] as string) ||
        "unknown";

      // Create a safe document ID (Firestore doesn't allow certain chars)
      const docId = Buffer.from(clientId).toString("base64")
        .replace(/[/+=]/g, "_");

      const now = Date.now();
      const docRef = rateLimitCollection.doc(docId);

      // Use Firestore transaction to ensure atomic read-modify-write
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const entry = doc.exists ?
          doc.data() as RateLimitEntry : null;

        if (!entry || entry.resetTime < now) {
          // First request or window expired, create new entry
          const newEntry: RateLimitEntry = {
            count: 1,
            resetTime: now + config.windowMs,
          };
          transaction.set(docRef, newEntry, {merge: true});

          res.setHeader("X-RateLimit-Limit", config.maxRequests.toString());
          res.setHeader("X-RateLimit-Remaining",
            (config.maxRequests - 1).toString());
          res.setHeader("X-RateLimit-Reset",
            Math.ceil((now + config.windowMs) / 1000).toString());
        } else if (entry.count < config.maxRequests) {
          // Within limit, increment counter
          const updatedEntry: RateLimitEntry = {
            count: entry.count + 1,
            resetTime: entry.resetTime,
          };
          transaction.set(docRef, updatedEntry, {merge: true});

          res.setHeader("X-RateLimit-Limit", config.maxRequests.toString());
          res.setHeader("X-RateLimit-Remaining",
            (config.maxRequests - entry.count - 1).toString());
          res.setHeader("X-RateLimit-Reset",
            Math.ceil(entry.resetTime / 1000).toString());
        } else {
          // Rate limit exceeded
          res.setHeader("X-RateLimit-Limit", config.maxRequests.toString());
          res.setHeader("X-RateLimit-Remaining", "0");
          res.setHeader("X-RateLimit-Reset",
            Math.ceil(entry.resetTime / 1000).toString());
          res.setHeader("Retry-After",
            Math.ceil((entry.resetTime - now) / 1000).toString());

          res.status(429).json({
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please try again later.",
            retryAfter: Math.ceil((entry.resetTime - now) / 1000),
          });
          return; // Don't call next() when rate limited
        }
      });

      // Only call next() if we haven't sent a 429 response
      if (!res.headersSent) {
        next();
      }
    } catch (error) {
      // Log error and block the request (fail-closed)
      console.error("Rate limiter error:", error);
      res.status(503).json({
        error: "Service Unavailable",
        message: "Rate limiting service is currently unavailable. Please try again later.",
      });
    }
  };
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically (e.g., via Cloud Scheduler)
 */
export async function cleanupExpiredRateLimits() {
  try {
    const db = getFirestore();
    const rateLimitCollection = db.collection("rateLimits");
    const now = Date.now();

    // Query for expired entries
    const expiredDocs = await rateLimitCollection
      .where("resetTime", "<", now)
      .limit(500) // Process in batches
      .get();

    if (expiredDocs.empty) {
      console.log("No expired rate limit entries to clean up");
      return;
    }

    // Delete expired entries in batch
    const batch = db.batch();
    expiredDocs.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${expiredDocs.size} expired rate limit entries`);
  } catch (error) {
    console.error("Error cleaning up rate limits:", error);
    throw error;
  }
}
