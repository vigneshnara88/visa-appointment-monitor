import { TemporaryUnavailableError } from './mock-portal.js';
import { selectCandidate } from './selection.js';
import { retryDelay, VirtualClock } from './scheduler.js';

export function monitor(portal, config) {
  const clock = new VirtualClock(config.startAt);
  const events = [];
  let bestRecommendation = null;
  let consecutiveFailures = 0;
  let stopReason = 'attempt_limit';
  for (let attempt = 1; attempt <= config.maximumAttempts; attempt += 1) {
    let availability;
    try {
      availability = portal.next();
    } catch (error) {
      if (!(error instanceof TemporaryUnavailableError)) throw error;
      consecutiveFailures += 1;
      const retryInSeconds = retryDelay(config, consecutiveFailures);
      events.push({ at: clock.timestamp(), attempt, type: 'temporary_unavailable',
        consecutiveFailures, retryInSeconds });
      if (consecutiveFailures >= config.maximumConsecutiveFailures) {
        stopReason = 'failure_limit';
        break;
      }
      clock.advance(retryInSeconds);
      continue;
    }
    if (availability === null) {
      stopReason = 'fixture_exhausted';
      break;
    }
    consecutiveFailures = 0;
    const selection = selectCandidate(availability.slots, config);
    const candidate = selection.candidate;
    const improvesDate = candidate && (!bestRecommendation || candidate.date < bestRecommendation.date);
    events.push({ at: clock.timestamp(), attempt, type: 'availability_checked',
      parsedSlots: availability.slots.length, datesWithoutTimes: availability.datesWithoutTimes,
      acceptedSlots: selection.acceptedSlots, rejected: selection.rejected });
    if (improvesDate) {
      bestRecommendation = { ...candidate };
      events.push({ at: clock.timestamp(), attempt, type: 'earlier_date_recommended',
        appointment: bestRecommendation });
    }
    if (candidate && config.targetDate && candidate.date <= config.targetDate) {
      stopReason = 'target_recommended';
      break;
    }
    clock.advance(config.intervalSeconds);
  }
  return {
    mode: 'offline_fixture',
    currentAppointmentDate: config.currentDate,
    bestRecommendation,
    stopReason,
    events,
  };
}
