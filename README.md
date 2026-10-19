# Visa Appointment Monitor

Appointment-availability selection and monitoring logic, motivated by the need to find an earlier visa appointment for time-sensitive competition travel.

The project separates availability parsing, date constraints, facility preferences and scheduling into small JavaScript modules. Its public demonstration uses invented local appointment snapshots and a virtual clock. It produces structured recommendations that show why slots were accepted or rejected.

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
