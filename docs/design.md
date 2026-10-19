# Design notes

## Availability contract

The fixture is a JSON object with a non-empty `snapshots` array. A successful snapshot has `status: "available"` and a `facilities` array. Each facility has a unique `id` and a `dates` array. Each date record contains an ISO `date` and an `available_times` array using 24-hour `HH:MM` strings.

The parser flattens available times into `{facilityId, date, time}` slots and deduplicates exact matches. Dates with no available times are counted in diagnostics and cannot become recommendations. Invalid dates or times stop the demonstration with a configuration/data error rather than being silently normalized.

A `status: "temporary_unavailable"` snapshot exercises bounded retries. Reading a snapshot advances the fixture cursor, including a failure snapshot. Exhausting the sequence ends the demonstration.

## Selection rules

1. Keep only configured facilities.
2. Require a date strictly earlier than the current appointment.
3. Apply the minimum acceptable date inclusively, when supplied.
4. Sort by date, then configured facility order, then appointment time.
5. Recommend the first remaining slot.

ISO date strings are compared only after strict calendar validation. Date-only values are not interpreted in the machine's local timezone. Appointment times are local labels within a facility, so this demo does not compare absolute appointment instants across timezones.

The target date is a stopping threshold, not a lower bound or a requirement for every recommendation. A slot on or before the target ends the monitoring sequence with `target_recommended`.

## Monitor state

The original appointment date stays fixed. `bestRecommendation` records the best date observed, and a new recommendation event is emitted only for a strictly earlier date. Finding another time or facility on the same date does not generate a new recommendation. The best observed recommendation is historical; later snapshots do not guarantee that slot remains available.

Every successful snapshot resets the consecutive-failure count. Retry delays double from the configured interval up to the configured cap. The virtual clock records these delays without using timers or sleeping. The process stops when it reaches its target, exhausts fixtures, hits its total attempt limit, or reaches its consecutive-failure limit.

## Configuration

`fixture` is a local JSON path relative to the configuration file. `facilities` accepts an array or comma-separated string. Unknown configuration fields are rejected. All scheduling limits must be positive integers; the backoff cap must be at least the normal interval. The minimum and target dates must fit before the current appointment, and the target cannot precede the minimum.

## Scope

This public implementation isolates the date-selection and scheduling components of the personal appointment project. Its only input source is the local fixture adapter and its only delivery mechanism is standard output. Credentials, session storage, browser captures, applicant identifiers, real service routes and booking actions are outside the repository.
