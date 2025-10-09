import {defineString} from "firebase-functions/params";

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
  return `web:scroll-it.xyz:v1.0.0 (by /u/${username})`;
}
