# Handover: training a neural network to play like BludBowl's AI

For a Claude Code session on the owner's PC (AMD RX 9070 XT, Python environment set up there). Written 4 Nov 2026 by the
cloud session that built the pieces below. Read this first, then CLAUDE.md (workflow: commit straight to main, version
bumps only for changes to index.html) and `ai-training/botbowl-bridge.md` (details of the bridge). Pull the latest main first.

## The goal
Train a network, on the PC's GPU, that imitates BludBowl's scripted AI (the `AI` module in index.html), then improve it
(self-play) and in the end let it play inside the game as an option. First step: imitation (behaviour cloning) from
recorded decisions of BludBowl's AI.

## What exists (all in this repo)
- **The game and its AI**: `index.html`, one file. The AI is `const AI = (function () { ... })()`: `choose()` returns a plan
  `{ pid, kind: move|block|blitz|handoff|pass|foul|secure|ttm|stab|vomit|..., target, receiver, pick(moves, p) }`, `runPlan()`
  carries it out, plus smaller decisions (`rrWorth` re-rolls, `diceChoice`, `pushChoice`, `followUp`, `setupTeam`,
  `kickTarget`...). Tuning switches: `AIX` (per-team flags) and `window.AIP` (per-team values).
- **Fast AI-v-AI matches**: `node tools/ai-match.js --races orc,human --n 20 --par 4` (headless Chrome via Playwright, test
  mode `?simtest`, ~10 s a match). Prints touchdown/win splits with the chance they're luck.
- **No-browser game**: `tools/headless-match.js` runs index.html inside jsdom in Node (`npm i jsdom` in the BludBowl folder).
  `openGame()` gives a ready page; `node tools/headless-match.js orc human` plays a match (~30-45 s, test mode).
- **The AI as a service** (`AI.bridge` in index.html, served by `tools/bridge-server.js`, JSON lines on stdin/stdout):
  `load(position)` then `turn` (plan + route as squares), `reroll`, `dice`, `push`, `follow`, `setup`, `kick`, `touchback`,
  `apothecary`, `intercept`. Position format: see `load()` in index.html (players with team 0/1, type, race, stats, skills,
  square, state up/prone/stunned/ko/cas/reserve/out, used, maLeft, rooted, distracted; ball; turn; re-rolls; weather...).
  Team 0 is the side that scores at the right-hand end. The server opens the game with the normal clock (not test mode,
  whose clock spins the CPU even when idle).
- **BludBowl's AI as a BotBowl bot**: `tools/botbowl/bludbowl_bot.py` (a BotBowl `ProcBot`, registered as 'bludbowl') asks the
  service for every decision and turns the answer into BotBowl actions. `tools/botbowl/play.py --n 30 [--team orc]` plays it
  against BotBowl's scripted bot inside BotBowl and prints results, luck figures, and anything adjusted.
- **A port of BotBowl's scripted bot inside BludBowl** ("brain: botbowl", `bbChoose`), for benchmarks in BludBowl itself.
- **FUMBBL research**: `ai-training/README.md` (strong human coaches v our AI; 300 matches; scripts to re-run).

Results so far (BludBowl's AI v BotBowl's scripted bot): in BludBowl, Humans, 100 matches: 48-31-21 (W-D-L). In BotBowl,
Humans, 120 matches: 71-34-15, TDs 123-36. Twelve other teams in BotBowl (small samples): ahead with every one
(table in `botbowl-bridge.md`).

## BotBowl Season 3 (the training world for the first network)
- Repo: https://github.com/dhillier/botbowl-season3. **Use branch `codex/local-team-expansion`** (all 30 teams, 108 skills;
  not merged yet, so it may move). Its training environment (`gym.make('botbowl-s3-v1')`) is Humans only for now.
- Install: Python 3.8-3.11 (3.11 used here), a C++ compiler (Visual Studio Build Tools on Windows) for its Cython pathfinder:
  `pip install setuptools==68.2.2 wheel==0.41.3 && pip install -r requirements.txt && pip install --no-build-isolation -e .`
- It imports `tkinter` for its viewer; where that's missing, `play.py` stands in an empty module.
- Its interface for networks (docs/season3-rl.md there): observation dict `spatial` 63x17x28, `players` 24x56, `global` 241,
  `public_rolls` 8x46, `action_features` 10256x3, `action_mask` 10256; a fixed `Discrete(10256)` action space;
  `Season3ActionCodec.encode(Action)` / `.decode(index)` map BotBowl actions to and from indices. Away-coach observations are
  mirrored so both sides attack towards x=1.

