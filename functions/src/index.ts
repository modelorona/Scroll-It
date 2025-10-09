/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions/v2";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import cors from "cors";
import {redditProxy, searchSubredditsProxy} from "./proxy";
import {cleanupExpiredRateLimits} from "./rateLimiter";
import {getAllowedOrigins, getLocalhostSecret} from "./config";

// Initialize Firebase Admin
initializeApp();

setGlobalOptions({maxInstances: 10});

export {redditProxy, searchSubredditsProxy};

// CORS handler for proxyStatus endpoint
const statusCorsHandler = cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Check if origin is localhost
    const isLocalhost = origin && (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    );

    // Allow requests with no origin (like curl)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Allow if in allowed origins list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // Allow localhost if no secret configured, or if secret matches
    if (isLocalhost) {
      callback(null, true);
      return;
    }

    logger.warn(`Blocked request from unauthorized origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  allowedHeaders: ["Content-Type", "X-Localhost-Secret"],
});

/**
 * Middleware to validate localhost secret
 */
function validateStatusLocalhostSecret(
  req: {headers: {origin?: string; "x-localhost-secret"?: string}},
  res: {status: (code: number) => {json: (data: Record<string, string>) => void}},
  next: () => void
) {
  const origin = req.headers.origin;
  const localhostSecret = getLocalhostSecret();

  // Skip validation if no localhost secret is configured
  if (!localhostSecret) {
    next();
    return;
  }

  // Check if request is from localhost
  const isLocalhost = origin && (
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:")
  );

  // If from localhost and secret is configured, validate the secret
  if (isLocalhost) {
    const providedSecret = req.headers["x-localhost-secret"];

    if (providedSecret !== localhostSecret) {
      logger.warn(`Blocked localhost request with invalid secret from: ${origin}`);
      res.status(403).json({
        error: "Forbidden",
        message: "Invalid localhost secret. Set X-Localhost-Secret header.",
      });
      return;
    }
  }

  next();
}

// Health check endpoint with actual dependency verification
export const proxyStatus = onRequest({region: "europe-west4"}, async (request, response) => {
  statusCorsHandler(request, response, () => {
    validateStatusLocalhostSecret(request, response, async () => {

      const status = {
        status: "operational" as "operational" | "degraded" | "unavailable",
        services: {
          firestore: "unknown" as "available" | "unavailable" | "unknown",
          reddit: "unknown" as "available" | "unavailable" | "unknown",
        },
        timestamp: new Date().toISOString(),
      };

      // Check Firestore (rate limiting dependency)
      try {
        const {getFirestore} = await import("firebase-admin/firestore");
        const db = getFirestore();
        // Try to read a document to verify Firestore is accessible
        await db.collection("rateLimits").limit(1).get();
        status.services.firestore = "available";
      } catch (error) {
        console.error("Firestore health check failed:", error);
        status.services.firestore = "unavailable";
        status.status = "unavailable";
      }

      // Check Reddit API accessibility
      try {
        const axios = await import("axios");
        const {getRedditUserAgent} = await import("./config.js");
        const redditResponse = await axios.default.get(
          "https://www.reddit.com/r/test.json?limit=1",
          {
            timeout: 5000,
            headers: {"User-Agent": getRedditUserAgent()},
          }
        );
        status.services.reddit = redditResponse.status === 200 ?
          "available" : "unavailable";
      } catch (error: any) {
        // Reddit may block health checks from cloud IPs (403)
        // This doesn't mean the proxy won't work for end users
        if (error.response?.status === 403) {
          logger.info("Reddit health check blocked (403) - this is expected from cloud IPs");
          status.services.reddit = "unknown";
        } else {
          logger.error("Reddit health check failed:", error);
          status.services.reddit = "unavailable";
        }
        // Reddit being blocked/down is degraded, not fully unavailable
        // (users can still use direct access, and proxy may work for them)
        if (status.status === "operational") {
          status.status = "degraded";
        }
      }

      // Return appropriate status code
      const httpStatus = status.status === "operational" ? 200 :
        status.status === "degraded" ? 200 : 503;

      response.status(httpStatus).json(status);
    });
  });
});

// Scheduled function to clean up expired rate limit entries
// Runs every hour
// Note: Cloud Scheduler uses different regions than Cloud Functions
// europe-west1 is the closest valid Cloud Scheduler region to europe-west4
export const cleanupRateLimits = onSchedule({
  schedule: "every 1 hours",
  timeZone: "UTC",
  region: "europe-west1",
}, async () => {
  await cleanupExpiredRateLimits();
});
