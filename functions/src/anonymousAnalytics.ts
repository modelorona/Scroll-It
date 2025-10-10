import * as maxmind from "maxmind";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

// Use MaxMind's built-in CountryResponse type
type CountryResponse = maxmind.CountryResponse;

// Cache the database in memory across function invocations
let lookupInstance: any = null;

// Path to temporary file storage (writable in Cloud Functions)
const TEMP_DB_PATH = path.join(os.tmpdir(), "GeoLite2-Country.mmdb");

/**
 * Download GeoLite2 database from Firebase Storage if needed
 */
async function downloadDatabaseFromStorage(): Promise<string> {
  try {
    // Check if file already exists in /tmp (persists during warm starts)
    if (fs.existsSync(TEMP_DB_PATH)) {
      const stats = fs.statSync(TEMP_DB_PATH);
      const ageInHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);

      // Use cached file if less than 24 hours old
      if (ageInHours < 24) {
        logger.info("Using cached GeoLite2 database from /tmp");
        return TEMP_DB_PATH;
      }
    }

    // Download from Firebase Storage
    logger.info("Downloading GeoLite2 database from Firebase Storage");
    const bucket = getStorage().bucket();
    const file = bucket.file("geolite2/GeoLite2-Country.mmdb");

    // Check if file exists in Storage
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error("GeoLite2-Country.mmdb not found in Firebase Storage at geolite2/GeoLite2-Country.mmdb");
    }

    // Download to temp directory
    await file.download({destination: TEMP_DB_PATH});
    logger.info("GeoLite2 database downloaded successfully");

    return TEMP_DB_PATH;
  } catch (error) {
    logger.error("Failed to download GeoLite2 database from Storage:", error);
    throw error;
  }
}

/**
 * Initialize GeoIP database reader
 * Downloads from Firebase Storage on first call, caches in memory
 */
export async function initializeGeoIP(): Promise<any> {
  if (!lookupInstance) {
    try {
      // Try to download/use database from Firebase Storage
      const dbPath = await downloadDatabaseFromStorage();
      lookupInstance = await maxmind.open<CountryResponse>(dbPath);
      logger.info("GeoIP database initialized from Firebase Storage");
    } catch (storageError) {
      logger.warn("Could not load from Storage, trying local fallback:", storageError);

      try {
        // Fallback: try local file if it exists (for development)
        const localPath = path.join(__dirname, "../GeoLite2-Country.mmdb");
        if (fs.existsSync(localPath)) {
          lookupInstance = await maxmind.open<CountryResponse>(localPath);
          logger.info("GeoIP database initialized from local file (development)");
        } else {
          throw new Error("No local database file found");
        }
      } catch (localError) {
        logger.error("Failed to initialize GeoIP database:", localError);
        logger.info("Country analytics will use 'XX' for all requests");
        // Return a mock reader that always returns unknown
        lookupInstance = {
          get: () => null,
        };
      }
    }
  }
  return lookupInstance;
}

/**
 * Get country code from IP address
 * Returns two-letter ISO country code or 'XX' for unknown
 * IP is processed locally and immediately discarded - not stored anywhere
 */
export function getCountryFromIP(
  ip: string,
  lookup: any
): string {
  if (!ip || ip === "unknown") {
    return "XX";
  }

  try {
    // Extract the first IP if it's a comma-separated list (from x-forwarded-for)
    const cleanIp = ip.split(",")[0].trim();

    // Skip private/local IPs
    if (
      cleanIp.startsWith("10.") ||
      cleanIp.startsWith("172.") ||
      cleanIp.startsWith("192.168.") ||
      cleanIp === "127.0.0.1" ||
      cleanIp === "::1"
    ) {
      return "XX";
    }

    const result = lookup.get(cleanIp);
    return result?.country?.iso_code || "XX";
  } catch (error) {
    logger.debug("Could not determine country for IP:", error);
    return "XX";
  }
}

/**
 * Track anonymous request by incrementing country and endpoint counters
 * No personal data is stored - only aggregated counts
 * @param country - Two-letter country code
 * @param endpoint - API endpoint name
 */
export async function trackAnonymousRequest(
  country: string,
  endpoint: string
): Promise<void> {
  try {
    const db = getFirestore();
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const statsRef = db.doc(`analytics/${month}`);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(statsRef);
      const stats = doc.data() || {
        countries: {},
        endpoints: {},
        total: 0,
        createdAt: new Date().toISOString(),
      };

      // Update aggregated counts only - no individual tracking
      stats.countries = stats.countries || {};
      stats.countries[country] = (stats.countries[country] || 0) + 1;

      stats.endpoints = stats.endpoints || {};
      stats.endpoints[endpoint] = (stats.endpoints[endpoint] || 0) + 1;

      stats.total = (stats.total || 0) + 1;
      stats.lastUpdated = new Date().toISOString();

      transaction.set(statsRef, stats);
    });

    // Log high-level stats occasionally (every 100 requests)
    if (Math.random() < 0.01) {
      logger.info(`Analytics: ${month} - Country: ${country}, Endpoint: ${endpoint}`);
    }
  } catch (error) {
    // Don't let analytics errors break the main request
    logger.error("Failed to track analytics:", error);
  }
}

/**
 * Get analytics statistics for a given month
 * Returns aggregated anonymous data only
 */
export async function getAnalyticsStats(
  month?: string
): Promise<Record<string, any>> {
  try {
    const db = getFirestore();
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const doc = await db.doc(`analytics/${targetMonth}`).get();

    if (!doc.exists) {
      return {
        month: targetMonth,
        message: "No data available for this month",
      };
    }

    const stats = doc.data()!;

    // Sort countries by count (highest first)
    const sortedCountries = Object.entries(stats.countries || {})
      .sort(([, a], [, b]) => (b as number) - (a as number));

    // Get top 20 countries
    const topCountries = sortedCountries.slice(0, 20);

    // Calculate percentages
    const total = stats.total || 0;
    const countryPercentages = topCountries.map(([country, count]) => ({
      country,
      count,
      percentage: total > 0 ? ((count as number) / total * 100).toFixed(2) : "0",
    }));

    return {
      month: targetMonth,
      total: total,
      uniqueCountries: Object.keys(stats.countries || {}).length,
      topCountries: countryPercentages,
      allCountries: stats.countries || {},
      endpoints: stats.endpoints || {},
      createdAt: stats.createdAt,
      lastUpdated: stats.lastUpdated,
    };
  } catch (error) {
    logger.error("Failed to get analytics stats:", error);
    throw new Error("Failed to retrieve analytics data");
  }
}

/**
 * Clean up old analytics data (older than 6 months)
 * Can be called periodically to manage storage
 */
export async function cleanupOldAnalytics(): Promise<void> {
  try {
    const db = getFirestore();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoffMonth = sixMonthsAgo.toISOString().slice(0, 7);

    const analyticsCollection = db.collection("analytics");
    const oldDocs = await analyticsCollection
      .where("__name__", "<", cutoffMonth)
      .get();

    if (oldDocs.empty) {
      logger.info("No old analytics data to clean up");
      return;
    }

    const batch = db.batch();
    oldDocs.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    logger.info(`Cleaned up ${oldDocs.size} old analytics documents`);
  } catch (error) {
    logger.error("Failed to clean up old analytics:", error);
    throw error;
  }
}