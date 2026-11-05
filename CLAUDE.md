# BludBowl

A Blood Bowl game in a single file, `index.html`, hosted on GitHub Pages at
https://sirspoon.github.io/BludBowl/ (served from `main`).

## Workflow
- Commit and push straight to `main` — no feature branches or pull requests.
  The owner tests changes on the live site, which updates a minute or two after a push.
- Every change to the game bumps the version by 0.01 (e.g. v2.01 → v2.02).
  The version is the `#app-version` text on the title screen in `index.html`.
  Changes that don't touch the game (like this file) don't bump it.
- With each version bump, add an entry at the top of `CHANGELOG-FULL.md` (version, date, what
  changed in plain words, linking any issue it closes) and a short entry (its heading and a line
  or two) at the top of `CHANGELOG.md`, which is what the game's "What's new" shows (a condensed
  summary, rolled up into one entry at each major version, like v4.00). Pushing tags is blocked in cloud sessions, so
  the full log is the version history.
- When a change fixes an issue, comment on it saying which version fixed it and what changed
  (`gh api -X POST repos/sirspoon/BludBowl/issues/N/comments -f body=...`). Leave the issue
  open: the owner checks the fix on the live site and closes it themselves.
- Use the GitHub REST API (`gh api repos/sirspoon/BludBowl/...`) for issues;
  `gh issue list` and other GraphQL-based commands are blocked in cloud sessions.

## Rules
- The game follows the Blood Bowl 2025 (Third Season) rules. The owner uses
  https://bloodbowlbase.ru/bb2025/ as the reference (e.g. `core_rules/league_play/`,
  `core_rules/rules_and_regulations/`). The WebFetch tool can't reach it, but `curl` from
  the shell can: fetch the page and strip the HTML to read it.

## Testing
- Two-device play (`NET` in `index.html`) uses PeerJS, which can't reach its server from a cloud session. Adding `?nettest`
  to the address swaps the network for a BroadcastChannel, so two tabs in one browser context can play each other.
  Add `&dev=A` (any letters) as well to give each tab its own saved data, like separate devices (needed to test shared leagues).
- AI testing: `?simtest` runs the game in test mode (the clock skips straight to the next event, there's almost no drawing,
  and background chores pause), so a computer-vs-computer match takes ~10s. `node tools/ai-match.js` plays batches of them in
  parallel and compares AI settings (the `AIX` switches): e.g. `--races orc,human --n 20 --new all --old rr,blitz --par 4`.
  It prints the touchdown and win splits with the chance each is just luck. Without Playwright / Chromium (the owner's PC):
  `node tools/ai-match-jsdom.js` takes the same options and runs the game in jsdom, several Node processes at once (~25-40s a
  match, ~1,500 an hour with `--par 14`); it also counts each side's 1-die and defender-picks blocks. For `--old` "everything
  but one switch", list all the others (every `AIX.on(...)` name in index.html).
- The owner prefers a quick turnaround over big test runs. For an AI change: first measure the specific behaviour it targets
  (~24 matches), then a quick results check of ~48 matches (`--n 4` over 12 races) to catch anything clearly worse. Only go to
  ~100-150 matches when that's borderline or the change matters a lot, and say when a result is too close to call.
- AI research: `ai-training/` compares the computer's play with strong human coaches on FUMBBL (300 of their matches,
  stats per team) and keeps the scripts to re-run it. Main finding so far: the AI throws about half as many blocks as
  good coaches (24 v 46 a match) and is too cautious generally (few 1-die blocks, hard dodges, rushes or re-rolls).
  Read `ai-training/README.md` before working on the AI.
- Neural-network work (on the owner's PC): start with `ai-training/HANDOVER.md`.
- Benchmark opponent: the BotBowl Season 3 scripted bot is ported into the AI module (`bbChoose` and friends, "brain:
  botbowl"). Play BludBowl's AI against it with `node tools/ai-match.js --races human --n 100 --par 4 --newp '{"brain":"botbowl"}'`
  (it's written for Humans, the only team BotBowl Season 3 has). v4.19 baseline: ours won 48, drew 31, lost 21, TDs 86-48.
- No-browser runs: `node tools/headless-match.js orc human` plays a match with index.html inside jsdom (needs `npm i jsdom`),
  the base for driving the AI from other programs. BludBowl's AI as a BotBowl bot: `AI.bridge` (index.html) + `tools/bridge-server.js`
  + `tools/botbowl/` (how to set up and run: `ai-training/botbowl-bridge.md`). Baseline in BotBowl (v4.21, 120 matches v its
  scripted bot): won 71, drew 34, lost 15, TDs 123-36.
