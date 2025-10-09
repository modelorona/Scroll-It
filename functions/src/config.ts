import {defineString} from "firebase-functions/params";
import axios from "axios";
import * as logger from "firebase-functions/logger";

/**
 * Define environment parameters
 * These will be prompted during deployment if not set
 */
const allowedOriginsParam = defineString("ALLOWED_ORIGINS", {
  description: "Comma-separated list of allowed CORS origins",
  default: "",
});

const localhostSecretParam = defineString("LOCALHOST_SECRET", {
  description: "Optional secret for localhost access (leave empty to allow all localhost)",
  default: "",
});

const redditUsernameParam = defineString("REDDIT_USERNAME", {
  description: "Reddit username for User-Agent header",
});

const redditClientIdParam = defineString("REDDIT_CLIENT_ID", {
  description: "Reddit OAuth client ID (from https://www.reddit.com/prefs/apps)",
});

const redditClientSecretParam = defineString("REDDIT_CLIENT_SECRET", {
  description: "Reddit OAuth client secret",
});

/**
 * OAuth token cache
 */
let cachedToken: string | null = null;
let tokenExpiry: number = 0;
let tokenRefreshInProgress = false;

/**
 * Get allowed origins from environment configuration
 * Returns array of allowed origin URLs
 */
export function getAllowedOrigins(): string[] {
  const originsString = allowedOriginsParam.value();

  if (!originsString || originsString.trim() === "") {
    return [];
  }

  return originsString.split(",")
    .map((origin: string) => origin.trim())
    .filter((origin: string) => origin.length > 0);
}

/**
 * Get optional localhost secret from environment configuration
 * Returns undefined if not set
 */
export function getLocalhostSecret(): string | undefined {
  const secret = localhostSecretParam.value();
  return secret && secret.trim() !== "" ? secret.trim() : undefined;
}

/**
 * Get Reddit username from environment configuration
 */
export function getRedditUsername(): string {
  return redditUsernameParam.value();
}

/**
 * Generate Reddit User-Agent string according to Reddit API requirements
 * Format: <platform>:<app ID>:<version string> (by /u/<reddit username>)
 */
export function getRedditUserAgent(): string {
  const username = getRedditUsername();
  return `web:imagoid_clone:v1.0.0 (by /u/${username})`;
}

/**
 * Get Reddit OAuth credentials
 */
function getRedditCredentials() {
  return {
    clientId: redditClientIdParam.value(),
    clientSecret: redditClientSecretParam.value(),
  };
}

/**
 * Get Reddit OAuth access token (cached, auto-refreshes)
 * Uses application-only OAuth (no user login required)
 */
export async function getRedditAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  // Wait if refresh is already in progress
  while (tokenRefreshInProgress) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Check again after waiting - another request may have refreshed it
    if (cachedToken && Date.now() < tokenExpiry - 300000) {
      return cachedToken;
    }
  }

  tokenRefreshInProgress = true;

  try {
    const {clientId, clientSecret} = getRedditCredentials();
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    logger.info("Requesting new Reddit OAuth token");

    const response = await axios.post(
      "https://www.reddit.com/api/v1/access_token",
      "grant_type=client_credentials",
      {
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": getRedditUserAgent(),
        },
        timeout: 10000,
      }
    );

    const token = response.data.access_token;
    cachedToken = token;
    // Tokens typically last 1 hour (3600 seconds)
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);

    logger.info(`Reddit OAuth token acquired, expires in ${response.data.expires_in}s`);

    return token;
  } catch (error) {
    // Log error safely without exposing credentials
    if (axios.isAxiosError(error)) {
      logger.error("Failed to get Reddit OAuth token", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
      });
    } else {
      logger.error("Failed to get Reddit OAuth token: Unknown error");
    }
    throw new Error("Failed to authenticate with Reddit API");
  } finally {
    tokenRefreshInProgress = false;
  }
}
