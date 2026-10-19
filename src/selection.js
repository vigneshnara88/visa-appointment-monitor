/**
 * Multi-facility earliest-date selection adapted from us-visa-bot.
 * Original source: Jean Carlos Gonçalves, MIT; see THIRD_PARTY_NOTICES.md.
 */
export function selectCandidate(slots, config) {
  const priority = new Map(config.facilities.map((id, index) => [id, index]));
  const rejected = { facility: 0, notEarlier: 0, beforeMinimum: 0 };
  const accepted = [];
  for (const slot of slots) {
    if (!priority.has(slot.facilityId)) rejected.facility += 1;
    else if (slot.date >= config.currentDate) rejected.notEarlier += 1;
    else if (config.minimumDate && slot.date < config.minimumDate) rejected.beforeMinimum += 1;
    else accepted.push(slot);
  }
  accepted.sort((left, right) => left.date.localeCompare(right.date) ||
    priority.get(left.facilityId) - priority.get(right.facilityId) ||
    left.time.localeCompare(right.time));
  return { candidate: accepted[0] ?? null, acceptedSlots: accepted.length, rejected };
}
