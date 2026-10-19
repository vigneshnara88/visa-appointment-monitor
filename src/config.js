import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { dateOnly, utcTimestamp } from './dates.js';

// Facility-list parsing follows the original project's configuration component.
export function parseFacilities(value) {
  const items = typeof value === 'string' ? value.split(',') : value;
  if (!Array.isArray(items) || items.some((item) => typeof item !== 'string')) {
    throw new TypeError('facilities must be an array or comma-separated string');
  }
  const facilities = [...new Set(items.map((item) => item.trim()).filter(Boolean))];
  if (!facilities.length || facilities.some((item) => !/^[a-zA-Z0-9_-]+$/.test(item))) {
    throw new TypeError('Use at least one simple facility identifier');
  }
  return facilities;
}

function positiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive integer`);
  }
  return value;
}

export async function loadConfig(filename) {
  const configPath = path.resolve(filename);
  const raw = JSON.parse(await readFile(configPath, 'utf8'));
  const allowed = new Set([
    'fixture', 'facilities', 'currentDate', 'minimumDate', 'targetDate', 'startAt',
    'intervalSeconds', 'maximumBackoffSeconds', 'maximumAttempts', 'maximumConsecutiveFailures',
  ]);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) throw new TypeError(`Unsupported configuration field: ${key}`);
  }
  if (typeof raw.fixture !== 'string' || !raw.fixture.endsWith('.json') || /^[a-z]+:/i.test(raw.fixture)) {
    throw new TypeError('fixture must be a relative local JSON path');
  }
  if (path.isAbsolute(raw.fixture)) throw new TypeError('fixture must be relative to the configuration');
  const config = {
    fixture: path.resolve(path.dirname(configPath), raw.fixture),
    facilities: parseFacilities(raw.facilities),
    currentDate: dateOnly(raw.currentDate, 'currentDate'),
    minimumDate: raw.minimumDate == null ? null : dateOnly(raw.minimumDate, 'minimumDate'),
    targetDate: raw.targetDate == null ? null : dateOnly(raw.targetDate, 'targetDate'),
    startAt: utcTimestamp(raw.startAt),
    intervalSeconds: positiveInteger(raw.intervalSeconds, 'intervalSeconds'),
    maximumBackoffSeconds: positiveInteger(raw.maximumBackoffSeconds, 'maximumBackoffSeconds'),
    maximumAttempts: positiveInteger(raw.maximumAttempts, 'maximumAttempts'),
    maximumConsecutiveFailures: positiveInteger(raw.maximumConsecutiveFailures, 'maximumConsecutiveFailures'),
  };
  if (config.minimumDate && config.minimumDate >= config.currentDate) {
    throw new RangeError('minimumDate must be earlier than currentDate');
  }
  if (config.targetDate && (config.targetDate >= config.currentDate ||
      (config.minimumDate && config.targetDate < config.minimumDate))) {
    throw new RangeError('targetDate must be within the acceptable date window');
  }
  if (config.maximumBackoffSeconds < config.intervalSeconds) {
    throw new RangeError('maximumBackoffSeconds must be at least intervalSeconds');
  }
  return Object.freeze(config);
}