## Suggested first pipeline (imitation, Humans, in BotBowl)
1. **Record demonstrations.** Play BotBowl games where `BludBowlBot` (tools/botbowl) acts, against the scripted bot or
   itself. At every decision the bot makes, record the observation for the acting coach (the observation builder behind
   `Season3Env`, in `botbowl/ai/season3_env.py`) and the index of the action it chose (`Season3ActionCodec.encode`), plus
   the mask. Wrap `BludBowlBot.act()` to do this. Save in chunks (e.g. .npz per few hundred games).
   - Speed: ~8 s a game with one bridge server, so run several processes in parallel (each starts its own Node server).
     Thousands of games are realistic overnight.
   - Check the observation contract version (`s3-observations-v2`) is recorded with the data: the docs say old data is
     rejected when it changes.
2. **Train.** A network over `spatial` (a small CNN or ResNet) + MLP over `players`/`global`, producing 10256 logits;
   mask illegal actions (set to -inf) and train with cross-entropy against BludBowl's choices. Track accuracy on held-out
   games, separately for turn decisions (which player/action) and the rest.
3. **Evaluate by playing.** A small `ProcBot`/env agent that picks the network's best legal action. Play it against the
   scripted bot and against `BludBowlBot` (`play.py`-style runner) and compare with BludBowl's own 71-34-15.
4. **Then**: self-play fine-tuning (RL) starting from the imitation network; more teams once BotBowl's environment covers
   them (or record in BludBowl itself via the bridge for all teams); finally run the network in the game (ONNX export +
   onnxruntime-web, or a hand-written forward pass for a small net), as an AI option, keeping the scripted AI as fallback.

Note: the bot sometimes turns one BludBowl decision into several BotBowl actions (start an action, each square of the
route, the block). Each is its own BotBowl decision, so each is one training example. That's fine for imitation, but the
network learns BotBowl's step-by-step form, not BludBowl's plan form.

## GPU (RX 9070 XT)
AMD ROCm supports RDNA 4 (the 9070 series). Linux: PyTorch's ROCm build. Windows: AMD's PyTorch build for Radeon, or WSL2
with ROCm. Check with `python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"`
(ROCm PyTorch uses the `cuda` names). 16 GB is plenty for these networks. Data generation runs on the CPU, so more cores
mean faster recording.

## Gotchas met so far
- Node needs jsdom where it can find it (`npm i jsdom` in the BludBowl folder; the bot adds `node_modules` there to NODE_PATH).
- BotBowl teams/players aren't hashable: key them by `team_id` / `player_id`.
- Players sitting out a drive (Sweltering Heat, a bad snack) must be marked unavailable, or set-up loops.
- A turn that ends early (touchdown, turnover) can leave queued moves: clear non-setup actions when set-up starts.
- Season 3 offers the re-roll and the block dice together: decline the re-roll first, then pick the die (picking straight
  from that question crashes BotBowl's engine when the attacker has Wrestle).
- Some BludBowl Blitz plans pick their target late; Season 3 declares it first (the bot names the nearest opponent).
- BotBowl's scripted bot occasionally tries an action its engine refuses on newer teams: `play.py`'s `SafeScripted` swaps
  it for a legal one and counts it.
- Killing processes by name with `pkill -f` can match your own shell command line: use the PIDs.

## Where it stands (5 Nov 2026, from the PC session)
- The network now uses **BludBowl's own decision format**, built by index.html (`AI.bridge`'s `nn` block, v4.24; see
  `botbowl-bridge.md`), not BotBowl's Human-only training interface: the same network plays in BotBowl through the bridge
  (any of the 30 teams) and can later run in the game itself.
- Pipeline on the PC (`E:\python\projects\BloodbowlAI_312\nn`, not in this repo): `record.py` (BludBowl's AI in BotBowl,
  ~5,000 games/h with 14 workers), `train.py` (GPU), `netbot.py` (the network as a BotBowl bot through the bridge; one shared
  GPU process serves all game workers), `evaluate.py`. Its README has commands and results.
- First result (`bb_v1`, 4,000 recorded games): 76% held-out agreement with BludBowl's AI; v BotBowl's scripted bot over 112
  matches won 55, drew 30, lost 27 (BludBowl's own AI on the same matches 64-25-23); v BludBowl's AI 28-32-52.
- Next: an outcome predictor (who wins from here), then FUMBBL replays (learn only from the top-rated coach's decisions),
  then self-play.
- Gotcha: on this Windows PyTorch build, a CPU copy of the network in each of 14 processes was ~40x slower per decision than
  one alone: serve the network from one GPU process instead.
