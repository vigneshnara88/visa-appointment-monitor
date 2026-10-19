/** Pure scheduling arithmetic: time advances in the report, with no real waiting. */
export function retryDelay(config, consecutiveFailures) {
  return Math.min(config.maximumBackoffSeconds,
    config.intervalSeconds * 2 ** Math.max(0, consecutiveFailures - 1));
}

export class VirtualClock {
  constructor(startAt) { this.now = startAt; }

  timestamp() { return new Date(this.now).toISOString(); }

  advance(seconds) {
    this.now += seconds * 1000;
    if (!Number.isFinite(this.now) || Math.abs(this.now) > 8.64e15) {
      throw new RangeError('Virtual clock exceeded the supported date range');
    }
  }
}
