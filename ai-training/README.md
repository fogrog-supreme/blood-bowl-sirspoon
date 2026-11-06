# AI training data

Comparing how the computer plays BludBowl with how strong human coaches play on
[FUMBBL](https://fumbbl.com), to find where the AI should change. Nothing in this folder is part of the game.

## What's here

| File | What it is |
|---|---|
| `data/fumbbl-top-coaches.jsonl.gz` | 300 FUMBBL Competitive-division matches (2025 rules, FUMBBL ruleset "BB2025") between coaches rated 1550+, collected 15 Oct 2026. One line per match: `match` (teams, coaches and ratings, scores, per-player stats) and `stats` (FUMBBL's dice and action stats for each side, including a turn-by-turn breakdown). |
| `data/bludbowl-v3.04.jsonl.gz` | 180 BludBowl computer-v-computer matches on v3.04, every team about 12 games against random opponents. One line per match: every dodge / rush / pick-up / pass roll (target, result), every block (dice, who picks), every turnover (and why), every team re-roll. |
| `data/bludbowl-v3.02.jsonl.gz` | The same for v3.02 (84 matches), before the v3.03 pick-up change. |
| `bb-stats.js` | Plays the BludBowl matches and records those stats (uses the `?simtest` test mode, ~8s a match). |
| `compare.py` | Prints FUMBBL and BludBowl side by side, overall and (with `--races`) per team. |
| `fumbbl-collect.py` | Downloads more FUMBBL matches and their stats (one request a second). |
| `data/fumbbl-replays/` | 100 full FUMBBL replays (Oct 2026; 29 more added after the first 71, one for each of the least-covered teams and then the best-rated remaining matches), the best-rated coaches' matches from the 300 above: four each for Orc, Human, Skaven, Dwarf, Lizardmen, Wood Elf, Chaos Chosen, Shambling Undead, Black Orc, Nurgle, High Elf and Amazon (Dwarf: all four there are), two each for Khorne, Necromantic Horror, Old World Alliance, Tomb Kings, Chaos Dwarf, Ogre, Imperial Nobility, Bretonnian, Norse, Dark Elf, Vampire and Elven Union (both sides of each match are in the file, so most teams appear more often). FUMBBL's own gzipped JSON, unchanged; `index.json` lists them. |
| `fumbbl-replays.py` | Downloads a few more replays into `data/fumbbl-replays/` (one every 3 seconds; skips ones already there). |
| `fumbbl-setups.py` | Kick-off set-ups from those replays: a summary, `--show <race>` draws them, `--bb <file>` summarises BludBowl's the same way. |
| `bb-setups.js` | The BludBowl computer's kick-off set-ups, from mirror matches, for `fumbbl-setups.py --bb`. |
| `fumbbl-fetch-replays.js` | Downloads full FUMBBL replays. Untested, and can't run from a cloud session (see below). |

## What it showed (v3.04, per team per match)

| | FUMBBL top coaches | BludBowl AI |
|---|---|---|
| Touchdowns | 1.08 | 0.74 |
| Casualties caused | 2.4 | 1.4 |
| **Blocks thrown** | **46** | **24** |
| 1-die blocks | 5.1 | 1.0 |
| Blocks where the opponent picks the dice | 0.8 | 0.1 |
| Dodges tried | 13.7 | 10.5 |
| ... at 4+ or harder | 1.4 | 0.2 |
| Rushes (going for it) | 9.0 | 5.5 |
| Team re-rolls used | 4.7 | 2.6 |
| Turnovers | 5.3 | 4.0 |
| Turnovers from failed pick-ups (incl. Secure the Ball) | 0.5 | 0.8 |

1. **The computer throws about half as many blocks as good coaches** (about 1.5 a turn against 3). This holds for
   every team compared, e.g. Orcs 50 v 24, Humans 41 v 15, High Elves 30 v 11, Khorne 58 v 34. It is the biggest gap
   and probably behind much of the casualty and touchdown gap too.
2. **It is too cautious in general:** far fewer 1-die blocks, hard dodges and rushes, and it spends about half as many
   re-rolls. It still has nearly as many turnovers, because it does much less each turn for a similar number of failures.
3. **Pick-ups fail too often:** about 19% of its turnovers are failed pick-ups against 9% for good coaches.

Next step suggested: find out why it blocks so little (players moved next to opponents without blocking? turns ended
with players who could still block?), fix it behind an `AIX` switch, and test it with `tools/ai-match.js`. Then re-run
`bb-stats.js` and `compare.py` to see whether the gap has closed.

### Things to keep in mind
- FUMBBL teams are developed league teams (more Block, Guard, Mighty Blow, extra re-rolls); BludBowl's are starting
  rosters. That inflates the human casualty, 1-die block and re-roll numbers somewhat, but can't explain blocking half
  as often across every team.
- FUMBBL may count a re-rolled dodge or rush as two rolls; BludBowl counts each attempt once. So those two gaps may be a
  little smaller than shown. FUMBBL's re-roll count may include skill re-rolls (Dodge, Sure Hands...).
- Passes aren't comparable: FUMBBL counts completions, `bb-stats.js` counts accurate pass rolls.
- A good coach rating isn't perfect play; it's a yardstick, not a target to copy exactly.

## Progress check: v3.16 (Oct 2026)
The same 180 matches (`data/bludbowl-v3.16.jsonl.gz`), per team per match:

| | FUMBBL top coaches | v3.04 | v3.16 |
|---|---|---|---|
| Touchdowns | 1.08 | 0.74 | **0.88** |
| Casualties caused | 2.39 | 1.37 | 1.45 |
| Blocks thrown | 46.2 | 23.8 | 25.4 |
| 1-die blocks | 5.05 | 0.97 | 1.14 |
| Dodges tried (at 4+ or harder) | 13.7 (1.42) | 10.5 (0.23) | 10.3 (0.23) |
| Rushes tried | 9.0 | 5.5 | **3.1** |
| Team re-rolls used | 4.67 | 2.63 | 3.21 |
| Turnovers | 5.25 | 4.04 | 3.57 |
| Passes (accurate) | 0.40 | 0.06 | 0.12 |
| Pick-up turnovers (incl. Secure the Ball) | about 0.47 | 0.76 | 0.80 |

- Touchdowns closed about 40% of the gap (0.74 to 0.88), turnovers fell 12% and re-rolls rose 22%: it plays safer
  and smarter, not bolder. Blocks, hard dodges and casualties barely moved.
- Rushes fell from 5.5 to 3.1 a match (good coaches 9.0), mostly since v3.05 (nobody rushes just to reach a formation
  square). Trips while rushing fell from 0.48 to 0.19 turnovers a match. Coaches rush to reach blocks, blitzes and the
  carrier's support; the AI now almost never does. The biggest single gap left in how it plays.
- Pick-ups are now its third biggest cause of turnovers (22%; good coaches 9%): about 0.8 a match against 0.47. A 4+
  pick-up fails a third of the time (83 of 248); it picks up more often than before (1268 tries v 1175).

## How to re-run

```
node ai-training/bb-stats.js --n 12 --par 4 --out ai-training/data/bludbowl-vX.YY.jsonl   # ~6 min for 180 matches
gzip -9 ai-training/data/bludbowl-vX.YY.jsonl
python3 ai-training/compare.py --bb data/bludbowl-vX.YY.jsonl.gz            # add --races for each team
python3 ai-training/compare.py --mincr 1700                                  # only matches between coaches rated 1700+
```

`bb-stats.js` records stats by wrapping the game's own functions from outside (`resolveBlock`, `triggerTurnover`,
`spendTeamReroll` and the roll prompt's Roll button). If one of those is renamed in `index.html`, update the hook in it.

## Getting data from FUMBBL

- The cloud environment must allow `fumbbl.com` (environment settings -> Network access -> Allowed domains; the Android
  app doesn't show this setting, the claude.ai/code website does).
- API documentation: https://fumbbl.com/apidoc/ and https://fumbbl.com/help:Fumbbl+API
  - `/api/match/list` and `/api/match/list/{lastId}`: completed matches, 25 at a time, newest first (each has a `replayId`).
  - `/api/match/get/{id}?verbose=1`: teams, coach ratings (`coach.rating.pre.cr`) and per-player stats.
  - `/p/match?op=stats&id={id}`: JSON dice and action stats for each side: dodges and rushes by target number,
    passed and failed; blocks by number of dice (negative = the opponent picks), re-rolled and successful; block dice
    faces; armour and injury rolls; every turnover with its action and whether it was re-rolled; re-rolls used; which
    players took which actions; and the same broken down by half, drive and turn.
  - `/api/ruleset/get/{id}`: the Competitive division uses ruleset 3906, "BB2025".
- **Full replays over plain HTTPS (found Oct 2026):** `https://fumbbl.com/api/replay/get/{replayId}/gz` returns the whole
  replay as gzipped JSON (about 180 KB, 4 MB unpacked), and it works from a cloud session. It isn't in FUMBBL's published API
  list; [gsverhoeven/fumbbl_replays](https://github.com/gsverhoeven/fumbbl_replays) (Python) uses it, waiting 0.3 s
  between files. Contents: `game` (both rosters, skills, the ruleset's options) and `gameLog.commandArray`, the server's
  command stream: `modelChangeArray` entries (`fieldModelSetPlayerCoordinate`, `fieldModelSetPlayerState`,
  `fieldModelSetBallCoordinate`, `actingPlayerSetPlayerId`, `turnDataSetTurnNr`...) and `reports` (`playerAction`,
  `blockRoll`, `blockChoice` with `nrOfDice`, `dodgeRoll`, `goForItRoll`, `pushback`, `kickoffResult`...). Coordinates
  are x 0-25, y 0-14, as in BludBowl. That package also has parsers for set-ups, block choices, dodges and rushes. Keep it
  to a few dozen replays, fetched slowly, as below. (The older way, below, is no longer needed.)
- **The older way:** full replays weren't thought to be available over plain web addresses. FUMBBL's client
  ([source](https://github.com/christerk/ffb)) streams them over a WebSocket from `fumbbl.com:22223/command`
  (send `clientReplay` with the `gameId` = the match's `replayId`; messages are LZString-compressed JSON). Cloud
  sessions' proxy can't carry WebSockets, so `fumbbl-fetch-replays.js` has to be run on a normal computer and the
  files uploaded. [FUMBBLPlus/fumbblreplay](https://github.com/FUMBBLPlus/fumbblreplay) (Python, 2019) does the same and
  confirms the format; its authors ask that nobody mass-downloads replays without first contacting Christer and
  SzieberthAdam on FUMBBL. The `.jnlp` file the FUMBBL site offers is only a launcher for their Java client.
- Be polite to FUMBBL: it's run by volunteers. Fetch slowly and only keep summary data.
- Before downloading replays in bulk, ask Christer (who runs FUMBBL) first, and say what it's for, roughly how many, and
  that it runs slowly outside busy hours. In a 2019 forum thread
  ([Developers' Den](https://fumbbl.com/index.php?name=PNphpBB2&file=viewtopic&t=30534)) he called the WebSocket method
  "a supremely terrible way of downloading replays": it's tolerated, not welcome. A few replays by hand is fine. The
  per-match stats above come from FUMBBL's ordinary web pages and API, which is fine as it is.

## Passing: what's been tried, and ideas (Oct 2026)

- The AI hardly passes (about 0.1 completions a match against 0.4 for good FUMBBL coaches). Loosening its passing
  tolerances (a dodge to reach the throw, a lower bar for scoring passes) changed nothing: it rarely has anyone to pass to.
- On turns with the ball, a team-mate was open 3+ squares ahead only 13-41% of the time. A "receiver" role (best catchers
  wait in open squares ahead, in pass range, out of reach of most opponents) raised that for some teams (Wood Elves 33% to
  67%) but the AI still didn't throw, and an 8-setting sweep (16 mirror matches each) showed no gain. Kept as a patch, not in the game.
- Why: switching the play values a spot mostly by squares gained (`ballSpotValue`), so a pass needs ~73% odds to beat
  walking the ball up, and only passes that score this turn get extra credit.
- Next idea: value where the ball would be by what it opens up next turn: the free run from there (`nextTurnLane`), how
  few of their players can reach it, and our players nearby to support it. That would also reward a **sideways pass to the
  weak side** when most players are bunched on one side (the owner's point) - a good play with no squares gained.
- Tried next (Oct 2026), all kept in `passing-experiments.patch` (apply with `git apply`; every change sits behind an `AIX`
  switch, and the tuning values behind `AIX.p`, so `tools/ai-match.js --newp` can sweep them):
  - `passv`: judge the ball's spot by the next-turn value above (free run, how many opponents can reach it, support).
  - `recvfirst`: with the carrier still to act, move the receivers into open squares in pass range first, so the pass can
    happen this turn (before, receivers only got into place after the carrier had acted, and were marked by next turn).
    `recvMin: 0` lets receiver squares be level with the carrier (a sideways switch).
  - Result over ~400 sweep matches: hand-offs and passes went up (about 25 a match-set of 16 against 18), but no setting
    beat the current AI by more than luck; taken together they were slightly worse. Not released.

## Ideas from coaching guides, tested (Oct 2026)

From creativetwilight.com, grumbbl.co.uk and Goonhammer's beginner-to-intermediate guides. Most of their advice the AI
already follows (dice-free actions first, block order by dice, screens two squares apart, wide-zone defenders two back,
cage in midfield, stalling, fouling last, re-rolls for what matters). It also always stands up every prone player it can
(measured: none left lying down at the end of 342 turns). Tested with 48-match quick checks against v3.09, none released:
- Don't activate Bone Head / Really Stupid / Savagery / Fury big guys just to reposition near the action: 19% fewer
  failed rolls, but 31-41 touchdowns, 9-15 wins (they ended up out of position).
- Big Guys and Loners block after everyone else's blocks: 26-38 touchdowns, 14-19 wins (their blocks are usually the best).
- The passing play only when behind with 3 turns left (`latepass-experiment.patch`): came back 2 times in 14, against
  4 in 18 without; passes barely rose. Overall 48-42.
- A safety kept well behind the ball while attacking: 41-43, 16-17. Neutral.

## Flank runners (v3.10)
The owner's idea: get a couple of players round the sides, behind the opposing team. Before, a team holding the ball had
someone in behind on a flank (wide rows, past all but one opponent) 21% of its turns, two players 4%. The `flank` role
sends two quick players to unmarked wide squares level with the opponents' second-deepest player (33% / 13% after).
Sweep: two players level with the line and one player one square past both led by 14 touchdowns over 48 matches;
three squares past was level. Released with two players, level (`flankN` 2, `flankPast` 0): +19 touchdowns, 37-23 wins
over 96 matches including 48 on teams not used in the sweep.
Also checked this session: no move ever crossed a loose ball's square (forced pickups); pickups fail 16%, hand-off catches 11%.
- Flank options tested against v3.10 (`flank-options.patch`; settings `flankN`, `flankHunt`, `flankAssist`, `flankScreen`),
  16 mirror matches each: three runners -5, hunting fragile opponents (ST<=3, AV<=8) -7 (1-7: it runs them into contact),
  assists from behind on an opponent already locked up with ours -2, screening the carrier's lane -4, hunt+screen -2.
  All four together led by 11 over 48 matches (all of it on passing teams) but lost 40-46 on the 12 teams outside the
  sweep (passing teams 3-7). None released: two plain runners in space stays best.

## Skills (v3.11)
Before v3.11 the AI's decisions referred to about 32 of the game's 100+ skills: those that change a roll's odds (via the
rules code) plus a few tactical ones. v3.11 adds (switches `hitskills`, `vomit`, `gaze`):
- Block judgement: Wrestle (Both Down = both Prone, no Turnover), Mighty Blow / Claws (knockdowns worth more by the rise in
  armour-break chance), Dauntless (dice as the real mix), crowd surfs (a push square off the pitch; with Frenzy, from one in).
- Projectile Vomit for a Troll with no good block; Hypnotic Gaze on a marker of our ball carrier. The AI's turn loop also
  had to learn to keep acting in the Vomit mode (it froze there at first).
Results: 47-26 touchdowns, 24-12 wins on 12 teams with these skills; 42-38, 17-18 on the other 12. Blocks per team per
match rose about 10% where the skills are present (24.5 to 27.0).
Not done yet: Frenzy follow-up risk, Stand Firm / Sidestep / Fend when choosing whom to block, avoiding Diving Tackle /
Shadowing when dodging, Sure Feet / Sprint in rush risk, Multiple Block, Grab, Leader, Pro, Dump-off.
Seen in testing (recovered by the safety net): a bomb scattering left the game waiting - fixed in v3.16 (bomb flights only
landed when drawn, and test mode barely draws), as was a Frenzy second block starting while a pushed-loose ball bounced.
- v3.12 (`skills2`): move odds count Diving Tackle and Sure Feet (also what a person sees); a push on a Stand Firm player is
  worth little. Neutral in a 48-match check (50-52), as these skills are rare on starting rosters. Tried and dropped: counting
  Frenzy's forced second block as extra risk - Frenzy players then blocked far less (23.7 to 19.3 blocks a match) and lost
  37-51. The rest (Multiple Block, Pile Driver, Hit and Run) keep their fixed answers (declined); Dump-off is used when the
  receiver is unmarked, Stand Firm and Diving Tackle always.

## Developed teams (`tools/ai-match.js --dev`)
Starting rosters have few skills, so skill work barely shows in tests. `--dev` gives every player a typical extra skill or
two for their position, the same on both sides (big guys and ST4+: Guard/Block; blitzers: Tackle/Mighty Blow; catchers:
Dodge/Catch or Sure Hands; throwers: Sure Hands/Accurate; linemen in turn Block/Guard/Wrestle/Tackle, plus Dodge on agile
teams). With it (48 matches each, against the AI without the change):
- The v3.11/v3.12 skill awareness: 49-35 touchdowns, 21-10 wins (level on starting rosters for the same teams).
- Assist setup (a spare player, Guards even when marked, steps in to make a 2-dice block): 34.6 v 30.5 blocks a match and
  87-60 casualties, but 37-42 touchdowns, 14-21 wins. Not released (same as on starting rosters).
- Block-order look-ahead: 47-40, 17-16. Not released.

### Which skills the AI plays best with (v3.13 league picks)
`--devnew`/`--devold` give each side its own skills by role (JSON like `'{"big":["Block"]}'`; roles big, strong,
blitzer, catcher, thrower, lineman), so two skills can be compared head to head. 48 matches each, new v old:

| Role | New v old skill | Touchdowns | Wins |
|---|---|---|---|
| Big guys | Block v Guard | 59-36 | 21-7 |
| Big guys | Block v Mighty Blow | 52-35 | 22-12 |
| Linemen | Wrestle v Block (two runs) | 93-74 | 34-19 |
| Linemen | Block v Guard | 45-47 | level |
| Blitzers | Mighty Blow v Tackle | 40-41 | level |
| Catchers | Sure Hands v Dodge | 49-30 | 23-12 |
| Catchers | Dodge v Catch | 46-42 | level |
| Throwers | Sure Hands v Accurate | 45-34 | 23-11 |
| Ball handlers | Block v Sure Hands | 44-36 | about level |

So in leagues the computer now picks by position (`aiPicks` in `CAREER`): big guys Block (3 in 4 save up for it as a
secondary skill), then Mighty Blow, Guard; catchers, runners and throwers Block, Sure Hands, Dodge; linemen Wrestle,
Tackle; everyone else the old `AI_PICKS` order. Since v3.14: no Block with Wrestle (they overlap); the Elite skills
(Block, Dodge, Guard, Mighty Blow, +10k value each) come last for linemen and once three team-mates have gained one;
and `aiChoose` takes the 1st/2nd/3rd available choice 60/25/15% of the time, so teams differ. Since v3.15 about a
third of a lineman's advancements are random primary skills (two rolled, the better kept; fixed per player and
advancement, so it doesn't get a fresh chance after every match).

## Blocking more (Oct 2026, not released)
Where the block gap comes from (`block-chances.js`, 12 mirror matches on v3.15, per team per match): turns start with
about 22 players next to an opponent with a 2-dice block (about 12 taken; most of the rest move off once their opponent
has been knocked down, about 2.5 just stand there), 1 with 3 dice (nearly all taken) and 31 with only 1 die (about 4
taken, 20 left standing there at the end of the turn). So the AI rarely skips a good block; the gap is mostly 1-die
blocks and blocks it never sets up.
- `lateblk` (`late-blocks.patch`): once everyone else has acted, a player still next to an opponent blocks, even on one
  die, since a Turnover costs nothing more than our player lying down (`lateDown` 4, +`lateScreen` 3 for a defender near
  their carrier; `lateMin` 1; `lateOne` 0 for 2 dice only). Blocks rose from 24 to 31-32 a match, but results were level:
  116-115 touchdowns over 192 matches with the default settings. Sweeps (48 matches each): `lateDown` 6 33-32, 10 33-45;
  `lateMin` 2 42-46; 2 dice only 42-38. A 1-die block without Block is about an even trade (a third of the time their
  player goes down, a third ours), and our player lying down leaves a gap for their turn, so it doesn't pay on starting
  rosters. Its re-roll fix (no team re-roll on the last block of the turn unless spare) is in the patch too.

## Defence leaks (Oct 2026, not released)
`defence-leaks.js` (24 mirror matches on v3.15): about 23 of 28 touchdowns conceded came the turn after a defensive turn
that ended with their carrier having a 60%+ chance of simply running it in (dodges and Rushes counted, a team re-roll
as saving one roll). In most of those turns the chance was already ~100% when our turn began, and the players still
able to act had nowhere useful to go: the carrier was already past them. Why the AI misjudges: its screen and plug
treat any tackle zone as a wall (`threatOf` uses the dice-free run), so half a screen looks complete; and plugs only use
moves with no dice. Tried (`defence-screen.patch`, every change behind `plug2` / `AIX.p`):
- `plug2`: plugs judged by the carrier's real chance of scoring (`scoreChance`, via the game's own move odds), with pairs
  of defenders tried together (one alone is often dodged round), then a Rush/dodge into the way after the carrier blitz
  when worth the Turnover risk. With dodges allowed (marked players dodging away to plug): 32-46, 10-20 over 48 - it
  freed whoever they were holding up. Rushes only, from unmarked players: 48-44. Dice-free plugs only: 43-39. Level.
- Screen shape (`scrMax`, `scrFrac`, `scr2Gap`, `deepDz`), 16 mirror matches each: screen up to 6 squares ahead 10-16,
  further out too 11-17, second line 3 back 15-14, a deep safety from 3 squares out 15-15, all three 15-10. The
  combination over 112 matches: 98-86 touchdowns, 37-33 wins - too close to call.
- Two turns ahead (`plugTwo`, `twoW`; now in the same patch): plugs also count the squares the carrier could reach this
  turn from which it could score next turn (each worth `twoW` 0.5 x how close it is, divided by 1 + our players who
  could get there), with candidate squares out to twice its reach. 22-23 over 24 matches against v3.15, and matches ran
  three times slower. Leaky turns (carrier 60%+ to run it in) with both sides on it: 29 (23 scored) against 23 (19)
  with the old defence over 24 matches each. No better.
- Screens that hold up against blocks (`plugRobust`, `robP` 0.5, `robTop` 8; in the same patch, with `plugTwo` now off
  by default): a screen judged by its worst case - each of our players in the carrier's way whom one of theirs could
  block or blitz, knocked over with chance `robP` - with the 8 most promising plugs rescored that way. Over 24 matches
  each (both sides on it, then both on v3.16): 37 v 36 touchdowns scored the turn after a defensive turn, 31 v 37 turns
  ending with the carrier 60%+ to run it in; matches ran 2.5 times slower. No better.
So a better plug alone doesn't stop the leaks, even allowing for their blocks: in most leaky turns the carrier was
already past everyone still able to act, so the screen has to be in the right place a turn or more earlier. Still untried: keeping one or two players goal-side of every opponent who could take a hand-off.

## Turn order (Oct 2026, not released)
`turnover-cost.js` (24 mirror matches on v3.15, 189 turnovers): at a turnover 4.5 players on average were still to act.
- Safe blocks (under 5% risk) were almost never lost (4 in 189): the AI already throws them first.
- The costliest turnovers were ball actions early in the turn: failed catches/passes (20, 7.6 players still to act
  each, 73 of them free to move without dice) and failed pickups (24, about 7 each, 63 free). In attack, risky blocks
  thrown before the carrier and cage had moved (19, 65 free movers lost). Dodges and Rushes came late (under 3 left).
- `order` (`turn-order.patch`): before a pickup under 95%, up to three team-mates take the ball's diagonal squares
  without dice (cage corners if it works, round the loose ball if not); with the ball, a risky block that doesn't help
  the carrier waits until the carrier has moved and the cage is built. Pickup part alone: 52-51 over 72 matches. Both:
  128-123 touchdowns, 46-47 wins over 144 matches; turnovers 7% down in the first 96, level in the last 48. Level.
Hand-offs and passes weren't changed: the receiver runs on after the catch, so pre-placing a cage round them doesn't work.

## Fouling (Oct 2026, not released)
Top FUMBBL coaches foul 1.23 times per team per match (half of their teams not at all). `fouls.js` on v3.16 (24-36
matches per run): the AI fouls about as often (1.25-1.4), nearly always a positional (about 90% of victims: Blitzers,
Saurus, Gutter Runners, Witch Elves...; `foulWorth` rates hitting and ball skills, speed and ST 4+, and plain linemen
low), with 1.0 assists on average; the armour broke on about 45% of fouls, and about 1 in 6 foulers was sent off.
- `foulset` (`foul-setup.patch`): before the foul, up to two spare team-mates step in, without dice, next to the victim
  where nobody marks them (+1 each), held back from the end-of-turn positioning for it. Assists rose to 1.2 a foul and
  the armour broke on about 55% (two runs disagreed: 48/100 v 44/90, then 49/77 v 26/65), but over 48 matches: 41-36
  touchdowns, 19-18 wins, casualties 46-47. Fouls are too rare (about one in a match) for this to show in results.

## Rushing (Oct 2026, not released)
Where the rush gap comes from: since v3.05 (`safepos`) nobody rushes to reach a formation square except to mark or hunt,
plugs never rush, and the general blitz (`blitzPlan`) ignores any route under 90% (one Rush is 83%) and needs a score of
3, which a blitz needing a Rush (or a 1-die blitz) never reaches. So it rushes mostly with its carrier and carrier blitzes.
`rush2` (`rushing.patch`): Rushes allowed to formation squares (and counted when choosing who goes where) when few
team-mates are still to act (`rushLeft` 3) or re-rolls are spare (`rushRR` 2); a blitz may Rush (`rushProb` 65%), a failed
one costing `rushFail` 2 + 1 per team-mate still to act; a second chance to blitz at the end of the turn; and a lower bar
for blitzing (`blitzMin` 1.5). Rushes only rose from 3.1 to 3.6 a match (coaches 9), blitzes from 8 to 10.5 in a 30-match
stats run, but over 48 matches against v3.16: 41-43 touchdowns, 15-14 wins, casualties 47-59, blocks level. The
formation-only version swept over 5 settings (16 matches each) was 59-74 in all. Not released.

## Pick-ups (Oct 2026)
`pickups.js` (36 mirror matches on v3.16, about 3.5 pick-ups per team per match; note the roll is set up just before the
player steps onto the ball, so measure at the ball's square):

| Pick-up | Tries | Failed | Opponents next to the ball |
|---|---|---|---|
| 2+ (nearly all Secure the Ball) | 91 | 1% | 0 |
| 3+ | 94-102 | 13-16% | 0.1 |
| 4+ | 42-54 | 24-41% | 0.9 |
| 5+ | 14-15 | 33-64% | 1.7 |

- Secure the Ball (2+, allowed in the game when no standing opponent is within 2 squares, once a turn, not for big
  guys) is already used about 2 times a match and almost never fails (1 in 67). It was allowed but not used for about
  15 Agility 3 pick-ups without Sure Hands in 36 matches; using it there would save roughly one turnover in 15 matches.
  With Sure Hands an ordinary 3+ pick-up (89%) beats it (83%) and the player can carry on moving.
- The losses are the 4+ and 5+ pick-ups next to opponents (about 0.45 turnovers a team a match), where Secure the Ball
  isn't allowed. A team-mate with an easier roll was almost never available; a marker could have been blocked first in
  about 1 in 4 (the `loose` switch already clears markers first when it can, under 75%).

## Protecting the carrier (v3.60)
The owner's observation: the AI finds a gap and sends fast players through with the ball (the Lizardmen especially), but
leaves the carrier poorly protected, so it's easily blitzed. `carrier-support.js` (24 mirror matches, 6 teams, at the end of
each turn ending with our carrier on the pitch): the ball was lost the next turn 34% of the time with nobody next to the
carrier, 38% with one, 26% with two, 13% with three or more; after a run of 4+ squares 43% of carriers had at most one
team-mate next to them. Cause: `carrierScore` gave 1.5 a square gained but only 0.6 per possible supporter, and
`cagePotential` counted anyone within reach as the crow flies (through tackle zones and blocked routes).
- `cagefit`: support counted as team-mates already next to the square plus those with a dice-free route to a free square
  beside it (one square each), worth `supW` (0.5) x (1 + `supReach` (0.5) x opponents who could reach it, up to 4) per
  supporter (diminishing: 1, 1, 0.8, 0.6). Behaviour: lost next turn 26% to 23%, alone-or-one after a run 43% to 33%,
  three-or-more support 99 to 117 turns, long runs not fewer (141 to 159). `supW` 0.9 was worse (30% lost).
- Results against the AI without it: 53-37 touchdowns, 22-9 wins over 48 matches (12 teams); then 83-73, 37-32 over 96
  (24 teams). 144 in all: 136-110, 59-41, turnovers 519-559. Released.
- Why the Skaven lose it most (`carrier-support.js` with `skaven:orc`-style pairs and `DETAIL=1`, 48 matches against six
  teams): 37% of Skaven carrier turns lost the ball next turn, against 18-31% for those teams against the Skaven. All their
  carriers are AV8-9 without Block (55 of 97 losses were the carrier knocked over), 43% of turns ended with one team-mate
  or none next to the carrier (about half lost), Clanrats carried in 84 of 261 turns (44% lost), and a carrier ending the
  turn marked was lost 69% of the time. In mirror matches it's about 50%, as Gutter Runners are the best at taking it back.
  Ideas not yet tried: hand off from a slow carrier to a Gutter Runner readier on fast teams; a poorly supported carrier
  hangs back instead of pushing on alone.
- Tried (`fast-carrier.patch`, switches `fasthand`, `hangback`): `fasthand` gives a receiver at least 2 MA quicker than the
  carrier the passing teams' bonus (+`fastBonus` 2 when it could run in next turn and at most one opponent can reach it) and
  the lower bar (0.8); `hangback` takes `hbPen` 1.5 off a forward square where the carrier would have at most one supporter
  and 3+ opponents in reach (unless within a turn's run of the end zone). Skaven carrier turns lost next turn, 48 matches each
  against six teams: 32% without, 32% `fasthand`, 36% `hangback` (runs vary by about 5 points). `fasthand` didn't get the
  ball to Gutter Runners more often. Results for `fasthand`, 48 matches on 12 fast/agile teams: 55-53 touchdowns, 17-20 wins,
  hand-offs 84-71. Neither released. The Skaven's losses look mostly built into the team (AV8 without Block everywhere).

## Following up and assists (v3.61)
The owner's observation: strong players who are unlikely to get the ball (Saurus, Kroxigor...) often don't follow up, so
they're less often placed to block next turn. `follow-ups.js` (24 mirror matches on six strength teams, v3.60): blocks
25.8 per team per match; strong non-carriers (ST 4+ or AV 10+) followed up 50% of the time (Kroxigor 38%, Trolls 35%,
Dwarf Blitzers 34%), held back because the vacated square had more tackle zones (665 of 766 choices). Those who followed
blocked again next turn 36% of the time against 25% for those who stayed (a link, not proof).
- `follow2` (`follow-ups.patch`): strong non-carriers follow up unless the square has `fuTz` (2) more tackle zones than
  where they stand (beyond the old allowance) or is worse for the sideline. They then followed 96%, and blocks rose to
  28.1 a match on those six teams. Results against the AI without it: 39-38 touchdowns, 18-16 wins over 48 matches (12
  teams); 74-78, 26-29 over 96 (24 teams; blocks there 22.8 v 23.9). 144 in all: 113-116, 44-45, casualties 161-174. Level.
- `assist2` (with `follow2`, both in `assist-blocks.patch`): `assistPlan` (step 5c) used to line up a dice-free assist only
  next to key opponents (markers of our carrier, lane blockers, their carrier). With `assist2` any standing opponent one of
  ours is next to counts (worth `astWorth`, 1), and a spare player may also step next to one of the defender's helpers
  (at most 2 tackle zones there) to cancel that assist. On the six strength teams: blocks 30.0 → 33.3 per team per match,
  1-die 1.9 → 2.0, 2-dice 25.2 → 28.2 (`follow-ups.js` now prints blocks by dice). Against the AI with neither, on 12
  teams: blocks 29.6 v 21.2 per team per match, 128-134 touchdowns, 41-43 wins (60 drawn), casualties 146-134,
  turnovers 555-515 over 144 matches. Level: the computer blocks more (still short of the FUMBBL coaches' 46),
  but it doesn't win more for it.

## Kick-off set-ups (Oct 2026, from 71 FUMBBL replays)
`fumbbl-setups.py` on the 71 replays (247 kick-offs, each side) against `bb-setups.js` on v3.62 (24 mirror matches, 12
teams; 81 kick-offs). "Back" counts squares behind the team's own side of the line of scrimmage.

| | FUMBBL kicking | BludBowl kicking | FUMBBL receiving | BludBowl receiving |
|---|---|---|---|---|
| on the line | 3.1 | 3.0 | 6.5 (5-9 usually) | 3.0 (always) |
| 1-3 back | 5.2 | 3.2 | 2.5 | 4.5 |
| 4+ back | 2.1 (none at all in 140 of 247) | 4.4 (6 in 52 of 81) | 1.3 (one returner in 177 of 247) | 2.7 |

- Receiving, good coaches put most of the team on the line (6-8), ready to block on the first turn, with two or three
  just behind and one back to take the kick. The AI always puts exactly 3 on the line. Every team does this; the agile
  ones a little less (Wood Elf 5.1, Skaven 4.7, Elven Union 4.0, Human 5.3 on the line).
- Kicking, they keep a screen 1-3 squares behind the line and usually nobody deep. The AI usually stands six players 7
  back. Coaches kick deep (6+ players 4+ back) almost only late in a half: 39 of 65 kick-offs at turn 7-8, against 6 of
  179 earlier (and 37 of 104 when ahead, 9 of 129 level, 0 of 14 behind), to stop a quick touchdown before half time
  or the end. Skaven kick a little deeper than others (3.6 players 4+ back).
- The AI's set-ups barely change by team or by the clock.

### How the receivers answer the kicking set-up
The kicking team sets up first, so the receivers can react. `fumbbl-receive.py` scores each receiving set-up against
the kickers it really faced, and against kicking set-ups from other kick-offs (the baseline: the same shape, no reaction).
247 FUMBBL kick-offs; the BludBowl computer (v3.62, 81 kick-offs) alongside.

| | coaches: real v baseline | BludBowl: real v baseline |
|---|---|---|
| kickers' line players with a 2+ dice block on them for turn 1 (of ~3) | 2.28 v 1.95 | 0.94 v 1.13 |
| kickers' line players with 0 / 1 / 2 / 3+ receivers next to them | 0.09 / 0.39 / 1.11 / 1.49 v 0.13 / 0.67 / 1.21 / 1.11 | 0.91 / 0.42 / 1.09 / 0.58 |
| receivers' ST4+ line players facing a soft kicker (ST3 or less, no Block) | 57% v 49% | 11% v 30% |
| ...facing an ST4+ kicker | 20% v 22% | 91% v 66% |
| a wide zone the kickers left empty gets a receiver | 93% v 86% | (kickers never leave one) |

- Coaches line up so each of the kickers' three line players has two or three receivers next to it (one blocks, the
  others assist), which is what gives them more 2-dice blocks than their shape alone would. They leave almost none
  unmarked (0.09 a kick-off), and they don't avoid the kickers' big players either: 76% of ST4+ or Guard line players
  get two or more receivers next to them.
- They put their strong players opposite the soft kickers.
- They fill a wide zone the kickers leave empty.
- No sign that the backfield moves to where the kickers' screen is thin (the row-by-row correlation is the same as the
  baseline, +0.21).
- The computer, with only three on the line, leaves about one of the kickers' line players unmarked each kick-off, gets
  fewer 2-dice blocks than chance, and lines its strong players up against the kickers' strong players.

### The new set-ups (`setup2`, v3.63)
- Kicking (`screen` in `SETUPS`): three cheap linemen in the middle of the line (rows 6-8), a screen at 2-3 back
  (x 9-10: rows 2, 4, 5, 7, 9, 10, 12) and one player 4 back. `lastTurn` (deep) is kept for the receivers' last turn,
  which is when the coaches go deep too (32 of 41 when ahead, 4 of 10 level).
- Receiving (`offence2`): N on the line chosen square by square so each of the kickers' line players gets two or three
  of ours next to it, strongest opposite softest; a flanker a square back in each wide zone, a pocket, a returner 6 back.
  Short-handed teams use it too (the squares fill in order).
- Measured (`bb-setups.js`, `fumbbl-receive.py`): receiving, 2.74 of the kickers' 3 line players can be hit with 2+
  dice on turn 1 (coaches 2.28, old AI 0.94); our ST4+ players face a soft kicker 94% of the time (old 11%).
- Results against the old set-ups: with 7 on the line (as the coaches do) 123-139 touchdowns, 41-49 wins over 144
  matches. Split: the kicking screen alone was level (68-69, 24-26 over 72); the 7-man receiving line alone was worse
  (54-66, 22-30). `drives.js` showed why: the receivers threw more first-turn blocks (2.6 v 1.6) and knocked more down,
  but failed far more dodges on turn 1 (8 v 1 in ~90 drives) pulling players out of contact to support the ball, and
  didn't score more. With 5 on the line (`recvLine`, AIX.p): 59-58, 21-23 over 72; both halves together 37-34, 16-14
  over 48. Released with 5. The next step would be the receivers' first turn itself: block with the line, move the
  ball up behind it, and don't dodge out of contact to do it, after which 6-7 on the line may pay.

## The receivers' first turn (Oct 2026)
`fumbbl-firstturn.py` reads the receiving team's first turn after each kick-off in the 71 replays (245 turns);
`bb-firstturn.js` records the computer's the same way (`--bb` to compare). "In contact" = next to a standing opponent at
the start of the turn.

| | coaches | v3.63, 5 on the line | v3.63, 7 | with `line1` (v3.64) |
|---|---|---|---|---|
| in contact at the start | 4.9 | 4.9 | 5.1 | 5.0 |
| ...blocked / other action, no dodge / did nothing / dodged away | 58 / 24 / 14 / 3% | 45 / 23 / 15 / 16% | 45 / 20 / 17 / 18% | 59 / 24 / 9 / 8% |
| blocks a turn | 3.7 | 2.6 | 2.7 | 3.2 |
| ball picked up after (actions; blocks before it) | 7.9; 3.3 | 1.8; 1.0 | 1.9; 1.1 | 3.8; 2.9 |
| in contact at the end | 1.5 | 3.0 | 2.9 | 2.3 |

- Coaches block first and move after: knocking a marker over lets the player walk off without a dodge ("other action,
  no dodge" is mostly that). The ball comes late, once the blocks are done. 96% of their first-turn blocks are 2 or 3 dice.
- The computer took the ball first (step 4 of `choose()` came before ordinary blocks), then dodged line players away
  to build the cage. And agile teams (Wood Elf, High Elf, Amazon: `agileTeam`) only took near-safe blocks (pTurn 0.05),
  so their line players dodged away instead: 41-84% of them, against 11-14% for coaches with those teams, who block
  about 3 times on that turn like everyone else.
- `line1`: (a) with the ball loose and no standing opponent within 3 squares of it (`calmR`), the good blocks go before
  the pick-up; (b) an agile team's blocker who is marked anyway takes blocks up to pTurn 0.12, like other teams.
- Results against v3.63: line1 with 5 on the line 38-40 touchdowns, 14-15 wins (48 matches); with 7 on the line
  136-122, 43-40, casualties 204-172 (144). Released with 7 (5 for teams with fewer than six ST4+ or AV9+ players).
  Amazons in the mirror match still hardly block (blocking a Dodge player is rarely worth it), so they still dodge away.

## Cages (Oct 2026)
`fumbbl-cages.py` (71 replays, 912 turns) and `bb-cages.js` (v3.64, 48 mirror matches, 595 turns): at the end of each
turn where the moving side's carrier is standing, how its team-mates stand round it and whether the other side has
the ball (or has scored) by the end of their next turn. Turns just before half time are left out. (FFB switches
`homePlaying` to the next team before its `turnEnd` report, so the side whose turn ended is taken from the last player
to act.)

| | coaches | BludBowl |
|---|---|---|
| ball lost by the end of their next turn | 15% | 31% |
| team-mates next to the carrier (diagonal corners) | 1.48 (1.06) | 1.79 (1.23) |
| all four corners / 3+ corners | 9% / 14% | 5% / 14% |
| within 2 / within 3 | 2.7 / 3.7 | 2.7 / 3.6 |
| nearest opponent: next to it / 2 / 3 / 4+ squares | 3 / 15 / 28 / 55% | 12 / 30 / 29 / 29% |
| opponents within 3 / able to reach it next turn | 1.0 / 6.6 | 2.0 / 7.4 |
| lost, by nearest opponent 1 / 2 / 3 / 4+ | 74 / 29 / 14 / 10% | 49 / 26 / 39 / 23% |
| lost, by corners filled 0 / 1 / 2 / 3 / 4 | 18 / 17 / 14 / 6 / 2% | 47 / 32 / 24 / 9 / 0% |
| scoring range (1-6 to go): next to it, lost | 1.0, 22% | 0.6, 49% |

- The coaches' cages aren't denser than the computer's; their carriers are further from the opposition. Over half
  the time the nearest opponent is 4+ squares away (the computer: 29%), and the carrier is hardly ever left marked
  (3% v 12%). Space, more than bodies.
- When the coaches do build a cage it holds: 3-4 corners lose the ball 2-6% of the time. The computer's 3-4 corner
  cages hold about as well (0-9%); the difference is in the turns with 0-2 corners (47-24% lost v 18-14%).
- Holding the ball longer, the coaches' cages fill out (0.9 next to it on the first turn with the ball, 1.6-1.8 after)
  and move up about 2 squares a turn; the most corners are in the opponents' half (1.4), and the cage thins out near
  the end zone as players peel off to block and the carrier goes for it.
- Caveat: the loss rate depends on the defence too. FUMBBL teams are developed (Block, Sure Hands, Guard), the
  computer plays starting rosters, and its own defence (the other side of a mirror match) goes after the ball hard,
  so its losses are high at every distance (23% even with no one within 3).

### Carrier space (`space`, Oct 2026, not released: `carrier-space.patch`)
From the cage numbers: in `carrierScore`, a square with the nearest standing opponent 2 away costs 3, 3 away 1.5, and
each opponent within 3 beyond the first 0.5 (`spaceW` scales it).
- The carrier ended 4+ from the nearest opponent 45% of the time (was 29%; coaches 55%), opponents within 3 fell from
  2.0 to 1.4, and the ball was lost by the end of the other side's next turn 26% of the time (was 31%).
- Results against v3.64: 122-125 touchdowns, 46-43 wins over 144, but turnovers 607-541: moving away from opponents
  brought more Rushes. With the space term only for dice-free moves (a dodge or Rush judged as if it left the carrier as
  crowded as now): 43-38, 17-13 over 48, then 76-95, 26-41 over 96; 119-133, 43-54 in all. Not released.
- So keeping the ball safer for a turn doesn't by itself win matches: the carrier presumably gives up ground or time
  to do it. Untried: the space term only in our own half, or only while the cage is forming (first two turns with the ball).

### Which side the support is on (Oct 2026)
`screen-sides.py` on the cage turns (`fumbbl-cages.py --json`, `bb-cages.js`, which now keep the raw positions): the
opponents who could get next to the carrier next turn (as the crow flies, MA + 2 Rushes, standing up costs 3), the
direction they come from, and where the carrier's team-mates within 3 squares stand relative to it.

| | coaches | BludBowl v3.64 |
|---|---|---|
| team-mates within 3: towards the threat / to the side / far side | 71 / 17 / 12% | 58 / 22 / 20% |
| ...ahead of the carrier (towards the end zone) / level / behind | 57 / 11 / 33% | 41 / 13 / 46% |
| ...standing next to an opponent | 23% | 32% |
| squares next to the carrier an opponent could reach: filled by us | 21% | 24% |
| when the carrier acts in the turn (share of the way through) | 0.62 | 0.61 |

- The coaches' support stands between the carrier and the opposition, mostly ahead of it; the computer's is spread
  round the carrier, half of it behind. The computer's attacking shape (`formationTargets`) is a fixed template round the
  carrier (four corners, a front screen 3 ahead, flankers, runners) and doesn't look at where the opponents are.
- Drawn out, the coaches' carriers sit in open space with their team between them and the opponents (who are mostly
  on one side); the computer's carriers end up in a crowd with opponents on every side, behind as well. Part of that is
  the computer's own defence, which swarms the ball, but its carrier also walks into those crowds.
- `facing` (not released: `support-facing.patch`): the cage corners and front screen turned towards the threat
  (`threatFrom`), corners no opponent can reach left out, the threat-side corners and the screen filled first. It moved
  the support only a little (63% towards the threat, still 48% behind) and was 38-44 touchdowns, 12-15 wins, turnovers
  198-174 over 48. The template squares aren't what decides where players end up.
- Next idea: judge reach the real way. Work out once per decision where each opponent can actually get next turn (a
  path round our players, dodges counted) and have the carrier stop, and the support stand, so that few of them have an
  easy way in: the team between the carrier and the opposition, which is what the coaches' pictures show.

### Real reach (`realreach`, v3.65)
`oppReach(me)` runs the game's own route-finding (`getValidMoves`) for each opponent as if it were their turn (full
move, two Rushes, a prone player standing first), round every player on the pitch and with the dodges out of our
tackle zones in the odds; `realDanger(me, x, y)` adds up each opponent's best chance of reaching a free square next to
(x, y). The carrier's stopping square (`carrierScore`, `dangerW` 1.3) uses it in place of `reachers` (as the crow flies,
which counts opponents walled off by our players too).
- Carrier part alone: 49-37 touchdowns, 20-14 wins over 48; then 101-83, 36-31 over 96; 150-120, 56-45 in all,
  turnovers 558-585. Released.
- With `shieldPlan` as well (off: AIP `shield` 1): once the carrier has stopped, the free team-mate whose dice-free move
  cuts the most real danger steps there first (gain 0.35 or more). It moved the support the coaches' way (64% of
  team-mates within 3 towards the threat, 15% on the far side; was 58 / 20; coaches 71 / 12) and the ball was lost a
  little less (25% v 31%), but results were 43-28, 20-10 over 48 then 77-83, 30-35 over 96 (120-111, 50-45), no better
  than the carrier part alone, and it costs about half a second's thinking a turn. Left off.

## Team re-rolls (Oct 2026)
`fumbbl-rerolls.py` (71 replays) and `bb-rerolls.js` (v3.65, 48 mirror matches). A "decision" is a failed roll by the
side whose turn it is, not rescued by a skill, with a team re-roll still unused that turn. Blocks are sorted by what
their first roll gave the blocking side: 'down' (the attacker goes over), 'nothing' (no knockdown) or 'kd'.

| | coaches | BludBowl |
|---|---|---|
| team re-rolls used, a team a match: on block dice / on other rolls | 2.45 / 1.88 | 1.57 / 1.88 |
| left unused at the end of a half | 0.33 | 0.47 |
| failed rolls re-rolled (Bone Head and the like left out) | 60% | 75% |
| ...turns 1-2 / 3-4 / 5-6 / 7-8 | 42 / 57 / 65 / 89% | 85 / 56 / 81 / 92% |
| ...the first or second player of the turn | 47% | 93% |
| ...ball at stake (carrier, pick-up, catch, pass) / not | 66 / 60% | 90 / 49% |
| ...dodge / rush / pick-up / catch | 53 / 87 / 67 / 41% | 55 / 74 / 98 / 80% |
| Bone Head, Really Stupid, Animal Savagery... re-rolled | 12% | never (`teamRerollable` doesn't ask the computer) |
| blocks whose first roll was 'down': re-rolled | 61% | 87% |
| blocks whose first roll was 'nothing': re-rolled | 6% | 0% |
| ...on their ball carrier / a blitz / other | 53 / 12 / 2% | 0% |

- Coaches save their re-rolls early in a half and spend them late (42% of failures re-rolled in turns 1-2, 89% in
  turns 7-8); the computer re-rolls most failures from the start (85% in turns 1-2: its "first turn is free with a
  big stock" and "a turn-ending failure with five or more still to act" rules).
- They don't treat the ball as special for rolls (66% v 60%), where the computer re-rolls nearly every ball roll and
  only half the others. Rushes are the roll they re-roll most (87%): a failed Rush is usually the last step to
  somewhere that matters. They re-roll catches and pick-ups much less than the computer does.
- On blocks they're choosier about the attacker going down (61% v 87%), but they will re-roll a block that didn't
  knock their ball carrier over (53%), or a blitz that didn't (12%). The computer never re-rolls a block that leaves
  its attacker standing.
- FUMBBL teams are developed and usually have more re-rolls (and Leader, Brilliant Coaching), so the totals aren't a
  like-for-like comparison; the patterns are.

- With all 100 replays (Oct 2026) the coaches' re-roll numbers hold: 4.43 used a team a match (2.44 on block dice),
  45 / 56 / 66 / 87% of failures re-rolled in turns 1-2 / 3-4 / 5-6 / 7-8, rushes 88%, dodges 54%, pick-ups 68%,
  catches 43%; blocks: 'down' 61%, 'nothing' on their ball carrier 53%, on a blitz 12%.

### Re-roll changes (`rr2`, not released: `rerolls.patch`)
- (a) re-roll a block or blitz on their ball carrier that won't knock them over; (b) a failed Rush counts as critical;
  (c) a catch only counts as critical from our own pass (`rrCatch`); (d) no turn-ending or big-stock re-rolls in turns
  1-2 (`rrSave`). Measured with all four: turns 1-2 53% re-rolled (coaches 45%, before 85%), ball / not 67 / 64%,
  rushes 89%, catches 16% (too few now), 'down' blocks 64%, 'nothing' 11%.
- Results against v3.65: all four 46-52 touchdowns, 15-22 wins, turnovers 231-185 over 48: saving re-rolls early
  costs the computer turns (the coaches can afford it because they leave the risky actions till last). (a) and (b)
  only: 43-36, 18-15 over 48, then 83-85, 32-35 over 96; 126-121, 50-50 in all. Level, so not released.

## Turn order (Oct 2026)
`turnorder.py` (100 replays, 3044 turns with 3+ players acting) and `bb-turnorder.js` (v3.65, 48 mirror matches,
1391 turns). Each activation is labelled by its risk: free (no dice), block (a block or blitz), dodge/rush, ball
(pick-up, pass, hand-off), foul; "where" is the share of the way through the turn (0 first, 1 last).

| | coaches | BludBowl |
|---|---|---|
| activations a turn | 8.4 | 7.2 |
| free / block / dodge-rush / ball / foul | 59 / 31 / 7 / 2 / 1% | 61 / 27 / 7 / 4 / 1% |
| where: free / block / dodge-rush / ball / foul | 0.43 / 0.53 / 0.79 / 0.80 / 0.90 | 0.50 / 0.41 / 0.80 / 0.47 / 0.95 |
| pick-ups a turn, where | 0.19 at 0.80 | 0.19 at 0.40 |
| free moves still to come after the first dodge/rush or ball action | 34% | 53% |
| turns ending in a turnover | 30% | 20% |
| team-mates who hadn't acted when it happened | 2.2 | 3.3 |
| what the turnover was: block / dodge-rush / ball / foul | 40 / 37 / 15 / 6% | 31 / 42 / 17 / 5% |

- Coaches leave the dice to the end: dodges, Rushes, ball actions and fouls come about 80-90% of the way through the
  turn, after most free moves and blocks, so a turnover costs them only about two players' actions. The computer
  dodges and Rushes late too, but picks the ball up mid-turn and leaves more free moves until after the risky part
  (a turnover costs it three or more). It also has fewer turnovers overall: it takes fewer risks.
- `order` (not released: `turn-order2.patch`): with a loose ball and no opponent within 3, (1) all the other dice-free
  formation moves first, then the pick-up: pick-ups moved to 0.62 of the way through, free moves after a risky one
  39%, but 38-44 touchdowns, 11-17 wins, turnovers 216-188 over 48; (2) only up to three team-mates into the diagonal
  squares round the ball first: pick-ups at 0.45, 51-53, 16-20 over 48. Neither helped.
- Update: (a) and (b) on top of the turn planner (`turn-planner.md`, stages 1-2) were 134-99 touchdowns, 57-39 wins
  over 144 against v3.65, and were released with it in v3.66. (c) and (d) stay off.

## Blitzes (Oct 2026)
`fumbbl-blitz.py` (100 replays, 3119 turns with 2+ players acting) and `bb-blitz.js` (v3.66, 48 mirror matches; its
FLAGS argument is '' for every switch on). "Other" = not their carrier, nor marking ours, nor next to their carrier.

| | coaches | BludBowl v3.66 |
|---|---|---|
| turns with a blitz: overall / our ball / their ball / loose | 89 / 89 / 94 / 83% | 48 / 50 / 53 / 37% |
| target down | 67% | 62% |
| who: other / their carrier / marking our carrier / next to their carrier | 78 / 11 / 7 / 5% | 36 / 43 / 20 / 1% |
| ...with their ball: the carrier / other | 25 / 63% | 93 / 5% |
| blitzer with Block; target with Block | 64%; 34% | 35%; 14% |
| squares run; with a dodge / a Rush | 2.4; 12 / 13% | 2.8; 8 / 10% |
| block dice 1 / 2 / 3 | 8 / 81 / 11% | 15 / 69 / 16% |
| where in the turn | 0.51 | 0.50 |

- For coaches the blitz is nearly always used, and mostly just as one more good block: the "other" targets are
  linemen (MA 5.8, AV 8.8), usually next to one or two of the blitzer's team-mates (assists), rarely on the sideline.
  The computer keeps its blitz for a job (their carrier, a marker on ours) and otherwise often doesn't use it.
- Why: `blitzPlan` (the general blitz) needed a value of 3 (an ordinary block 2.5) and came after every other block,
  by when the likely blitzers had moved into the screen or cage.
- `blitz2` (not released: `blitz-early.patch`): the bar lowered to 2.5 (`blitzMin`): blitzes 48 -> 52% of turns. Then
  the general blitz decided early (straight after the risk-free blocks, unless their carrier is to be blitzed or ours is
  marked): 69% of turns, target down 67%, blocks 32.9 -> 36.4 a match; but 29-39 touchdowns, 14-16 wins over 48.
  Not when we have the ball (`blitzOurs` 0): 34-31, 17-15 over 48, then 71-67, 33-34 over 96: 105-98, 50-49 in all,
  blocks 37.9 v 33.6. Level, and slower to think (the blitz is worked out at every decision until it's used: the test
  matches took about 60% longer). Not released.
- `blitz3` (not released: `blitz-targets.patch`, which also holds `blitz2`): `blitzBonus` adds what a target sets up to
  the general blitz's value: next to their carrier (a cage corner) 2, their deepest player while our carrier is within
  10 squares 1.5, a quick or sure-handed player (Catch, Sprint, Dodge or MA 7+) deep in our half 1.5 (+0.5 if they could
  get the ball), a flimsy expensive one (AV 8 or less: armour-break chance x cost / 40, about 1.3 for an elf catcher),
  0.5 for each of our players next to it who's tied up with another opponent (up to 1.5). Weighted by the chance of
  moving them (knockdown or push). Blitzes 48 -> 56% of turns, more Gutter Runners, Skinks and Goblins, more cage
  corners (9% with their ball). Against v3.66: 29-33 touchdowns, 14-14 wins over 48; with the early blitz too
  (`blitzOurs` 0): 30-33, 17-16. Level both ways.
- So far nothing about the blitz (more of them, earlier, or better-chosen targets) has changed results against the
  computer. It may still matter more against people, whose defence (keeping their distance) differs from the
  computer's (going hard after the ball), but the tests here can't show that.
- Routes (`blitz-targets.patch` now includes them; AIP `bzRoutes`): a target whose knockdown opens a way through for our
  carrier, this turn (`laneGain`) or next (`routeGain`: `nextTurnLane` with them knocked over), x 0.6 (`bzLane`), and for
  our two quickest players next turn, x 0.3 each (`bzRun`, up to 1). With the early blitz as well, blitzing now looks
  like the coaches': a blitz in 87% of turns (89%), "other" targets 62% (78%), with their ball the carrier 47% (25%) and
  a cage corner 12% (12%), target down 63% (67%); blocks 38 a match. Against v3.66: 36-35, 17-18 over 48, then 63-70,
  30-37 over 96: 99-105 touchdowns, 47-55 wins, turnovers 669-635, casualties 212-187. Level at best. Not released.

## The end of a half (Oct 2026)
`late-turns.py` (100 replays) and `bb-lateturns.js` (v3.66, 96 mirror matches): turns 7 and 8 of a half that start
with the side's carrier on its feet, by how far it is from the end zone against its Move, and how the turn ends.

| turn 8: touchdown / tried and failed / short | coaches | BludBowl |
|---|---|---|
| can walk in (to go <= MA) | 96 / 4 / 0% (98 turns) | 92 / 8 / 0% (13) |
| needs a Rush or two | 86 / 14 / 0% (14) | 70 / 30 / 0% (10) |
| 3-6 beyond its Move | 32 / 32 / 13% (31; hand-offs 6 of 10) | 0 / 40 / 60% (55) |
| further | 19 / 69 / 0% (16) | 0 / 31 / 69% (51) |

- Coaches start their last turn with the carrier able to walk in 62% of the time (the computer 10%): they use turn 7 to
  set it up, and often hold the ball on turn 7 rather than score (only 28% of turn-7 carriers who could walk in did),
  so the other side has no time to reply. From further out they score mostly by hand-off.
- `endgame` / `egclear` (released in v3.67): on the last turn, (1) the carrier may dodge or Rush to reach a team-mate
  for a hand-off or pass (`throwToScore`'s `passMove` 40 instead of 100; the odds count it against the throw), and (2) if
  the way in isn't safe, it first blocks whoever makes it hard when (1 - turnover) x (knockdown x the odds with them
  down + otherwise the odds now) beats the odds now by 0.04 (`egMargin`). Against v3.66: (1) alone 45-24, 24-13 over 48,
  then 68-71, 30-37 over 96 (113-95, 54-50); (1) and (2) 65-58, 30-29 over 96. Together 178-153 over 240.
  The last-turn numbers themselves hardly moved (these cases are rare), so most of that is luck: the changes are small
  and only act in the last turn, which is why they were kept.
- Tried and switched off (AIP, default 0): on turn 7, a bonus for stopping where the carrier can walk in next turn
  (`egWalk` 4, `egRush` 2) and more weight on ground (`egProg` 1), and runners sent ahead to within a run of the end zone
  (`egRun`). With all of them: 26-42 touchdowns, 14-23 wins over 48 (pushing the carrier on left it exposed on their
  turn 7); the runners alone with (1): 36-32, 18-17.
- Still the big gap: the computer arrives at its last turn too far away (69% 3+ squares beyond its Move, coaches 30%).

## Throw Team-mate (Oct 2026)
`fumbbl-ttm.py` (100 replays) and `bb-ttm.js` (v3.70, 54 mirror matches of the nine teams whose default line-up has
both a thrower and a Right Stuff player: Black Orc, Chaos Renegade, Gnome, Goblin, Halfling, Human, Ogre, Orc, Snotling).
Purpose from where the thrown player ended up: the ball (they were carrying it), onto an opponent (landed on one, or an
opponent was hurt), next to their carrier, or just up the pitch.

| | coaches | BludBowl |
|---|---|---|
| throws a match (teams able to) | 0.80 (39 in 49 team-matches) | 0.07 (8 in 108) |
| ...Ogre / Gnome / Halfling / Goblin | 2.1 / 3.5 / 5.0 / 2.0 (7, 2, 1, 1 matches) | 0.17 / 0.17 / 0.08 / 0.08 |
| ...Black Orc / Orc / Human | 0.7 / 0.2 / 0.2 | 0.08 / 0 / 0 |
| kicked (Kick Team-mate) rather than thrown | 23% | 25% |
| with the ball | 0% | 0% |
| up the pitch | 69%: 4.3 squares, on their feet 48% | 88%: 2.6 squares, on their feet 57% |
| next to their carrier | 13% | 12% |
| onto an opponent | 18%: accurate 86%, an opponent hurt every time | 0% |
| on their last turn (turn 8) | 31% | 0% |

- The coaches who throw are the teams built round it (Ogres with Gnoblars, Gnomes, Halflings, Goblins); Orcs, Humans and
  Black Orcs hardly bother. Most throws move a small player up the pitch; about one in five is aimed at an opponent
  (four of the seven were Ogre Punters kicking Gnoblars into the opposition); none carried the ball. A third come on
  the last turn of a half, when a failure costs nothing (and a successful throw earns SPP).
- The computer throws about a tenth as often. It only throws when a Right Stuff player happens to be standing next to
  the thrower at the end of its turn (`ttmPair` / `getAdjacentRightStuffTeammate`): nothing ever moves one into place
  (only `ttmHandoffPlan` does, for a ball carrier to score). And it never aims at an opponent in practice.
- Small samples: 39 coach throws in all, and only one or two matches for some teams.

### Throwing more (`ttm2`, released in v3.71)
- **Bring the pair together:** when no Right Stuff player is next to a thrower, one walks over without dice if a throw from
  there would be worth it (`ttmGather`), and the pair is kept back for a throw at the end of the turn.
- **Hold them back early:** the thrower was nearly always used up (blocks, the cage) before step 9 looked at throws (8 of
  9 turns), so at the start of the turn, if a throw worth 0.8 (`ttmHold`; any throw on the last turn) is on, the thrower
  and team-mate are kept out of the other steps. Not when we have the ball (`ttmHoldO` 0): holding Gnome players back
  on offence cost them their cage (gnomes 18-38 touchdowns over 24 matches with it, 14-14 without). And not a thrower in
  contact: its block comes first.
- **Lower bars:** a throw 0.45 (`ttmBar`, was 0.6), a kick at an opponent 0.8 (`ktmBar`, was 1.2), up the pitch with only
  one Right Stuff player, and 0.05 on the last turn (`ttmLast`).
- `bb-ttm.js` (6 teams, 24 team-matches): 1.42 throws a match (was 0.07; coaches 0.8 over all nine teams, about 2-5 for
  the teams built round it); up the pitch 76% (5.1 squares, on their feet 42%), next to their carrier 12%, onto an
  opponent 12%; turn 8 24% (coaches 31%). Accuracy is low (27% accurate, 19% fumbled).
- Against v3.70 over the nine throwing teams: 33-30 touchdowns, 17-13 wins, turnovers 151-174 over 45. Level. Released
  because the teams now play to type without doing worse.

## Bombs (Oct 2026)
`fumbbl-bombs.py` (the replays, plus 42 more Goblin and Snotling matches: 12 from the top-coaches list, 30 found with
`fumbbl-race-replays.py`, which pages back through FUMBBL's match list for a race with a coach rated 1500+) and
`bb-bombs.js` (v3.71, 24 mirror matches each of Goblins and Snotlings, the two teams with a bomber in their default
line-up: the Bomma and the Fungus Flinga). "At whom" is what was in the blast (the target square and the eight round it).

| | coaches (25 team-matches) | BludBowl (48) |
|---|---|---|
| bombs a match | 1.7 (Goblin 1.9, Snotling 1.6) | 0.12-0.17 (18 in 120 team-matches over three runs; Goblins 2 in 60) |
| team-turns starting with the bomber on their feet | 3.3 a match | 7.0 a match |
| ...a bomb thrown in | 51% of them | 2% |
| at their ball carrier (in the blast) | 33% | 50% (of 6) |
| at a crowd (2+ standing opponents) | 50% | 50% |
| at one standing player | 10% | 0% |
| aimed right at an opponent's square | 38% | 0-50% (small sample) |
| standing opponents in the blast | 2.9 | 3.8 |
| own standing player in the blast | 14% | 0% (never allowed) |
| accurate / inaccurate / fumbled | 38 / 33 / 26%, re-rolled 29% | 50 / 0 / 50% (of 6) |
| opponents knocked down a bomb | 0.71 (none 40%) | 0.83 |
| own player knocked down (a turnover) | 40% | 33% |
| range: quick / short | 50 / 48% | 50 / 50% |
| bomber's nearest opponent as it throws: next to it / 2-3 / 4+ | 19 / 69 / 12% | 0 / 100 / 0% |
| when in the turn | 0.80 of the way through, last action 50% | 0.97, last 67% |
| turns 1-5 of the half | 95% | about half |

- **Coaches bomb about every other turn the bomber is up.** The bomber is sent off at the end of every drive anyway
  (Secret Weapon), so a bomb not thrown is wasted. They throw at whatever is bunched up, half the time a crowd and a
  third of the time their ball carrier; mostly at linemen, as that's who stands on the line (52%).
- **They accept a lot of risk:** only 38% accurate, 26% fumbled, and 40% of bombs knock over one of their own (a
  turnover). They manage it by throwing late: the bomb is the last action half the time, so the turnover costs little.
- **They keep the bomber 2-3 squares from the opposition** (69%): in range of a quick or short bomb (no move is allowed
  before throwing) but not marked (19%).
- **The computer hardly ever throws.** Over 29 turns with its bomber standing (4 matches with counters in the code),
  the best bomb on offer passed its bar (0.6) only 2-3 times, and 11 of the 29 started with the bomber next to an
  opponent; 17 of 46 turns started with the bomber on the floor. Why the bar is so rarely met (`bombPlan`/`bombSquare`):
  - a fumble always costs 1.5, plus 0.6 for each team-mate still to act - but late in the turn, with none of our players
    next to the bomber, a fumble only knocks over a player who's going to be sent off anyway, and ends a turn that's
    over;
  - any square with one of our standing players in the blast is ruled out (coaches: 14%);
  - nothing counts the bomber being sent off at the end of the drive (use it or lose it);
  - the bomber isn't kept back for the end of the turn (it joins the cage and the screens), and nothing puts it 2-3
    squares behind our line, out of reach, for the next turn's bomb.

### Throwing bombs (`bomb2`, released in v3.72)
- **Price them like coaches:** as the last action of the turn, a fumble costs 0.4 (`bombFum`; the bomber is floored and a
  finished turn ends) plus 0.75 for each team-mate standing next to the bomber; a team-mate in the blast is allowed (at
  half the usual penalty); the bar is 0.3 (`bombBar`, was 0.6). Earlier in the turn, as before.
- **Keep the bomber back:** out of the blocks, the cage and the screens; the bomb comes at the very end (after any thrown
  team-mate, since a fumbled bomb can end the turn).
- **Get ready for next turn:** with nothing worth a bomb, the bomber steps (no dice) to 2-4 squares from the nearest
  opponent with as many of them in range as possible (`bombPosPick`).
- `bb-bombs.js` (12 matches): 1.46 bombs a match (coaches 1.7), in 28% of the turns the bomber starts on its feet
  (coaches 51%); a crowd 86%, their carrier 11%; accurate 34%, fumbled 40% (coaches 26%); a turnover 40% (coaches
  40%); always the last action. Unlike the coaches (their ball 76%), most come while we have the ball (74%).
- Against v3.71 (Goblins and Snotlings, 48 matches): 48-44 touchdowns, 16-14 wins, casualties 168-154. Level; released
  because the teams now play to type without doing worse.

## Coaches and the AI in the same positions (Nov 2026, v4.25)
Not just per-match totals: every decision of strong FUMBBL coaches, with what BludBowl's AI would have done in exactly that
position. The replays (`data/fumbbl-replays/`, now 288: the 200 best-rated matches of the top-coaches list, 57 more to even out
the teams, and 31 found for the thinnest teams with `fumbbl-race-replays.py`) are read by the replay viewer (`FREP.parse`), each
position is loaded into the AI's decision service and answered by the AI (`AI.bridge.nnRecord`), and the coach's own choice is
put in the same form (`nnLabel`). The sides used: the stronger coach in every match, and in the searched-for matches every side
rated 1500+. The tools are in the neural-network pipeline on the owner's PC (`nn/fumbbl_decisions.js`, `fumbbl.py`,
`fumbbl_report.py`, `fumbbl_blocks.js` / `.py`: see `HANDOVER.md`). 55,208 decisions: 38,821 turn plans, 11,677 block-dice
choices, 4,710 routes.

| | coaches | BludBowl's AI, same positions |
|---|---|---|
| first action of a turn: move / block / blitz | 73 / 18 / 8% | 48 / 40 / 7% |
| decisions that are a Blitz | 10.7% | 5.9% |
| ending the turn with players unused | 6.3% | 2.0% |
| blocks on 1 die / defender picks | 10% / 2% | 1% / 0% |
| same choice as the coach: turn plans (exactly / player and action / player) | | 13 / 25 / 30% |
| same block die as the coach | | 80% |

- Turn order: coaches move players in first (assists, screens) and block after; the AI blocks first with whoever is already
  next to an opponent. Where the coach blitzed, the AI would have blitzed only 17% of the time (moved 51%).
- Where the coach ended the turn, the AI would still have moved someone (72%).

### The coaches' 1-die blocks (`fumbbl_blocks`: 12,777 blocks, re-rolls from FUMBBL's raw reports)

| | 3 dice | 2 dice | 1 die | defender picks |
|---|---|---|---|---|
| share of blocks | 14% | 76% | 9% | 1% |
| the last action of the turn | 9% | 12% | 39% | 49% |
| in the first half of the turn's activations | 53% | 46% | 15% | 15% |
| target is their carrier | 4% | 4% | 12% | 26% |
| team re-roll on the block dice | 3% | 5% | 11% | 11% |
| blocker with Block on a target with neither Block nor Dodge | 7% | 28% | 36% | 41% |
| target down / blocker down | 69 / 4% | 67 / 5% | 51 / 19% | 32 / 31% |

- Both mopping up and key plays: mostly late in the turn (39% the very last action), and three times as often on their carrier
  as other blocks. On the carrier, a 1-die block took the ball away by the end of the turn 49% of the time. Team re-rolls on
  1-die blocks: 20% of those around the ball, 9% of end-of-turn ones away from it.
- Chosen with care: with Block against a target with neither Block nor Dodge they knock the target down 54% of the time and the
  blocker only 9%.
- Next (the owner's idea): make these part of the AI's turn plan, with team-mates moved in first so that a 1-die block becomes a
  2-dice one, or at least isn't a worse one (no assists for the defender).

### At the end of the turn (`blk1`, released in v4.26)
In the same positions where a coach threw a 1-die block with at most one other player still to act, BludBowl's AI would have
ended its turn 58% of the time (322 positions; blocked 5%). `blk1`: once everyone else has moved, a player still next to an
opponent blocks if it's a good trade (Turnover chance at most `lateTurn` 0.2, target down at least `lateDown` 0.4; not next
to our own carrier), the best first; before that, a player with nothing better to do steps (without dice) to the square where
an assist most improves one of those blocks (`lateGain` 0.15). Tests with `tools/ai-match-jsdom.js`, the AI with it against
the AI without, 12 teams:
- the end-of-turn blocks alone: 1-die blocks 1.9 -> 2.9 a match; 96 matches: won 30, drew 29, lost 37, touchdowns 72-81,
  turnovers 429-388 (a slight lean the wrong way, like `lateblk` before). Stricter (`lateDown` 0.5), 48 matches: 20-8-20, 35-33.
- with the assists first (the owner's point: coaches put team-mates in place so the block isn't worse than it need be),
  144 matches: won 47, drew 47, lost 50, touchdowns 96-100, turnovers 608-616 (the extra Turnovers gone), casualties 203-205;
  1-die blocks 3.1 v 2.0 a match, blocks 37.3 v 36.8. Level, and released as the AI now plays closer to the coaches (1-die
  blocks 5.1 a match). Starting rosters on both sides: with developed teams (more Block) the good trades come up more often.

### Where they choose differently, by situation (`nn/fumbbl_explore.py`: an explorer page with example boards)
Of 38,821 turn decisions: the same choice 13%; both move but a different player (turn order) 25%; the same player to a
different square 11%. The commonest different choices, and where they are over-represented against all decisions:

| the coach / the AI | share | where, more often than usual |
|---|---|---|
| moves / blocks | 15% | the first action of the turn 21% (all 13%), early in the turn 56% (47%) |
| blitzes / moves | 5.5% | their ball 65% (36%) |
| ends the turn / moves | 4.5% | late in the turn 80% (40%), their ball 48% (36%) |
| blocks / moves | 4% | their ball 55% (36%) |
| moves / blitzes | 4% | our ball 77% (42%) |
| blitzes / blocks | 3% | early in the turn 59% (47%), a loose ball 29% (22%) |
| moves / goes for the ball | 3% | a loose ball (all of them), turns 7-8 31% (19%) |
| fouls / moves | 1% | late in the turn 80% (40%), our ball 65% (42%) |

- On defence (their ball) the coaches hit: they Blitz and block where the AI repositions (screens, markers), and they stop
  earlier, leaving players where they stand rather than moving everyone.
- On offence (our ball) it's the other way round: the AI blitzes where the coaches just move (the cage, support).
- A loose ball late in a half: the AI goes for it where the coaches don't (often blocking or screening first).
- Fouls: when the coaches have the ball, at the end of the turn.

## Moving before blocking (Nov 2026: `stand1` released in v4.27)
From the same-position comparison: the coaches' first action of a turn is a move 73% of the time (the AI's a block 40%).
Those opening moves are 95% dice-free, end next to an opponent 71% of the time and cover 2.1 squares on average; 41% of
them are a stand-up in place (nearly always, 95%, next to a standing opponent), and when the next action is a block or
Blitz its target is next to where the mover went 56% of the time. Where a coach stood a player up first, the AI would have
blocked or moved with someone else (82%). Tests (`tools/ai-match-jsdom.js`, against the AI without the switch, 12 teams):
- `ast1`, the assist set-ups (step 5c) before the safe blocks: 40.7 v 35.1 blocks a match but won 10, drew 16, lost 22,
  touchdowns 30-48 over 48. The early assists take players away from the cage and screens. Dropped.
- `stand1` as a first try, everyone lying next to an opponent stood up first: won 17-13-18, touchdowns 24-36, turnovers
  229-191 over 48 (standing up uses the player's whole activation; some would have done better later). Changed to:
- `stand1` (released): only a player whose standing up gives one of our standing players an assist on an opponent next to
  him (block value up half a point or more, the block then at most 12% risk). 288 matches: touchdowns 207-165 (luck 3%),
  won 103, drew 102, lost 83, turnovers 1249-1275, casualties 427-433, blocks 38.1 v 37.4 a match.

## Where the AI loses ground (Nov 2026, the outcome predictor as a judge)
`nn/blunders.py`: every activation of BludBowl's AI in 4,000 recorded BotBowl games (`bb_003`, which the predictor's decision
network never trained on), with the predicted result (win chance, a draw counting half) at its start and at the same side's
next turn decision (the end of the game: the real result). One change is mostly dice; averaged over many activations of a
kind the luck evens out, and as the predictor expects the AI's usual play, a kind with a clearly negative average costs more
than the AI's norm. (Per single decision rather than per activation, the in-between steps - block dice, pushes, follow-ups,
re-rolls - all come out negative together: the predictor misreads those moments, so they aren't comparable.)
`nn/blunders_explore.py` draws random examples of each kind on boards.

| activation | how often (4,000 games) | each | a game |
|---|---|---|---|
| a Blitz while we have the ball | 16,897 | -0.55 points | -2.3 |
| a move with dice while they have the ball | 20,405 | -0.38 | -1.9 |
| a Blitz as the turn's first action | 6,446 | -0.80 | -1.3 |
| ending the turn while they have the ball | 13,489 | -0.38 | -1.3 |
| ending the turn with only 1-4 players used | 5,442 | -0.80 | -1.1 |
| a Blitz while the ball is loose | 4,566 | -0.91 | -1.0 |
| a hand-off under 70% | 5,354 | -0.74 | -1.0 |
| a foul | 5,136 | -0.59 | -0.8 |
| (for comparison) a 2-dice / 3-dice block | 101,040 / 28,141 | +0.19 / +0.16 | |

- The costliest habit, a Blitz while we have the ball, is also where the coaches differ: 77% of the "AI blitzes where the coach
  moves" cases are with our ball. Two independent sources point at it: the next thing to try.
- Blocks come out slightly positive and ordinary moves slightly negative: room to block more and move less.
- Points are of win chance (a draw half): 1 point = 1% more of a win.
