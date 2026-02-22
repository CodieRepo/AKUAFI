/**
 * Timezone Helper Library for AKUAFI
 *
 * CRITICAL: All timestamps are stored in UTC in the database.
 * This library provides consistent formatting for IST (Asia/Kolkata) display on the frontend.
 *
 * Policy:
 *   - Database: Always UTC (NOW() in Postgres, UTC ISO strings from APIs)
 *   - API Responses: Always return ISO 8601 UTC timestamps (Z suffix)
 *   - Frontend: Convert UTC → IST using these helpers for display only
 *   - No timezone conversion in SQL/RPC (use v_now TIMESTAMPTZ := NOW() in PL/pgSQL)
 */

/**
 * Format a UTC timestamp for display in IST (Asia/Kolkata)
 *
 * @param utcDateString - ISO 8601 UTC timestamp (e.g., "2026-02-22T10:30:00Z")
 * @param format - Display format: 'short', 'medium', 'long' (default: 'medium')
 * @returns Formatted string in IST, or '-' if input is empty
 *
 * @example
 * formatToIST("2026-02-22T10:30:00Z", "short")
 * // => "22/2/26, 4:00 PM" (IST)
 *
 * formatToIST("2026-02-22T10:30:00Z", "medium")
 * // => "Feb 22, 2026, 4:00 PM" (IST)
 */
export function formatToIST(
  utcDateString: string | null | undefined,
  format: "short" | "medium" | "long" = "medium",
): string {
  if (!utcDateString) return "-";

  try {
    const date = new Date(utcDateString);

    // Validate date
    if (isNaN(date.getTime())) return "-";

    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kolkata",
      year: "2-digit",
      month:
        format === "long" ? "long" : format === "short" ? "2-digit" : "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };

    return date.toLocaleString("en-IN", options);
  } catch {
    return "-";
  }
}

/**
 * Format a UTC timestamp for display in IST (date only, no time)
 *
 * @param utcDateString - ISO 8601 UTC timestamp
 * @returns Formatted date string in IST, or '-' if input is empty
 *
 * @example
 * formatToISTDate("2026-02-22T10:30:00Z")
 * // => "22 Feb 2026"
 */
export function formatToISTDate(
  utcDateString: string | null | undefined,
): string {
  if (!utcDateString) return "-";

  try {
    const date = new Date(utcDateString);

    // Validate date
    if (isNaN(date.getTime())) return "-";

    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "2-digit",
    };

    return date.toLocaleString("en-IN", options);
  } catch {
    return "-";
  }
}

/**
 * Format a UTC timestamp for display in IST (time only, no date)
 *
 * @param utcDateString - ISO 8601 UTC timestamp
 * @returns Formatted time string in IST, or '-' if input is empty
 *
 * @example
 * formatToISTTime("2026-02-22T10:30:00Z")
 * // => "4:00:00 PM"
 */
export function formatToISTTime(
  utcDateString: string | null | undefined,
): string {
  if (!utcDateString) return "-";

  try {
    const date = new Date(utcDateString);

    // Validate date
    if (isNaN(date.getTime())) return "-";

    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };

    return date.toLocaleString("en-IN", options);
  } catch {
    return "-";
  }
}

/**
 * Format a UTC timestamp for display in IST (compact format for tables/lists)
 *
 * @param utcDateString - ISO 8601 UTC timestamp
 * @returns Formatted compact string in IST, or '-' if input is empty
 *
 * @example
 * formatToISTCompact("2026-02-22T10:30:00Z")
 * // => "22 Feb 2026, 4:00 PM"
 */
export function formatToISTCompact(
  utcDateString: string | null | undefined,
): string {
  if (!utcDateString) return "-";

  try {
    const date = new Date(utcDateString);

    // Validate date
    if (isNaN(date.getTime())) return "-";

    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    return date.toLocaleString("en-IN", options);
  } catch {
    return "-";
  }
}

/**
 * Format a UTC timestamp for display in IST (verbose format for details/modals)
 *
 * @param utcDateString - ISO 8601 UTC timestamp
 * @returns Formatted verbose string in IST, or '-' if input is empty
 *
 * @example
 * formatToISTVerbose("2026-02-22T10:30:00Z")
 * // => "Monday, 22 February 2026 at 4:00:00 PM IST"
 */
export function formatToISTVerbose(
  utcDateString: string | null | undefined,
): string {
  if (!utcDateString) return "-";

  try {
    const date = new Date(utcDateString);

    // Validate date
    if (isNaN(date.getTime())) return "-";

    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };

    const formatted = date.toLocaleString("en-IN", options);
    return `${formatted} IST`;
  } catch {
    return "-";
  }
}

/**
 * Get the ISO 8601 UTC string from any datetime input
 * Useful for consistency when storing/sending timestamps
 *
 * @param dateInput - Date object, ISO string, or timestamp number
 * @returns ISO 8601 UTC string with Z suffix
 *
 * @example
 * toUTCISO(new Date())
 * // => "2026-02-22T10:30:00.000Z"
 */
export function toUTCISO(dateInput: Date | string | number): string {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return new Date().toISOString(); // Fallback to now
    }
    return date.toISOString();
  } catch {
    return new Date().toISOString(); // Fallback to now
  }
}

/**
 * Check if a timestamp string is in the future (IST time)
 *
 * @param utcDateString - ISO 8601 UTC timestamp
 * @returns true if the timestamp is in the future, false otherwise
 */
export function isFutureIST(utcDateString: string | null | undefined): boolean {
  if (!utcDateString) return false;

  try {
    const date = new Date(utcDateString);
    return date > new Date();
  } catch {
    return false;
  }
}

/**
 * Check if a timestamp string is in the past (IST time)
 *
 * @param utcDateString - ISO 8601 UTC timestamp
 * @returns true if the timestamp is in the past, false otherwise
 */
export function isPastIST(utcDateString: string | null | undefined): boolean {
  if (!utcDateString) return false;

  try {
    const date = new Date(utcDateString);
    return date < new Date();
  } catch {
    return false;
  }
}

/**
 * Get time remaining until a future timestamp (IST)
 *
 * @param utcDateString - ISO 8601 UTC timestamp
 * @returns Human-readable time remaining (e.g., "2 hours 30 minutes")
 */
export function getTimeRemaining(
  utcDateString: string | null | undefined,
): string {
  if (!utcDateString) return "-";

  try {
    const targetDate = new Date(utcDateString);
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ${hours}h`;
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ${minutes}m`;
    }
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  } catch {
    return "-";
  }
}
