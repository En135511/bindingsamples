// Event times are stored as venue wall-clock time ("YYYY-MM-DDTHH:mm") plus an IANA
// timezone, so the invitation always shows the time as it is at the venue, no matter
// where the guest or the server is.

function parts(local: string) {
  const [date, time = "00:00"] = local.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return { y, m, d, hh: hh || 0, mm: mm || 0 };
}

/** Treat the wall-clock value as if it were UTC — only for formatting with timeZone: "UTC". */
function wallClock(local: string) {
  const p = parts(local);
  return new Date(Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm));
}

export function formatLongDate(local: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(wallClock(local));
}

export function formatTime(local: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(wallClock(local));
}

export function dateParts(local: string) {
  const date = wallClock(local);
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(date);
  return {
    weekday: fmt({ weekday: "long" }),
    month: fmt({ month: "long" }),
    day: fmt({ day: "numeric" }),
    year: fmt({ year: "numeric" }),
  };
}

function tzOffsetMs(instant: Date, timeZone: string) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return asUtc - instant.getTime();
}

/** Convert venue wall-clock time to the real instant. */
export function toInstant(local: string, timeZone: string) {
  const guess = wallClock(local).getTime();
  let utc = guess - tzOffsetMs(new Date(guess), timeZone);
  // Second pass corrects for DST transitions between the guess and the answer.
  utc = guess - tzOffsetMs(new Date(utc), timeZone);
  return new Date(utc);
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
