# pi-footer

A small [pi](https://pi.dev) extension that replaces the built-in footer with two responsive panels:

- **GIT** — worktree, branch, optional upstream, ahead/behind counts; outside a repository it shows the working directory and `no git initialised`
- **AGENT** — estimated current context tokens as a number, context window size, active model/thinking level

The panel layout is inspired by [`@alasano/pi-panels`](https://github.com/alasano/house-of-pi/tree/master/packages/pi-panels), but this package intentionally has no settings command and no Spotify panel.

## Install

From npm:

```bash
pi install npm:@wienerberliner/pi-footer
```

Or directly from GitHub:

```bash
pi install git:github.com/dasomji/pi-footer
```

Then restart pi or run `/reload`.

## Behavior

- Auto-enables on session start in interactive UI mode.
- Refreshes git state every 5 seconds and after each agent turn.
- Updates agent token/model info after turns and model/thinking changes.
- Restores pi's default footer when the session shuts down or extensions reload.

## License

MIT
