# BludBowl's AI as a BotBowl bot (the bridge)

Goal: let BludBowl's own AI play inside BotBowl Season 3 (github.com/dhillier/botbowl-season3), so it can be tested on
someone else's engine and rules (and against their scripted bot there), without porting it: a small Python bot asks the real
JavaScript AI for every decision. The same plumbing is what a Python training loop will use later.

## Step 1: BludBowl without a browser (done, 31 Oct 2026)
`tools/headless-match.js` runs `index.html` inside jsdom (a simulated browser in Node) in test mode, with drawing and sound
stubbed out. A full computer-vs-computer match plays to the end with no page errors in ~30-45s (hidden Chrome: ~10s; speed
doesn't matter for the bridge, which asks for one decision at a time). `openGame()` gives a ready page to drive.
Needs `npm i jsdom`. jsdom's window lacks a few Node built-ins (MessageChannel, BroadcastChannel...): the tool passes them in.

## Step 2: a decision service in the page (done, v4.20)
A small API in index.html (next to `AI.debugX`), for example `window.BRIDGE`:
- `load(desc)`: set BludBowl's `state` from a description of a BotBowl position: both rosters (Humans), each player's square,
  standing/prone/stunned/used, MA left, skills; the ball; half, turn, re-rolls, Blitz/Hand-off/Pass used this turn.
  Start from a launched Human v Human match and overwrite it, so everything else is set up normally.
- `decide(kind)`: run the AI for one decision and return it: the turn plan (`choose()`: player, action, target, the route as
  squares), and the smaller ones (re-roll yes/no, block die, push square, follow up, set-up squares, kick target).

## Step 3: the Python bot (done)
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

## Where it stands (31 Oct 2026)
Steps 1-3 work. `AI.bridge` in index.html (load, turn, reroll, dice, push, follow, setup, kick, touchback), served by
`tools/bridge-server.js` (the game in jsdom, normal clock: test mode's clock spins even when idle), used by
`tools/botbowl/bludbowl_bot.py` (a `ProcBot`; `botbowl.register_bot('bludbowl', ...)`). `tools/botbowl/play.py` plays it against
BotBowl's scripted bot inside BotBowl, sides swapping, and lists every answer that had to be adjusted to BotBowl's rules.

To run it (BotBowl Season 3 needs Python 3.8-3.11; on a machine without tkinter, play.py stands in for it):

    git clone https://github.com/dhillier/botbowl-season3 && cd botbowl-season3
    python3.11 -m venv .venv && . .venv/bin/activate
    pip install setuptools==68.2.2 wheel==0.41.3 && pip install -r requirements.txt && pip install --no-build-isolation -e .
    (in the BludBowl folder: npm i jsdom)
    python /path/to/BludBowl/tools/botbowl/play.py --n 30

First result, 30 matches (~8s each): BludBowl won 14, drew 7, lost 9, touchdowns 25-15 (in BludBowl itself, against the ported
scripted bot: 48-31-21 of 100). Adjusted: 2 Blitz targets BotBowl wouldn't offer. Fixed on the way: players out for the drive
(Sweltering Heat, a bad snack) must be marked unavailable, or set-up loops. The Apothecary and interceptions are now
asked of BludBowl too (v4.21). Still fixed: skill uses (always; BotBowl's Humans have none of the skills that ask), High Kick
(no player moved under the ball).
## Step 4: the bigger check (done, 31 Oct 2026)
120 matches in BotBowl against its scripted bot, sides swapping, with the Apothecary and interceptions also BludBowl's calls:
**BludBowl won 71, drew 34, lost 15; touchdowns 123-36** (chance of either split by luck: well under 0.1%). Home 33-19-8,
away 38-15-7. So BludBowl's edge holds on someone else's engine and rules, and is if anything bigger there than in BludBowl
itself (48-31-21 against the ported bot).
Adjusted to BotBowl's rules: 2 Blitz targets, and set-up placements BotBowl refused in a handful of the ~500 set-ups (60
squares in all, often a whole set-up at once): the skipped players start in reserve. Worth a look next: probably a
set-up asked for at a moment BludBowl reads the kicking side or squares differently (it didn't stop any match).

## Every team (v4.22, 31 Oct 2026)
BotBowl Season 3's branch `codex/local-team-expansion` (not yet merged) has all 30 Season 3 rosters (159 positions) and all
108 skills and traits; `examples/season3_teams.py` builds "coverage squads" (every position used, so they include Big Guys and
special players). `git checkout codex/local-team-expansion` in the BotBowl folder, then e.g.
`python /path/to/BludBowl/tools/botbowl/play.py --n 20 --team skaven` (both sides play that squad).

The bridge switches BludBowl to the teams' races, matches players to BludBowl's positions (name, else nearest characteristics)
and uses BludBowl's skill/trait names; the bot maps Stab, Projectile Vomit, Chainsaw, Hypnotic Gaze, bombs and Throw Team-mate
to BotBowl's actions (Kick Team-mate, Ball & Chain and the rest aren't mapped yet: they're played as plain moves and counted).
The "refused set-up placements" seen before were stale moves from a turn that ended early (fixed).

First results against BotBowl's scripted bot: Orc 6-3-1, Skaven 7-1-2, Dwarf 3-6-1 (10 matches each), Wood Elf 9-8-3 (20).
The Blitzes BotBowl wouldn't take are fixed (v4.23): rooted / distracted players are now passed across, and a Blitz plan
without a named target declares the opponent nearest where the move ends.
Next: the other 26 teams, and a 100+ match check per team for the ones that matter most.
