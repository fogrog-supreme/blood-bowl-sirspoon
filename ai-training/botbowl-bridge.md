# BludBowl's AI as a BotBowl bot (the bridge)

Goal: let BludBowl's own AI play inside BotBowl Season 3 (github.com/dhillier/botbowl-season3), so it can be tested on
someone else's engine and rules (and against their scripted bot there), without porting it: a small Python bot asks the real
JavaScript AI for every decision. The same plumbing is what a Python training loop will use later.

## Step 1: BludBowl without a browser (done, 31 Oct 2026)
`tools/headless-match.js` runs `index.html` inside jsdom (a simulated browser in Node) in test mode, with drawing and sound
stubbed out. A full computer-vs-computer match plays to the end with no page errors in ~30-45s (hidden Chrome: ~10s; speed
doesn't matter for the bridge, which asks for one decision at a time). `openGame()` gives a ready page to drive.
Needs `npm i jsdom`. jsdom's window lacks a few Node built-ins (MessageChannel, BroadcastChannel...): the tool passes them in.

## Step 2: a decision service in the page
A small API in index.html (next to `AI.debugX`), for example `window.BRIDGE`:
- `load(desc)`: set BludBowl's `state` from a description of a BotBowl position: both rosters (Humans), each player's square,
  standing/prone/stunned/used, MA left, skills; the ball; half, turn, re-rolls, Blitz/Hand-off/Pass used this turn.
  Start from a launched Human v Human match and overwrite it, so everything else is set up normally.
- `decide(kind)`: run the AI for one decision and return it: the turn plan (`choose()`: player, action, target, the route as
  squares), and the smaller ones (re-roll yes/no, block die, push square, follow up, set-up squares, kick target).

## Step 3: the Python bot
A `ProcBot` subclass in BotBowl (like `examples/scripted_bot_example.py`) that runs `node` once (JSON lines over stdin/stdout)
and, for each decision: describes the game (step 2's format), asks, and turns the answer into BotBowl actions
(`START_MOVE`/`START_BLOCK`/`START_BLITZ` + `SELECT_PLAYER`/`START_HANDOFF`, then one `MOVE` per square of the route, `BLOCK`,
`USE_REROLL`, `SELECT_*` for dice, `PUSH`, `FOLLOW_UP`, `PLACE_PLAYER`/`END_SETUP`, `PLACE_BALL`...). If BludBowl's plan isn't
legal in BotBowl (a rules difference), fall back to the closest legal action and log it.
Needs: a map between BotBowl's Human roles/skills and BludBowl's, and coordinates (BotBowl's board has a 1-square border).

## Step 4: check it
Play it against BotBowl's scripted bot in BotBowl (100+ matches, sides swapped) and compare with BludBowl's own result
(v4.19: won 48, drew 31, lost 21, TDs 86-48). Log every fallback from step 3: those are the rules differences.

Rough size: steps 2-4, two to three days.
