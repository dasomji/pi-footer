# pi-footer

A small [pi](https://pi.dev) extension that replaces the built-in footer with responsive panels:

- **GIT** — worktree, branch, optional upstream, ahead/behind counts; outside a repository it shows the working directory and `no git initialised`
- **AGENT** — estimated current context tokens as a number, context window size, active model/thinking level, plus `Fast` when `pi-codex-fast` is active for the selected model
- **STATUS** — extension-provided footer statuses from Pi's status API, such as postbox connected/disconnected state

The panel layout is inspired by [`@alasano/pi-panels`](https://github.com/alasano/house-of-pi/tree/master/packages/pi-panels), but this package intentionally has no settings command and no Spotify panel.

## Preview

Captured from real Pi TUI ANSI output, desktop-width terminals show the panels side by side:

![pi-footer desktop layout](https://raw.githubusercontent.com/dasomji/pi-footer/main/assets/pi-footer-wide.png)

Narrow terminals are mobile-ready: when there is not enough horizontal space, the panels stack vertically instead of overflowing.

![pi-footer stacked mobile layout](https://raw.githubusercontent.com/dasomji/pi-footer/main/assets/pi-footer-stacked.png)

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
- Updates agent token/model/Fast Mode info after turns and model/thinking changes.
- Shows any extension statuses published through Pi's footer status API, while avoiding duplicate Fast Mode status.
- Restores pi's default footer when the session shuts down or extensions reload.

## License

MIT
