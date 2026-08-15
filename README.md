# dsh-ui-notify

Completion sound notifications for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web GUI. When a session's output finishes, the plugin plays an embedded chime; the **Notifications** row in **Settings → General** turns it on or off, picks a sound (with preview), sets the volume, and chooses whether to ring for background sessions only or every session.

Settings persist in browser `localStorage`. The plugin is a pure web plugin — it registers no host service, no tool, and no session-log entry.

## Install

```sh
dsh plugin --profile web add dsh-ui-notify
```

Then restart the profile (`dsh --profile web`) so the new package metadata is picked up.

To install straight from a git host, pin a commit and allow the `prepare` build script in the profile's `pnpm-workspace.yaml`:

```sh
dsh plugin --profile web add github:xingke-seeker/dsh-ui-notify#<sha>
```

```yaml
# in the profile's pnpm-workspace.yaml
allowBuilds:
  dsh-ui-notify: true
```

## Configuration

All settings live under the **Notifications** row (General settings), stored in `localStorage` under `dsh-ui-notify.settings`:

| Field | Values | Default |
|---|---|---|
| Enable reminders | on / off | on |
| Sound | None, Chime 1–3 | Chime 1 |
| Volume | 0–100% | 50% |
| Remind when | Background session finishes / Any session finishes | Background |

The first user gesture unlocks the audio (browser autoplay policy); a completion that rang before unlock is queued and played on the next gesture.

## Development

```sh
pnpm install
pnpm run typecheck
pnpm run test
pnpm run build
```

`pnpm run build` runs the two-project TypeScript build (node half + browser half) then bundles `lib/client.js` with tsdown. `pnpm run prepare` is the self-contained git-install build: it transpiles both halves from source without the type-checked peer graph.

## License

MIT
