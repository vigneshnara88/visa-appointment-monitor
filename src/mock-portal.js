import { readFile } from 'node:fs/promises';
import { dateOnly, timeOnly } from './dates.js';

export class TemporaryUnavailableError extends Error {
  constructor() {
    super('The fixture marks this snapshot as temporarily unavailable');
    this.name = 'TemporaryUnavailableError';
  }
}

export function parseAvailability(snapshot) {
  if (snapshot.status === 'temporary_unavailable') throw new TemporaryUnavailableError();
  if (snapshot.status !== 'available' || !Array.isArray(snapshot.facilities)) {
    throw new TypeError('Each snapshot must contain availability or a temporary-unavailability marker');
  }
  const facilities = new Set();
  const slots = new Map();
  let datesWithoutTimes = 0;
  for (const facility of snapshot.facilities) {
    if (typeof facility.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(facility.id) ||
        facilities.has(facility.id) || !Array.isArray(facility.dates)) {
      throw new TypeError('Each snapshot needs unique facility identifiers and a dates array');
    }
    facilities.add(facility.id);
    for (const record of facility.dates) {
      const date = dateOnly(record.date);
      if (!Array.isArray(record.available_times)) throw new TypeError('available_times must be an array');
      if (!record.available_times.length) datesWithoutTimes += 1;
      for (const value of record.available_times) {
        const time = timeOnly(value);
        const key = `${facility.id}|${date}|${time}`;
        slots.set(key, { facilityId: facility.id, date, time });
      }
    }
  }
  return { slots: [...slots.values()], datesWithoutTimes };
}

/** A finite, local sequence. Reading a snapshot never contacts an external portal. */
export class MockPortal {
  constructor(snapshots) {
    if (!Array.isArray(snapshots) || !snapshots.length) {
      throw new TypeError('The fixture must contain a non-empty snapshots array');
    }
    this.snapshots = snapshots;
    this.cursor = 0;
  }

  static async fromFile(filename) {
    const fixture = JSON.parse(await readFile(filename, 'utf8'));
    return new MockPortal(fixture.snapshots);
  }

  next() {
    if (this.cursor >= this.snapshots.length) return null;
    return parseAvailability(this.snapshots[this.cursor++]);
  }
}
