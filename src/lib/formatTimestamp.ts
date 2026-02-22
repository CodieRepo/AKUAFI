const IST_TZ = "Asia/Kolkata";

function isLikelyPreformatted(s: string): boolean {
  return /[A-Za-z]{3,}|,/.test(s);
}

function parseTemporalInput(input: string | Date): Date | null {
  if (typeof input === "string" && isLikelyPreformatted(input)) {
    return null;
  }

  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatUtcToIst(
  input: string | Date | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!input) return "—";

  if (typeof input === "string" && isLikelyPreformatted(input)) {
    return input;
  }

  const date = parseTemporalInput(input);
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TZ,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...opts,
  }).format(date);
}

export function istDateKey(input: string | Date | null | undefined): string {
  if (!input) return "";

  const date = parseTemporalInput(input);
  if (!date) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

export function formatToIST(
  input: string | Date | null | undefined,
  format: "short" | "medium" | "long" = "medium",
): string {
  if (format === "short") {
    return formatUtcToIst(input, {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }

  if (format === "long") {
    return formatUtcToIst(input, {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }

  return formatUtcToIst(input, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatToISTDate(
  input: string | Date | null | undefined,
): string {
  return formatUtcToIst(input, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: undefined,
    minute: undefined,
    second: undefined,
  });
}

export function formatToISTTime(
  input: string | Date | null | undefined,
): string {
  return formatUtcToIst(input, {
    year: undefined,
    month: undefined,
    day: undefined,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatToISTCompact(
  input: string | Date | null | undefined,
): string {
  return formatUtcToIst(input, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: undefined,
    hour12: true,
  });
}

export function formatToISTVerbose(
  input: string | Date | null | undefined,
): string {
  const formatted = formatUtcToIst(input, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  if (formatted === "—") return formatted;
  return `${formatted} IST`;
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
    const date = parseTemporalInput(utcDateString);
    if (!date) return false;
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
    const date = parseTemporalInput(utcDateString);
    if (!date) return false;
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
  if (!utcDateString) return "—";

  try {
    const targetDate = parseTemporalInput(utcDateString);
    if (!targetDate) return "—";
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
    return "—";
  }
}
