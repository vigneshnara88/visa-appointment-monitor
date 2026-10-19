# Visa Appointment Monitor

Appointment-availability selection and monitoring logic, motivated by the need to find an earlier visa appointment for time-sensitive competition travel.

The project separates availability parsing, date constraints, facility preferences and scheduling into small JavaScript modules. Its public demonstration uses invented local appointment snapshots and a virtual clock. It produces structured recommendations that show why slots were accepted or rejected.

## Motivation

An appointment can become a constraint on a trip even when the rest of the planning is in place. The motivating personal problem was finding an earlier visa appointment for competition travel. Checking a list of dates repeatedly is only part of that problem: an earlier date must also fit a usable travel window, be at an acceptable facility and improve on an appointment already held.

This repository focuses on making those decisions explicit. It turns successive availability snapshots into a small, inspectable decision process: validate what was observed, apply the person's constraints, choose a candidate consistently, and explain when to recommend it or stop looking. Separating those responsibilities also makes the scheduling and selection logic easier to understand independently of a particular appointment portal.

## How the decision process works

The configuration describes the existing appointment, the earliest usable date, a target date and an ordered list of facilities. Each snapshot is normalized into dated appointment slots. The selector keeps slots at configured facilities that are earlier than the current appointment and meet the minimum date, then orders them by date, facility preference and time.

For example, someone with a July appointment may be willing to travel from June onwards and hope to secure a slot by mid-June. A May slot is too early to use; a later July slot does not improve the current booking. A suitable June slot can become a recommendation. The target date controls when monitoring stops, so an improvement can still be reported before that target is reached.

The monitor retains the best date it has recommended. Repeated sightings of the same date do not generate repeated recommendation events, while a strictly earlier date does. Temporary failures trigger progressively longer retry delays up to a cap. Attempt limits, consecutive-failure limits, reaching the target and exhausting the snapshot sequence all provide explicit stopping conditions. A recommendation remains an observation, and the original appointment is kept separate from it.

## What it demonstrates

- Strict calendar-date and appointment-time validation.
- Filtering across multiple facilities with an optional earliest acceptable date.
- Earliest-date selection, deterministic facility preferences and time selection.
- Missing-time handling and duplicate-slot removal.
- Bounded retries, capped exponential backoff and stop conditions.
- Suppression of repeated recommendations until an earlier date appears.
- Separation of a current appointment from an unconfirmed recommendation.

## Run the offline example

Requires Node.js 18 or later. There are no external runtime dependencies.

```bash
node src/index.js
# Or supply another local configuration:
node src/index.js config.example.json
```

The command reads `fixtures/availability.json` and writes a JSON event report to standard output. All dates, facility identifiers and availability in that fixture are invented. The simulated clock advances instantly; the program performs no live polling or real-time waits.

`config.example.json` supplies the current appointment, acceptable date window, facility preference order and scheduling limits. The example sequence covers no suitable availability, a temporary failure, an earlier recommendation, repeated availability and a recommendation meeting the target.

The application contains no login, booking, saved-session or message-delivery integration. A recommendation describes an observed fixture slot and does not reserve it or change the current appointment.

## Code layout

| Module | Responsibility |
| --- | --- |
| `src/config.js` | Local configuration loading, facility parsing and constraints. |
| `src/dates.js` | ISO date-only, time-only and UTC timestamp validation. |
| `src/mock-portal.js` | Finite snapshot source and availability normalization. |
| `src/selection.js` | Date filtering and ordered candidate selection. |
| `src/scheduler.js` | Virtual clock and retry-delay calculation. |
| `src/monitor.js` | Monitoring state, recommendations, diagnostics and stop reasons. |
| `src/index.js` | CLI entry point and JSON output. |

The [design note](docs/design.md) describes the fixture contract, tie-breaking rules and state transitions.

## Attribution

This project builds on the MIT-licensed [us-visa-bot](https://github.com/jeangnc/us-visa-bot) by Jean Carlos Gonçalves. The facility-list parsing and earliest-date selection preserve core ideas from that source. See [third-party notices](THIRD_PARTY_NOTICES.md) and [LICENSE](LICENSE).
