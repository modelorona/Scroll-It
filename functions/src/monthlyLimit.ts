import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const MONTHLY_INVOCATION_LIMIT = 2000000; // 2 million
const MONTHLY_LIMIT_DOC = "limits/monthly";

interface MonthlyLimitData {
  count: number;
  month: string; // Format: YYYY-MM
  resetAt: number; // Unix timestamp
}

/**
 * Get current month string (YYYY-MM format)
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get timestamp for start of next month
 */
function getNextMonthTimestamp(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.getTime();
}

/**
 * Check and increment monthly invocation counter
 * Returns true if under limit, false if limit exceeded
 */
export async function checkMonthlyLimit(): Promise<boolean> {
  try {
    const db = getFirestore();
    const limitRef = db.doc(MONTHLY_LIMIT_DOC);
    const currentMonth = getCurrentMonth();

    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(limitRef);
      const data = doc.exists ? doc.data() as MonthlyLimitData : null;

      // Reset counter if it's a new month or doesn't exist
      if (!data || data.month !== currentMonth) {
        const newData: MonthlyLimitData = {
          count: 1,
          month: currentMonth,
          resetAt: getNextMonthTimestamp(),
        };
        transaction.set(limitRef, newData);
        logger.info(`Monthly limit reset for ${currentMonth}: 1/${MONTHLY_INVOCATION_LIMIT}`);
        return true;
      }

      // Check if limit exceeded
      if (data.count >= MONTHLY_INVOCATION_LIMIT) {
        logger.warn(`Monthly invocation limit exceeded: ${data.count}/${MONTHLY_INVOCATION_LIMIT}`);
        return false;
      }

      // Increment counter
      const updatedData: MonthlyLimitData = {
        count: data.count + 1,
        month: currentMonth,
        resetAt: data.resetAt,
      };
      transaction.set(limitRef, updatedData);

      // Log warning when approaching limit (at 90%)
      if (data.count >= MONTHLY_INVOCATION_LIMIT * 0.9) {
        logger.warn(
          `Monthly limit warning: ${data.count}/${MONTHLY_INVOCATION_LIMIT} ` +
          `(${Math.round((data.count / MONTHLY_INVOCATION_LIMIT) * 100)}%)`
        );
      }

      return true;
    });

    return result;
  } catch (error) {
    logger.error("Error checking monthly limit:", error);
    // Fail open (allow request) if limit check fails to avoid blocking all traffic
    return true;
  }
}

/**
 * Get current monthly usage stats
 */
export async function getMonthlyStats(): Promise<MonthlyLimitData | null> {
  try {
    const db = getFirestore();
    const limitRef = db.doc(MONTHLY_LIMIT_DOC);
    const doc = await limitRef.get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as MonthlyLimitData;
  } catch (error) {
    logger.error("Error getting monthly stats:", error);
    return null;
  }
}
