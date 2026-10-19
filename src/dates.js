/** Strict date-only parsing avoids locale and timezone-dependent comparisons. */
export function dateOnly(value, name = 'date') {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`${name} must use YYYY-MM-DD format`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new RangeError(`${name} is not a calendar date`);
  }
  return value;
}

export function timeOnly(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new TypeError('Appointment times must use 24-hour HH:MM format');
  }
  return value;
}

export function utcTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new TypeError('startAt must be an ISO UTC timestamp including milliseconds');
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new RangeError('startAt is not a valid UTC timestamp');
  }
  return parsed.getTime();
}
