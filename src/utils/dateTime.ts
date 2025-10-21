// Shared date/time helpers to ensure consistent handling across the app

// Some backends may omit timezone in ISO strings. When missing,
// interpret the timestamp as UTC to display correct local time.
export function parseApiDate(iso: string): Date {
  try {
    const hasTz = /([zZ]|[+-]\d\d:?\d\d)$/.test(iso);
    const normalized = hasTz ? iso : `${iso}Z`;
    return new Date(normalized);
  } catch {
    return new Date(iso);
  }
}

export function formatLocalDateTime(
  iso: string,
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = parseApiDate(iso);
    return d.toLocaleString(locales, options);
  } catch {
    return iso;
  }
}

export function relativeTimeFromNow(iso: string): string {
  try {
    // Force English output regardless of user locale
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const now = Date.now();
    const then = parseApiDate(iso).getTime();
    const diffMs = then - now;
    const absMs = Math.abs(diffMs);

    // Special-case extremely recent times as "just now"
    if (absMs < 30 * 1000) return "just now";

    const minutes = Math.round(diffMs / (60 * 1000));
    if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");

    const hours = Math.round(diffMs / (60 * 60 * 1000));
    if (Math.abs(hours) < 24) return rtf.format(hours, "hour");

    const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
    return rtf.format(days, "day");
  } catch {
    return iso;
  }
}

// Convert a YYYY-MM-DD string to a localized date label
export function dateLabelFromYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-").map((n) => parseInt(n, 10));
  const localDate = isNaN(y) || isNaN(m) || isNaN(d) ? new Date() : new Date(y, m - 1, d);
  return localDate.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
