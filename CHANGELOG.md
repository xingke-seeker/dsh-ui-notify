# Changelog

All notable changes to `dsh-ui-notify` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-15

Initial public release.

### Added

- Completion sound notification for the DeepSeek Harness web GUI: plays an embedded chime when a session's output finishes.
- **Notifications** row in **Settings → General**:
  - enable / disable reminders;
  - sound selection (None, Chime 1–3) with preview;
  - volume (0–100%);
  - ring for background sessions only, or for every session.
- Settings persist in browser `localStorage` under `dsh-ui-notify.settings` (schema-validated; falls back to defaults on read failure) — no Host settings namespace dependency.
- Audio autoplay policy handling: the first user gesture unlocks audio; a completion that rang before unlock is queued and played on the next gesture.
- Published to the npm registry as a standalone web plugin (`dsh.bundle.patch` + `dsh.client` manifest, platform `web`); no host service, tool, or session-log entry.

[0.1.0]: https://github.com/xingke-seeker/dsh-ui-notify/releases/tag/v0.1.0
