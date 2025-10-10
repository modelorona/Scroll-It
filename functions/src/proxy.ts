import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import axios from "axios";
import cors from "cors";
import {rateLimit} from "./rateLimiter";
import {getAllowedOrigins, getLocalhostSecret, getRedditAccessToken, getRedditUserAgent} from "./config";
import {checkMonthlyLimit} from "./monthlyLimit";
import {initializeGeoIP, getCountryFromIP, trackAnonymousRequest} from "./anonymousAnalytics";

// CORS handler with origin validation
const corsHandler = cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // Check if origin is localhost
    const isLocalhost = origin && (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    );

    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Allow if in allowed origins list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // Allow localhost
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
 * Middleware to validate localhost requests with optional secret
 */
function validateLocalhostSecret(
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

// Rate limit: 5 requests per minute per IP
const redditRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
});

// Rate limit: 10 requests per minute per IP for search
const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
});

// Initialize GeoIP database (lazy-loaded on first request)
let geoIPLookup: any = null;

export const redditProxy = onRequest({region: "europe-west4"}, (request, response) => {
  corsHandler(request, response, () => {
    validateLocalhostSecret(request, response, () => {
      redditRateLimiter(request, response, async () => {
        // Check monthly invocation limit
        const withinLimit = await checkMonthlyLimit();
        if (!withinLimit) {
          response.status(429).json({
            error: "Monthly Limit Exceeded",
            message: "Service has reached its monthly usage limit. Please try again next month.",
          });
          return;
        }

        // Initialize GeoIP database if not already done
        if (!geoIPLookup) {
          try {
            geoIPLookup = await initializeGeoIP();
          } catch (error) {
            logger.error("Failed to initialize GeoIP:", error);
            // Continue without analytics on error
          }
        }

        // Track country analytics (privacy-compliant, no IP storage)
        if (geoIPLookup) {
          try {
            const ip = (request.headers["x-forwarded-for"] as string) || (request as any).ip || "unknown";
            const country = getCountryFromIP(ip, geoIPLookup);
            // Fire and forget - don't wait for analytics
            trackAnonymousRequest(country, "redditProxy").catch((err) =>
              logger.debug("Analytics tracking error:", err)
            );
          } catch (error) {
            logger.debug("Could not track analytics:", error);
          }
        }

        const subreddit = request.query.subreddit as string;
        const after = request.query.after as string;

        if (!subreddit) {
          response.status(400).json({
            error: "Bad Request",
            message: "Subreddit is required",
          });
          return;
        }

        // Validate subreddit name format (alphanumeric, underscores, hyphens only, 3-21 chars)
        if (!/^[a-zA-Z0-9_-]{3,21}$/.test(subreddit)) {
          response.status(400).json({
            error: "Bad Request",
            message: "Invalid subreddit name format",
          });
          return;
        }

        // Validate after token if provided (Reddit pagination tokens format: t[0-9]_[alphanumeric])
        if (after && !/^t[0-9]_[a-zA-Z0-9_-]+$/.test(after)) {
          response.status(400).json({
            error: "Bad Request",
            message: "Invalid pagination token format",
          });
          return;
        }

        // Use OAuth endpoint with authentication
        const token = await getRedditAccessToken();
        const url = `https://oauth.reddit.com/r/${subreddit}/${after ? `?after=${after}` : ""}`;

        try {
          const redditResponse = await axios.get(url, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "User-Agent": getRedditUserAgent(),
            },
            timeout: 10000,
          });
          response.status(200).send(redditResponse.data);
        } catch (error) {
          logger.error("Error fetching from Reddit API:", error);
          if (axios.isAxiosError(error) && error.response) {
            response.status(error.response.status).send(error.response.data);
          } else {
            response.status(500).send("Error fetching from Reddit API");
          }
        }
      });
    });
  });
});

export const searchSubredditsProxy = onRequest({region: "europe-west4"}, (request, response) => {
  corsHandler(request, response, () => {
    validateLocalhostSecret(request, response, () => {
      searchRateLimiter(request, response, async () => {
        // Check monthly invocation limit
        const withinLimit = await checkMonthlyLimit();
        if (!withinLimit) {
          response.status(429).json({
            error: "Monthly Limit Exceeded",
            message: "Service has reached its monthly usage limit. Please try again next month.",
          });
          return;
        }

        // Initialize GeoIP database if not already done
        if (!geoIPLookup) {
          try {
            geoIPLookup = await initializeGeoIP();
          } catch (error) {
            logger.error("Failed to initialize GeoIP:", error);
            // Continue without analytics on error
          }
        }

        // Track country analytics (privacy-compliant, no IP storage)
        if (geoIPLookup) {
          try {
            const ip = (request.headers["x-forwarded-for"] as string) || (request as any).ip || "unknown";
            const country = getCountryFromIP(ip, geoIPLookup);
            // Fire and forget - don't wait for analytics
            trackAnonymousRequest(country, "searchSubredditsProxy").catch((err) =>
              logger.debug("Analytics tracking error:", err)
            );
          } catch (error) {
            logger.debug("Could not track analytics:", error);
          }
        }

        const query = request.query.query as string;

        if (!query) {
          response.status(400).send("Query is required");
          return;
        }

        // Use OAuth endpoint with authentication
        const token = await getRedditAccessToken();
        const url = `https://oauth.reddit.com/api/search_reddit_names?query=${encodeURIComponent(query)}&include_over_18=true`;

        logger.info(`Proxying subreddit search request to: ${url}`);

        try {
          const redditResponse = await axios.get(url, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "User-Agent": getRedditUserAgent(),
            },
            timeout: 10000,
          });
          response.status(200).send(redditResponse.data);
        } catch (error) {
          logger.error("Error fetching from Reddit API:", error);
          if (axios.isAxiosError(error) && error.response) {
            response.status(error.response.status).send(error.response.data);
          } else {
            response.status(500).send("Error fetching from Reddit API");
          }
        }
      });
    });
  });
});