# Full patch log

Every change to BludBowl in full, newest first. The game's "What's new" (tap the version number on the title screen) shows a shorter summary: CHANGELOG.md.

## v4.27 (6 Nov 2026)
- **Improved (AI):** players lying next to an opponent are stood up first (`stand1`), before the turn's blocks, when standing
  (no dice) gives one of our standing players an assist on that opponent (worth half a point of block value, and the block
  then at most 12% risk); the AI used to leave them to the end of the turn. Strong FUMBBL coaches open 41% of their turns'
  moves with a stand-up in place, nearly always (95%) next to an opponent (`ai-training/README.md`, "Moving before
  blocking"). Against the AI without it, over 288 matches on 12 teams: touchdowns 207-165 (a split that uneven by luck: 3%),
  won 103, drew 102, lost 83, turnovers 1249-1275, casualties 427-433. Tried and dropped on the way: standing up everyone
  lying next to an opponent first (24-36 touchdowns over 48), and lining up assists before the safe blocks (won 10, lost 22).
- **Testing:** `tools/ai-match-jsdom.js` plays every match in a fresh process (one process playing match after match slowed
  down steadily, from 28s to over 300s a match).

## v4.26 (6 Nov 2026)
- **Improved (AI):** a bashier end to the computer's turn (`blk1`). Once everyone else has moved, a player still next to an
  opponent throws the block if it's a good trade: at most a 20% chance of a Turnover and at least 40% of knocking the target
  down (typically a blocker with Block on a target with neither Block nor Dodge; any 2-dice block not yet taken), the best
  first, and not by our own ball carrier (a gap in the cage). Before that, a player with nothing better to do steps (without
  dice) to where an assist most improves one of those blocks: a 1-die block made a 2-dice one, or a poor one a good trade.
  From strong FUMBBL coaches, who throw most of their 1-die blocks at the end of the turn and pick them well
  (`ai-training/README.md`, "The coaches' 1-die blocks"). Against the AI without it, over 144 matches on 12 teams: won 47,
  drew 47, lost 50, touchdowns 96-100, turnovers 608-616, casualties 203-205 (level); 1-die blocks 3.1 a match (2.0 before),
  blocks 37.3 (36.8). Released as it plays more like the coaches without doing worse. The end-of-turn blocks alone (without
  the assists) cost about 20 extra Turnovers per 48 matches.

## v4.25 (5 Nov 2026)
- **New (testing only):** `AI.bridge.nnLabel({ op, arg })` gives someone else's choice (a FUMBBL coach's, say) as an index of
  the neural network's layout, for the position last loaded: a turn plan (player, action, square, or ending the turn), a route,
  a set-up placement, a block die, a push or kick square, and the yes/no and player choices. With the replay viewer
  (`FREP.parse`) and `nnRecord`, this turns FUMBBL replays into training examples, each with what BludBowl's own AI would have
  done in that position: 288 replays (now in `ai-training/data/fumbbl-replays/`) gave 55,208 coach decisions. Nothing
  changes in play.

## v4.24 (5 Nov 2026)
- **New (testing only):** the AI's decision service (`AI.bridge`) can describe each of its decisions the way a neural network sees them, and let a network answer instead of the AI. `nnLayout()` gives the fixed layout (version `bludbowl-nn-v1`): the deciding team always attacks the same way, a 28x17 grid (the pitch and the crowd), a table of up to 16 players a side (state, characteristics, 110 skills), the match situation, and every choice as one number: a turn plan (player, action, square), the route before a Blitz, Foul, Hand-off or Pass, each set-up placement, re-rolls, block dice, pushes, follow-ups, kick, touchback, Apothecary and interception (115,696 in all), with the legal ones listed alongside the success chance and block dice for each. `nnRecord()` returns the AI's answer plus each decision in that form, labelled with what the AI chose; `nnObs()` and `nnDecode()` let a network choose and turn its choice back into the AI's own answer, so it plays through the same bridge. The bridge also takes the score. `tools/bridge-server.js` records when asked (`record: true`); the BotBowl bot (`tools/botbowl/bludbowl_bot.py`) sends every question through one `ask()`, which can record or be answered by a network. First network trained on 4,000 recorded BotBowl matches (all 30 teams), against BotBowl's scripted bot over 112 matches: won 55, drew 30, lost 27, touchdowns 91-50 (BludBowl's own AI on the same matches: 64-25-23, 108-53). Nothing changes in play.

## v4.23 (1 Nov 2026)
- **Fixed (testing only):** the Blitzes BotBowl refused from BludBowl's AI. A player who had taken root (Take Root) or lost their tackle zones (Bone Head, Really Stupid, Hypnotic Gaze) wasn't marked as such, so a rooted Treeman kept being planned to Blitz; the decision service now takes both. And some of BludBowl's Blitz plans pick their target at the end of the move, where Season 3 declares it first: the bridge now names the standing opponent nearest where the move ends. 24 matches afterwards (Orc, Dwarf, Skaven): every answer played as given. Nothing changes in play.

## v4.22 (31 Oct 2026)
- **Improved (testing only):** the AI's decision service (`AI.bridge`) now takes any team: it switches BludBowl to the teams' races, matches each player to BludBowl's position (by name, else the nearest characteristics) with BludBowl's own skill and trait names, and names the team-mate for a Throw Team-mate. The BotBowl bot (`tools/botbowl/`) plays Stab, Projectile Vomit, Chainsaw, Hypnotic Gaze, bombs and Throw Team-mate, and `play.py --team orc` (any Season 3 team; needs BotBowl's team-expansion version) plays a mirror match with BotBowl's squads. Fixed: a turn that ended early (a touchdown, a turnover) left its moves queued, and the next set-up tried to play them. First results, 10 matches each against BotBowl's scripted bot: Orc won 6 drew 3 lost 1, Skaven 7-1-2, Dwarf 3-6-1, Wood Elf (20) 9-8-3. Nothing changes in play.

## v4.21 (31 Oct 2026)
- **Improved (testing only):** the AI's decision service (`AI.bridge`) also answers the Apothecary (the game's own call: how valuable the player is, how much match is left) and which player tries an interception, so BludBowl's AI makes those choices itself when it plays inside BotBowl. The BotBowl match runner (`tools/botbowl/play.py`) now gives the chance each result split is just luck. Nothing changes in play.

## v4.20 (31 Oct 2026)
- **New (testing only):** a decision service for BludBowl's AI (`AI.bridge` in index.html): load a position described from outside, ask for the turn plan (player, action, target and route) or any smaller decision (re-roll, block die, push square, follow-up, set-up, kick, touchback), and get the answer as plain data, worked out by the AI's own code. With `tools/bridge-server.js` (no browser needed) and `tools/botbowl/bludbowl_bot.py`, BludBowl's AI plays as a bot inside BotBowl Season 3. First 30 matches there against BotBowl's scripted bot: won 14, drew 7, lost 9, touchdowns 25-15. Nothing changes in play.

## v4.19 (31 Oct 2026)
- **New (testing only):** a second computer coach to measure BludBowl's AI against: the scripted bot from BotBowl Season 3 (github.com/dhillier/botbowl-season3), ported decision for decision onto BludBowl's moves and odds, quirks included: its priority list each activation (stand up marked players, score at 70%+, hand-offs, safe blocks, pick-ups, receivers, Blitz, cage, assists, towards the ball, risky blocks), its re-roll and block-dice rules, first push square, always follow up, always the Apothecary, its Wedge/Zone set-ups and kick to the middle. It only plays when a test run asks for it (`--newp '{"brain":"botbowl"}'`); nothing changes in normal play. First result, 100 Human v Human matches: BludBowl's AI won 48, drew 31, lost 21, touchdowns 86-48 (not luck). The bot blocks far more (50 a match v 27) and causes more casualties, but scores far less.

## v4.18 (30 Oct 2026)
- **Fixed:** when a block pushed a player onto the loose ball, the ball bounced straight away and the follow-up was asked afterwards, so the ball could come to rest in the empty square the blocker then followed up into, and stay there under them with no catch or pick-up. The rules say the follow-up is decided before any other dice are rolled: now the blocker follows up (or not) first, then the ball bounces, and if it bounces onto them they try to catch it.

## v4.17 (30 Oct 2026)
- **Changed:** the kick-off close-up replays (v4.15) have their own setting, Settings > Kick-off replays, off to start with; it only applies with Replays on. They're still recorded in saved matches, so switching it on shows them there too.

## v4.16 (30 Oct 2026)
- **New:** Kick Team-mate gets its own close-up replay (it had none in a match, and FUMBBL replays showed it as a throw): the team-mate is lined up at the kicker's feet, the run-up and the boot ("BOOTED!"), a higher flight off the ground, then the landing, crash or crowd as for a throw. A fumbled kick shows the team-mate booted into the turf where they stand. In matches, in I Like to Watch (FUMBBL marks these throws as kicked) and in saved matches.
- **Fixed:** in FUMBBL replays, a thrown or kicked team-mate who was knocked out or hurt and carried off was shown going "into the crowd".

## v4.15 (30 Oct 2026)
- **New:** kick-offs get a close-up replay, like passes, thrown team-mates and bombs: the kicker's boot, the ball high in the air with the camera following it up, then the catch, drop, bounces or touchback. In a match it plays once the ball has come down, before the receiving team's first turn (with the Replays setting on). In I Like to Watch it's built from FUMBBL's kick-off (the kicker is the one who used Kick, or else the kicking team's player nearest the middle), and saved matches in My matches keep theirs too.
- **Fixed:** in FUMBBL replays, the close-up of an inaccurate pass (a Hail Mary is always one) went black. FUMBBL puts the ball on the target square before it scatters, and the viewer took that as the landing square, in a form the close-up couldn't draw. It now lands where the ball really came down, and a player catching it there is shown catching it.
- **Fixed:** in a match, a Hail Mary thrown well was replayed as an accurate pass (it always scatters), and the log said "Accurate pass targeting undefined!" for a Hail Mary to an empty square.

## v4.14 (29 Oct 2026)
- **Changed:** full screen not working turned out to be Chrome itself: it had stopped answering full-screen requests from any page, and fully closing and reopening Chrome fixed it. The detailed diagnostic note from v4.12-4.13 is replaced by a plain one: if the full-screen button gets no answer, it says Chrome isn't responding and suggests closing and reopening it. (The one-request-at-a-time change from v4.13 stays.) The test page fstest.html is removed.

## v4.13 (29 Oct 2026)
- **Fixed (we hope):** full screen getting no answer at all from Chrome on Android. After a match or replay the main menu asks for full screen on your first tap, so tapping the full-screen button there sent two requests in one tap, and the game asked again on every tap while one was still waiting. Now only one request is ever waiting at a time, and a tap on the full-screen button is left to that button.
- **Improved:** the note when full screen doesn't come on now also says how many requests were sent and answered, whether the page had focus, and whether you'd come back to the menu from a match or replay; if the browser answers late, the note adds that.

## v4.12 (29 Oct 2026)
- **Improved:** when the full-screen button doesn't end in full screen, a note at the top of the screen says what happened (whether the browser answered, said no, or thought the game was already full screen, and whether the screen-on lock was held), to track down why full screen stopped working on one phone. The full-screen messages now show over the menus and matches alike.

## v4.11 (29 Oct 2026)
- **Improved:** when the browser refuses full screen, the message now quotes the browser's own reason, to help track down why full screen stopped working on one phone.

## v4.10 (29 Oct 2026)
- **Fixed:** a league or career match's save was deleted at full time, but its result is only recorded later, from the match summary (Main Menu) or the post-match report (Finish & save). If the game closed in between, the match was lost and had to be played again. Now it stays saved, marked as finished, until the result is recorded. The main menu's saved-match card says "full time: the result isn't recorded yet", and Resume goes straight back to the match summary to finish it. Exhibitions and tournament matches (whose results are recorded at the final whistle) work as before.
- **Improved:** the full-screen button now says why when the browser won't go full screen (some browsers, such as an app's built-in browser that opens a link, or an iPhone, don't allow it), instead of seeming to do nothing.

## v4.09 (29 Oct 2026)
- **Fixed:** the top bar cut off whatever didn't fit across the screen, so a bigger text size (the Aa button) pushed its buttons off the side, Aa itself included, leaving no way to make it smaller again. On a landscape phone the End Turn and fullscreen buttons were already cut off at the normal size. The top bar is now only ever as big as fits the screen's width (the other panels and pop-ups still take the size you pick), so every button stays in reach.
- **Improved:** tapping Aa shows the size it has switched to for a moment (Auto, 100%, 125%... 200%, then back to Auto).

## v4.08 (29 Oct 2026)
- **Improved:** Settings > Back up & restore now includes your saved replays (My matches) in the backup file. Restoring a backup adds its replays to My matches and keeps any already there ("Undo the last restore" leaves them too). Older backups, without replays, still restore as before.

## v4.07 (29 Oct 2026)
- **Changed:** I Like to Watch's line on the main menu now reads "Replay your saved matches, or any match from fumbbl.com", and its window explains both: your own matches in My matches (saved at full time, or a match file someone sent you), or a FUMBBL match by its number. The list heading is now "Pick a match", as it holds My matches as well as the featured FUMBBL ones.

## v4.06 (29 Oct 2026)
- **Removed:** the BludBowl epics list in I Like to Watch > Our picks (and the epic/ folder behind it). Saved matches, and match files someone sends you (added with "＋ Add a match file…"), are all kept in My matches instead.

## v4.05 (29 Oct 2026)
- **New:** recorded matches (My matches) now keep the coaches' decisions, shown in the game's own windows with the answer picked, as for FUMBBL replays: re-rolling a failed roll or accepting it (team re-roll or Pro), re-rolling the block dice, every question the game asks a coach (Apothecary, Wrestle, Diving Tackle, Stand Firm, bribes, Desperate Measures, picks from several options...), and who won the coin toss and whether they chose to kick or receive.
- **New:** recorded matches keep the close-up action replays of passes, thrown team-mates and bombs, and play them in I Like to Watch (with the Replays setting on, at ½× to 2×). They're recorded even in a match where the computer plays both sides, where they aren't shown live.
- **New:** a saved match says what kind of match it was: Exhibition, Career match, "League: <league name> · Round 3" (or Semi-final, Third-place match, Final, Friendly), "Tournament: <cup name> · Quarter-finals" (or Final, or a Swiss round), plus Sevens, Online, and "after extra time" or who won on penalties. It's shown in the My matches list and kept in the exported file.
- **New:** I Like to Watch > Our picks starts with **BludBowl epics**: matches played in BludBowl that are picked out as worth watching, kept with the game (the epic/ folder). Send one in by exporting it from My matches. (The list is empty until the first is added.)

## v4.04 (29 Oct 2026)
- **New: My matches.** Every match you play (or watch the computer play) is now recorded quietly as it goes, in the same form as a FUMBBL replay. Nothing is kept unless you ask: at full time the match summary has a "💾 Save this match" button, so you can decide afterwards whether it was one worth keeping. Saved matches go in a new **My matches** tab in I Like to Watch, where each one can be:
  - **watched** on the pitch like a FUMBBL replay (same team colours, pitch and format, Sevens included), with the moves, falls and injuries, the ball, score and turns, each player's action, the rolls and re-rolls, block dice, armour and injury rolls, kick-off events, skills and touchdowns;
  - **shared or exported** as a small file (about 15-20 KB): the phone's share sheet where it has one, otherwise a download. Anyone with BludBowl can watch it with "Open a file…", or keep it with "＋ Add a match file…" in My matches (FUMBBL replay files can be kept there too);
  - **deleted** (tap twice).
  
  Saved matches stay on this device only; nothing is shared unless you export it. A match resumed from a save is recorded from the point it was resumed. On a two-device match, the host's device keeps the recording. Still to come: the coaches' decisions (re-roll or not, follow up...) and the close-up pass replays in recorded matches, and a list of epic matches to watch.

## v4.03 (29 Oct 2026)
- **Fixed:** in I Like to Watch, a skill that needs a roll to work (Steady Footing, Regeneration, Dauntless, Foul Appearance, Jump Up, Leap, Shadowing, Hypnotic Gaze and the like) only gets its pop-up when the roll succeeds, as in the game. FUMBBL marks the skill as used before rolling for it, so a failed Steady Footing (it needs a 6) still popped up. The log no longer says "uses" for these either: the roll's ✓ or ✗ line says how it went.

## v4.02 (29 Oct 2026)
- **New:** I Like to Watch now has the game's close-up action replays: after a pass, a thrown (or kicked) team-mate or a bomb, the slow-motion 16-bit replay plays it from behind the thrower, just as in a normal match. Passes show the throw, any interception, the catch or drop, the bounces and throw-ins; thrown team-mates their flight and a safe or crash landing; bombs each throw (a caught bomb thrown on) and the blast. They follow the Replays setting, play at ½× to 2×, and can be tapped to skip.

## v4.01 (29 Oct 2026)
- **Improved:** in I Like to Watch, it's much clearer who is acting. As soon as a player's action starts, the game's action banner shows what they're doing and who they are ("⚡ Blitz · Mighty Zug #17", "👊 Block", "🏃 Move", "🤝 Hand-off", "💣 Bomb"…), a bobbing pointer and a pulsing gold ring mark them on the pitch, and for a block, blitz, foul or hand-off their target gets a red ring with a dashed line to it, before any dice are rolled. The camera keeps the action clear of the banner.

## v4.00 (29 Oct 2026)
- **Changed:** the version is now 4.00. Everything from v3.01 to v3.83 below is rolled into one short summary in the game's "What's new" (CHANGELOG.md); this file keeps every change in full.

## v3.83 (29 Oct 2026)
- **Improved:** the screen stays on while you watch a FUMBBL replay or a match where the computer plays both sides, so the phone doesn't dim or lock when nothing's been tapped for a while. It goes back to normal as soon as you leave. (Works in Chrome on Android and Safari on iPhone from iOS 16.4; the phone can still dim it in battery-saving mode.)

## v3.82 (29 Oct 2026)
- **Changed:** the "right between the legs!" voice is now about a tenth as common: it plays for 1 in 25 players Stunned (was 2 in 5), and as rarely among the crowd's reactions.

## v3.81 (29 Oct 2026)
- **Improved:** FUMBBL replays show the kick-off event the way the game does: a big announcement in the event's colour with its name, the roll and what it means (Blitz, High Kick, Cheering Fans, Pitch Invasion…).
- **Improved:** moves in FUMBBL replays are smooth: a player's run plays as one continuous walk (easing in and out at the ends) instead of hopping a square at a time.
- **Improved:** FUMBBL replays give more time to follow what's happening: a pause at the start of each player's action (to read who's acting and how) and a little more time between steps. The speed button now has a ½× setting as well (½× → 1× → 2× → 4× → 8×).

## v3.80 (29 Oct 2026)
- **Changed:** "Watch a FUMBBL Match" on the main menu is now called "I Like to Watch".
- **Fixed:** leaving a FUMBBL replay goes back to the main menu, not the title screen.
- **Fixed:** the match music now plays during a FUMBBL replay (when music is on), its mood following the game, in the home team's style.

## v3.79 (29 Oct 2026)
- **Improved:** FUMBBL replays now show the game's own notifications, as when you watch the computer play itself: the turn banner; the roll window ("DODGE REQUIRED!", the target and the chance) with the result on its button; the team re-roll window with the coach's answer lit up; the block window with both players squaring up, the dice, the one chosen and the clash; the choice window for skills, the apothecary and arguing the call; the big announcements for the coin toss, weather, TOUCHDOWN!, TURNOVER! (with why), half time, secret weapons and full time; the "player removed" notice for KOs, casualties and sendings-off; and skill pop-ups. Each stays up about as long as it does for the computer, and the replay waits for it. Above 2x speed the roll windows are left out and blocks use the small dice tray, so fast play stays fast. (These replace the replay's own decision cards.)
- **New:** tap a player in a FUMBBL replay to see their card: name, number, position and team, MA/ST/AG/PA/AV, skills (tap one for what it does), and whether they're prone, stunned, KO'd or holding the ball. Tap the grass to close it.

## v3.78 (29 Oct 2026)
- **Improved:** FUMBBL replays show the coaches' decisions the way the game asks you them: a card with the question and both answers comes up, then the one the coach chose lights up and the replay carries on. Re-roll a failed roll (with what was needed and rolled, and which re-roll was used) or accept the failure; re-roll the block dice; use a skill (Sidestep, Stand Firm, Dodge…); follow up after a block (shown briefly, as it comes up so often); use the apothecary; the coin toss; kick or receive; argue the call.
- **Fixed:** a FUMBBL replay is now played on the home team's own ground (as a league match is), instead of whichever pitch the team screen last showed.

## v3.77 (29 Oct 2026)
- **New:** Featured matches in Watch a FUMBBL Match, below the match-number box (which stays). "Recent top games" looks through FUMBBL's latest 150 or so matches and lists the best: close results, lots of touchdowns, bloody games and strong coaches first (with their ratings), Competitive division first. The list is kept for 20 minutes; ↻ looks again. "Our picks" is a hand-picked ten from the matches studied for the computer's play (five-touchdown thrillers, a bloodbath with Gnoblars flying, a seven-bomb Goblin game and more). A team filter shows only matches with that team. Tap a match to watch it.

## v3.76 (29 Oct 2026)
- **Improved:** FUMBBL replays show the block dice. Each block pops up a tray under the top bar with who's blocking whom, the dice rolled (the game's own die faces) and the one chosen ringed in gold, the others faded, plus "defender picks" when it was their choice; the same dice appear as little pictures in the match log. Blocks pause a moment longer so there's time to see them.
- **Improved:** the replay's camera now keeps the action in view when you're zoomed in: whoever is moving, both players in a block, the whole of a pass or kick, a hurt player or a bomb blast stay in the part of the screen the top bar, the log, the controls and the dice leave clear. It keeps the zoom you chose (widening for a long kick, then coming back), and leaves the view alone for a moment after you pan or pinch.

## v3.75 (29 Oct 2026)
- **Improved:** FUMBBL replays now look and sound like a match. Kick-offs sail through the air, passes, hand-offs and throw-ins fly in an arc, bounces hop, and thrown team-mates fly to where they land. Blocks show the attacker lunging in and the defender rocking back, with the result (POW!, Push, Both Down…) floating over them; armour breaks, KOs and casualties have their sounds, blood and a "KO", "CAS" or "DEAD" label, bombs explode, fouls stomp, and touchdowns get the crowd going. Re-rolls, pick-ups, catches, failed rolls and the referee's whistle have sounds too, and the replay waits for each flight or hit before moving on. (The sound follows the game's sound setting.) A scattering bomb is now called a bomb in the log, not the ball.

## v3.74 (29 Oct 2026)
- **Improved:** Watching a FUMBBL match now has a running commentary in the match log: each player's action and target, the block dice and which was picked, armour and injury rolls with the result (Stunned, KO'd, Badly Hurt, Seriously Injured with the injury, Dead), dodges, Rushes, pick-ups, catches, passes, bombs and other rolls with the number needed and rolled, re-rolls and the skills used, bounces, kick-off events, weather, send-offs and touchdowns. The label above the controls is now a turn picker: choose any turn of the match to jump straight to it, and the log shows that turn from its start.
- **Fixed:** team and player names from a FUMBBL replay are now shown as plain text everywhere, so a name containing web code can't do anything.

## v3.73 (29 Oct 2026)
- **New:** Watch a FUMBBL Match (main menu). Type a match number from fumbbl.com, or paste the match page's address, and the game downloads that match's replay and plays it on the pitch: players walk, fall over and leave injured, the ball moves, and the score, turns, re-rolls and weather tick over, with each player's action in the match log. Play/pause, step forward and back, jump a turn either way, speed (1x to 8x), a slider to go anywhere in the match, and ✕ to leave. Teams and positions are matched to BludBowl's own sprites; a team BludBowl doesn't have shows as plain tokens. You can also open a replay file saved from FUMBBL. (Stage 1: commentary on dice and blocks comes next.)

## v3.72 (29 Oct 2026)
- **Improved (computer):** Goblin Bommas and Snotling Fungus Flingas now throw their bombs. The bomber stays out of the blocks, cage and screens; when there's a bunch of opponents in range it throws as the last action of the turn, accepting the risk of a fumble the way strong human coaches do (the bomber is sent off at the end of the drive anyway). With nothing to throw at, it steps to 2-4 squares from the opposition, ready for next turn (a bomber can't move before throwing). About 1.5 bombs a match (before: about one every six or seven matches; strong coaches: 1.7). Results against the previous computer were level.

## v3.71 (29 Oct 2026)
- **Improved (computer):** teams built round Throw Team-mate (Ogres, Gnomes, Halflings, Goblins, Snotlings and others with a thrower) now actually throw their small players. When a good throw is on, the computer walks a Right Stuff player over to its thrower without risking any dice, keeps the pair back, and throws at the end of the turn: mostly up the pitch, sometimes onto an opponent or next to their ball carrier. It throws more readily on the last turn of a half, when a failure costs nothing. It throws about 1.4 times a match with these teams (before: almost never; strong human coaches: about 2). Results against the previous computer were level.

## v3.70 (29 Oct 2026)
- **Improved:** league and tournament matches now each keep their own save, alongside one exhibition match. You can leave a league fixture half played, play an exhibition or a tournament tie, and come back to it later: playing that fixture again offers to resume it, and the main menu's Continue Match card shows every saved match (use the arrows to pick one). Starting a new exhibition only asks about the saved exhibition. A saved league or tournament match whose fixture has since got a result (or gone) is marked so you can discard it. A league or tournament match saved before this update moves to its own slot by itself.

## v3.69 (29 Oct 2026)
- **Fixed:** the secret found in v3.68 played its sound but stayed hidden behind the title screen.

## v3.68 (29 Oct 2026)
- **Changed:** saved formations now belong to the race, not the team: any team of that race on this device shares them. There's one set for defence (when you kick) and one for offence (when you receive), picked automatically, and the label above the buttons says which. When a formation is loaded, players are matched by name and position first, then by position, then to whoever is the nearest kind of player (Move, Strength, Agility, Armour and skills), so a formation saved with one team fits another of the same race. Formations saved before this still show until you save over them.
- **New:** a secret. Tap "By SirSpoon" on the title screen eight times.

## v3.67 (29 Oct 2026)
- **Improved (AI):** on the last turn of a half the computer works harder to get the ball over the line. If its carrier's way in needs dodges or Rushes, it first blocks whoever is in the way, when that makes scoring likelier overall, before making the run (as strong coaches do). And if the carrier can't get there alone, it will now dodge or Rush to reach a team-mate who can take a hand-off or pass and run it in (before, it only looked for team-mates it could reach without any dice). Over 240 test matches against v3.66: 178-153 touchdowns.

## v3.66 (28 Oct 2026)
- **Improved (AI):** the computer now orders its turn like strong human coaches, safest first. When the thing it most wants to do is risky (a dodge, a Rush, picking up or handing off the ball, a foul), it first makes its blocks and its moves that need no dice, so if the risky part fails, fewer players lose their go. Before its ball carrier moves, it works out where the carrier will stop and moves team-mates into the cage squares round that spot first; the carrier steps in last. Its team re-rolls changed too: it now re-rolls a block or blitz on the other side's ball carrier that wouldn't knock them over, and treats a failed Rush as worth a re-roll (both things strong coaches do). Over 144 test matches against v3.65: 134-99 touchdowns, 57-39 wins.

## v3.65 (28 Oct 2026)
- **Improved (AI):** when the computer's ball carrier chooses where to stop, it now works out where each opponent could really get to next turn: their actual route round the players on the pitch, with the dodges they'd need to get out of tackle zones and their Rushes, using the game's own movement rules. Before, it simply counted every opponent within running distance as the crow flies, even ones walled off by its team. So it now stops where its team-mates are really between it and the opposition, as strong human coaches' carriers do. Over 144 test matches against v3.64: 150-120 touchdowns, 56-45 wins, and fewer turnovers.

## v3.64 (28 Oct 2026)
- **Improved (AI):** the computer now makes use of its line when it receives, as strong human coaches do. On a turn when the loose ball is in no danger it throws its good blocks first and picks the ball up afterwards, so knocking the markers over frees its players to move without dodging (before, it grabbed the ball first and then dodged players out of contact to build the cage). Agile teams (elves, Amazons) now block with a player who is already marked, instead of dodging away. With that in place it puts seven on the line when receiving (five for teams without many sturdy players). In testing, players starting next to an opponent blocked 59% of the time (strong coaches 58%, before 45%) and dodged away 8% (coaches 3%, before 16%), and the computer threw about 33 blocks a match instead of 30. Over 144 test matches against v3.63: 136-122 touchdowns, 43-40 wins, 204-172 casualties. Part of [#26](https://github.com/sirspoon/BludBowl/issues/26).

## v3.63 (28 Oct 2026)
- **Improved (AI):** the computer sets up for kick-offs more like strong human coaches (from 71 FUMBBL replays). Kicking, it puts three cheap linemen in the middle of the line and a screen two or three squares back across the whole width, instead of six players far back; it still drops deep when the other side has only one turn left in the half. Receiving, it puts five on the line instead of three, placed so each of the kickers' line players has two or three of ours next to it (two-dice blocks on the first turn), with its strongest players opposite the kickers' weakest, plus a player in each wide zone, two ball handlers just behind and a returner. It now also uses these set-ups when it's short of players. Over 48 test matches the results were level with the old set-ups (37-34 touchdowns, 16-14 wins). Part of [#26](https://github.com/sirspoon/BludBowl/issues/26).

## v3.62 (28 Oct 2026)
- **Fixed:** the close-up replay of a pass or Throw Team-mate now shows the ball bouncing where it really went. Before, after an off-target pass, a dropped catch, a fumble or a crash landing, the replay always bounced the ball off to one side, so when it zoomed back out the ball was somewhere else. The game now records each bounce and throw-in as it happens and the replay plays them back, including a throw-in from the crowd or a player catching the bouncing ball, and the replay ends over the ball's real square.

## v3.61 (28 Oct 2026)
- **Improved (AI):** the computer blocks more, as strong coaches do. Its strong players (ST 4+ or AV 10+) who aren't carrying the ball now nearly always follow up after a block, so they're in place to hit again next turn (before, they held back about half the time). Spare players also step in, without dice, to give an assist or to stand next to one of the defender's helpers and cancel theirs, so more blocks get two dice. In testing it threw about 30 blocks a match instead of 21. Over 144 test matches the results were level with the old AI (128-134 touchdowns, 41-43 wins).

## v3.60 (28 Oct 2026)
- **Improved (AI):** the computer's ball carrier now weighs up how well the rest of the team can protect it before choosing where to stop. It still makes breaks through gaps, but it counts only team-mates who can really get next to it this turn without dice (not anyone within range, as before). That support counts for more the more opponents could reach it. It now sometimes stops a square or two short so the team can surround it. In testing it left the carrier on its own less often after a run (33% of the time, down from 43%) and lost the ball the next turn a little less. Over 144 test matches it scored 136 touchdowns to 110 against the old AI and won 59 to 41.

## v3.59 (28 Oct 2026)
- **Improved:** online tournaments need the organiser online much less.
  - **Computer ties:** ties between two computer teams are now simmed as soon as their round comes up, so nobody waits for the organiser to do it.
  - **Results passed on:** at full time, the home player's device hands the result to the other player's too. Whenever two players in a tournament connect (any Play a friend match), they swap the results they're carrying. A result then reaches the organiser through whichever of them connects to the lobby first.

## v3.58 (28 Oct 2026)
- **New:** online tournaments can now be played. This is stage two.
  - **The draw:** the organiser taps Make the draw. Entries close and empty places go to computer teams drafted to the same budget.
  - **Two players meeting:** the home player gets **Host the match** and the away player **Join the match**. Both land in the Play a friend room with the code already set and their team picked, can chat, and the guest taps Ready. When the match ends, the home player's device sends the result to the lobby.
  - **A player against a computer team:** the player taps **Play** and plays it on their own device, and the result goes to the lobby.
  - **The organiser's controls:** quick sim computer-against-computer ties, and sim a tie between players that's stuck (tap twice).
  - **Rules:** a drawn knockout tie goes to extra time, then penalties, as in a normal cup.
  - **In the lobby:** everyone sees each round, the results, the Swiss table and the winner. A result made while the lobby was closed is sent when the player next connects.

## v3.57 (28 Oct 2026)
- **New:** online tournament lobbies (Online → Online tournaments). This is the first stage.
  - **Organising:** pick the game, a knockout cup or Swiss, the number of places and the budget. The lobby opens under a code like CUP-4821, with Copy code and Share link buttons.
  - **Joining:** players type the code or open the link on their own device, then enter one of their tournament teams. A team that spends more than the budget or breaks its tier's skill-point rules can't enter. Both the player's device and the organiser's check this.
  - **In the lobby:** everyone sees the players, their teams and who's online, with a group chat. The organiser can remove a player.
  - **Saved on each device:** the organiser can close the lobby and reopen it under the same code, and players reconnect on their own.
  - **Coming next:** making the draw and playing the ties from each player's device.

## v3.56 (28 Oct 2026)
- **Improved:** the Play a friend room (two-device matches) before kick-off:
  - **Both players side by side:** each one's name and chosen team, which updates as they pick.
  - **Ready:** the guest taps I'm ready, and the host's Start match unlocks once they have. Changing team takes the tick off again.
  - **Chat while you set up:** messages carry on into the match log once the game starts.
  - **Copy code** and **Share link** buttons by the room code. The link opens the game and joins the room straight away, so there's no code to type.

## v3.55 (28 Oct 2026)
- **New:** an **Online** button on the main menu brings together everything played with friends on their own devices: Play a friend (the old Two Devices), shared leagues, and a place for online tournaments (coming next). The League and Tournaments buttons are now for leagues and tournaments on this device. Shared leagues are listed on the Online screen, and New shared league starts one there.
- **Tournaments:** the budget is now one limit for every team, with new 1,300k, 1,400k and 1,500k options. Your own teams must fit it: if a team spends more, or breaks its tier's skill-point rules, it can't enter, and the reason is shown. If a team is changed after entering so it no longer fits, its ties can't be played until it's fixed.
- **Teams:** the Matched Play format is now called a Tournament team, and its budget can go up to 1,500k.

## v3.54 (28 Oct 2026)
- **Improved:** Chaos Chosen and Chaos Renegades now use the new detailed figures where another team already has them ([#13](https://github.com/sirspoon/BludBowl/issues/13)): the Troll, Ogre and Minotaur on both teams, and the Renegades' Rat Ogre, Orc, Skaven, Dark Elf and Thrower. The Beastman, Chaos Chosen, Renegade Human and Renegade Goblin keep their own looks.

## v3.53 (28 Oct 2026)
- **Improved:** the Nurgle team has new player figures in the detailed style, keeping their old look and colours ([#13](https://github.com/sirspoon/BludBowl/issues/13)). They're sickly pink, with weeping sores, buzzing flies, rusty olive armour and stained team shorts.
  - **Rotter:** a spiked, slitted olive helm and a drooling grin.
  - **Pestigor:** a goat head with curling horns, slotted eyes and a straggly beard.
  - **Bloater:** a vast pockmarked belly and a domed olive helm with a spike, steel visor and slit, sitting in a thick collar ring.
  - **Rotspawn:** a hunched pale brute with a boar-like face, great mossy antlers hung with bells, long dangling arms and yellow boils.

## v3.52 (28 Oct 2026)
- **Improved:** the Vampires have new player figures in the detailed style, keeping their old look and colours ([#13](https://github.com/sirspoon/BludBowl/issues/13)).
  - **Thrall:** fair-haired and tired, in a white shirt with a red neckerchief, with bite marks on his neck.
  - **Vampires:** pale, with red eyes, fangs, slicked black hair in a widow's peak, and tall-collared cloaks in the team colour falling open at the front. The Runner has a purple tunic and silver circlet, and the Thrower a dark waistcoat and cravat.
  - **Blitzer:** a horned cowl in the team colour and grey plate armour.
  - **Vargheist:** a hunched bat-beast with dark wings, big ears, red eyes and fangs.

## v3.51 (28 Oct 2026)
- **Improved:** the Lizardmen have new player figures in the detailed style ([#13](https://github.com/sirspoon/BludBowl/issues/13)). Their scales now have their own colours, and the team colours go on their loincloths and crests.
  - **Skink:** blue, with bulging yellow eyes, a wide grin, a frilled crest and a curling tail.
  - **Chameleon Skink:** mottled camouflage green, with turret eyes and a flicking tongue.
  - **Saurus:** blue with a pale belly, jaws wide open, and heavy gold Aztec armour: pronged shoulder plates, collar, bracers, thigh plates and a gem medallion.
  - **Kroxigor:** bigger and more armoured, with a crocodile's long blunt snout and raised eyes, a gold brow crown with a feather crest, huge gold shoulder plates and a jewelled chest plate.

## v3.50 (23 Oct 2026)
- **Improved:** the Snotlings have new, clearer player figures in the detailed style ([#13](https://github.com/sirspoon/BludBowl/issues/13)), drawn bigger so they're easier to make out: oversized heads, huge ears, toothy grins, iron pot helmets and team rags. The Underworld team's Snotling matches.
  - **Fun-hoppa:** bouncing on a big red-spotted mushroom.
  - **Stilty Runna:** perched on tall roped stilts.
  - **Fungus Flinga:** holding up a glowing mushroom to throw.
  - **Pump Wagon:** a rickety cart with Snotlings heaving the pump, a spiked roller and a team banner.

## v3.49 (23 Oct 2026)
- **Improved:** the Tomb Kings have new player figures in the detailed style ([#13](https://github.com/sirspoon/BludBowl/issues/13)), all with broad gold collars and white linen kilts.
  - **Skeleton:** a striped team headdress over a glowing-eyed skull.
  - **Thrower:** a tall white crown with a golden cobra, the ball held up.
  - **Blitzer:** a tall gold war-helm with a crest and cheek plates, and a gold breastplate banded in the team colours.
  - **Tomb Guardian:** a towering cracked sandstone statue with glowing eyes, a striped headdress and a braided beard.

## v3.48 (23 Oct 2026)
- **Improved:** the Chaos Dwarfs have new player figures in the detailed style ([#13](https://github.com/sirspoon/BludBowl/issues/13)).
  - **Hobgoblin:** lanky and grey-green, with big ears, a long nose, a floppy pointed hat and a ragged tunic.
  - **Sneaky Stabba:** crouched and hooded, sly eyes and a grin under the hood, a curved knife held low.
  - **Blocker:** a tall flared iron hat with gold bands, a curled black beard with gold rings and dark iron armour.
  - **Flamesmith:** fire roaring from his hands and the top of his hat, embers smouldering in his beard.
  - **Bull Centaur:** an armoured Chaos Dwarf rising from a bull's body, with bull horns on his hat.
  - **Minotaur:** a huge muscled bull-man with great horns, red eyes and a gold nose ring.

## v3.47 (23 Oct 2026)
- **Improved:** the Necromantic Horror team has new player figures in the detailed style ([#13](https://github.com/sirspoon/BludBowl/issues/13)).
  - **Zombie** and **Ghoul Runner:** the same looks as the Undead team's.
  - **Wraith:** a pale, glowing spectre with a wailing face and green eyes, its body thinning into a curling wisp, and a tattered team scarf.
  - **Flesh Golem:** a huge patchwork giant of mismatched stitched skin, with neck bolts, odd eyes, a team-coloured harness and a bolted iron plate.
  - **Werewolf:** a crouching grey wolf with yellow eyes, bared fangs, big claws and a shredded team shirt.

## v3.46 (23 Oct 2026)
- **Changed:** the Undead Ghoul Runner is back to his previous look ([#13](https://github.com/sirspoon/BludBowl/issues/13)).

## v3.45 (23 Oct 2026)
- **Improved:** the Undead have new player figures in the detailed style ([#13](https://github.com/sirspoon/BludBowl/issues/13)).
  - **Skeleton:** a grinning skull with a green glow in its sockets, a visible ribcage, tattered team pads and a ragged sash.
  - **Zombie:** grey-green and shambling with arms out, one staring eye, a stitched wound and a torn shirt showing ribs.
  - **Wight Blitzer:** a crowned black helm over a skull with glowing eyes, spiked pauldrons and a tattered tabard with a bone cross.
  - **Mummy:** huge and wrapped in bandages, with glowing eyes, a gold collar and scarab, and trailing bandage ends.

## v3.44 (23 Oct 2026)
- **Improved:** the Amazons have new player figures in the detailed style ([#13](https://github.com/sirspoon/BludBowl/issues/13)). They have sun-tanned skin, long dark hair and war paint, and wear gold torcs and armbands, team-coloured wrap tops and loincloths, and sandals.
  - **Eagle Warrior:** a crown of upright eagle feathers and a long braid.
  - **Python Warrior:** a green snake coiled round her head and another round her arm, the ball held up.
  - **Piranha Warrior:** a toothed blue fin crest and blue war paint across her eyes.
  - **Jaguar Warrior:** a spotted jaguar pelt worn as a hood and over her shoulders.

## v3.43 (23 Oct 2026)
- **Improved:** the Elven Union have new player figures in the slim, detailed style of the other elves ([#13](https://github.com/sirspoon/BludBowl/issues/13)). They wear sleek team-coloured jerseys with a trim V, small pads, white boots, white face masks and a white sash at the hip.
  - **Lineman:** long swept-back blond hair.
  - **Thrower:** a high ponytail, the ball raised.
  - **Catcher:** extra-long hair, arms up for the catch.
  - **Blitzer:** dark hair swept up like a flame, a full face mask, spiked pads and steel gloves.

## v3.42 (23 Oct 2026)
- **Improved:** the Skaven have all-new player figures in the detailed style ([#13](https://github.com/sirspoon/BludBowl/issues/13)), and the Underworld team shares them. They're hunched rat-men with long snouts, beady red eyes, small swept-back ears, grey-brown fur, crouched legs and long pink tails.
  - **Clanrat:** a ragged team-coloured tunic, a rope belt and iron shoulder pads.
  - **Thrower:** a leather cap and a sash, the ball held high.
  - **Gutter Runner:** dark rag wrappings and goggles, a team-coloured cloak over his shoulder and a dagger.
  - **Blitzer:** dark iron armour: a spiked helm, spiked shoulder plates with team-coloured rims, a layered breastplate and spiked rings on his tail.
  - **Rat Ogre:** a hulking, muscled beast with scarred pink chest muscles, an iron collar and warpstone growths.

## v3.41 (23 Oct 2026)
- **Improved:** the Dwarfs have all-new player figures in the detailed style ([#13](https://github.com/sirspoon/BludBowl/issues/13)): squat and broad with big braided beards. The Old World Alliance shares them.
  - **Lineman:** a banded steel helm with a nose guard and a brown beard with a gold ring.
  - **Runner:** a padded cap, a leather jerkin and a ginger beard in two braids.
  - **Blitzer:** a horned, gold-rimmed helm and a great grey-white beard over a dark iron breastplate.
  - **Troll Slayer:** bare-chested and tattooed, with a towering orange crest and a huge orange beard.
  - **Deathroller:** a spiked iron roller under a riveted team-coloured boiler with a glowing furnace, a smoking chimney and a goggled driver.

## v3.40 (23 Oct 2026)
- **Improved:** the Humans have all-new player figures in the detailed style ([#13](https://github.com/sirspoon/BludBowl/issues/13)), and the Old World Alliance shares them.
  - **Lineman:** a round steel helm with a team-coloured crest and nose guard, round shoulder pads and a breastplate.
  - **Blitzer:** a caged helm with a tall plume, spiked pads, a breastplate with a cross and heavy gauntlets.
  - **Catcher:** a leather cap and a numbered jersey, mid-stride with his arms out for the ball.
  - **Thrower:** an open helm, pointing downfield with the ball cocked back.
  - **Ogre:** a round bald head between huge spiked shoulder pads, a dark iron body with a team-coloured chest plate.
- **Improved:** new Halfling figures: curly hair, rosy cheeks and big hairy bare feet. The Hefty wears an American football helmet with his belly out, and the Catcher a headband and white gloves.

## v3.39 (23 Oct 2026)
- **Improved:** the Bretonnians have all-new player figures in the detailed style ([#13](https://github.com/sirspoon/BludBowl/issues/13)), in heraldic quartered tabards of the team's two colours.
  - **Squire:** a peasant lad in a broad iron kettle hat, with parti-coloured hose.
  - **Knight Catcher:** an open bascinet with a long streaming plume, a mail coif, a golden fleur-de-lis and gauntlets reaching for the ball.
  - **Knight Thrower:** visor raised, a short plume, the ball cocked back over his shoulder.
  - **Grail Knight:** a flat-topped great helm with a golden grail crest, huge plate pauldrons, a team-coloured cape and a grail on his tabard.

## v3.38 (23 Oct 2026)
- **Improved:** the Black Orc has a new figure in the detailed style ([#13](https://github.com/sirspoon/BludBowl/issues/13)): darker, murkier green skin than ordinary orcs, a black iron helm with great curved horns and a spike, spiked team-coloured shoulder plates, the jaw glyph down his front and a gold belt buckle. The Goblin Bruiser and Trained Troll already use the new Goblin and light blue Troll.

## v3.37 (23 Oct 2026)
- **Improved:** the Orcs have all-new player figures in the detailed style of the elves ([#13](https://github.com/sirspoon/BludBowl/issues/13)): hunched, shaded green brutes with heavy brows, red eyes and tusks, in riveted iron and the team's colours.
  - **Lineman:** a riveted iron helm, team-coloured shoulder plates and tabard.
  - **Blitzer:** a horned skull helm, spiked plates and bracers, and the orc jaw glyph on his tabard.
  - **Big Un:** the bulkiest, darker-skinned, in black iron with massive shoulder plates.
  - **Thrower:** a topknot, a leather vest, a big grin and a spiked ball held high.
  - **Goblin:** a floppy cap, big ears, a long nose, a sneaky grin and a ragged tunic.
  - **Troll:** the classic Blood Bowl Troll with light blue skin: huge floppy ears, a spiked helm, a fist raised in a spiked bracer, an iron gauntlet, a chain across his chest and a pot belly. The Underworld Denizens' Troll is the same figure.

## v3.36 (23 Oct 2026)
- **Improved:** the Wood Elves have all-new player figures, modelled on the official team and as detailed as the High and Dark Elves ([#13](https://github.com/sirspoon/BludBowl/issues/13)). The elves wear bodysuits in the team colour swirled with green vines, laced green boots, a belt with a blue gem and a red tabard.
  - **Lineman:** a carved green wooden mask, a red crest and a bark shoulder guard.
  - **Thrower:** long auburn hair with a leaf in it, the ball raised high.
  - **Catcher:** a shaved head with two long orange braids, leaping for the ball.
  - **Wardancer:** long hair, green antlers, a bare chest with vine tattoos and a green kilt.
  - **Treeman:** a tall, gnarled trunk with shaded bark, moss, a crown of leaves, glowing eyes and root legs.

## v3.35 (23 Oct 2026)
- **Improved:** the Dark Elves have all-new player figures, as detailed as the High Elves' ([#13](https://github.com/sirspoon/BludBowl/issues/13)). They're slim and pale with pointed ears, in black armour trimmed in the team's colours, and each position has its own look.
  - **Lineman:** a team-coloured helm with a tall silver blade crest and spiky shoulder plates.
  - **Blitzer:** a golden crescent crown and golden spines fanning up from his shoulders, with spikier armour and a green gem.
  - **Runner:** a shaved head with a tall topknot and light armour, caught mid-stride.
  - **Assassin:** a deep hood and cloak, a mask hiding all but glowing red eyes, and two daggers.
  - **Witch Elf:** a huge mane of pink hair, a bladed crest, black mail with a bronze skull, bare arms and legs, and a knife in each hand.

## v3.34 (23 Oct 2026)
- **Added:** a new pitch, **Khemri**, the Tomb Kings' home ground, with its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)).
  - **The pitch:** golden desert sand rippled by the wind, with half-buried sandstone blocks, bleached bones, skulls and scarab beetles. Lapis-blue lines and bands of painted hieroglyphs run along the sides, and a winged sun disc with two cobras sits in the middle.
  - **Behind the block clashes:** a blazing sun over the pyramids, with vultures circling. Sandstone terraces under a painted cornice are packed with skeletons in striped headdresses and mummies, with painted papyrus columns, two great temple pylons framing the gate, an obelisk and braziers.
  - **The music:** Egyptian, in the Hijaz scale. A reedy mizmar playing a snake-charmer riff, a breathy ney, an oud, darbuka drums in the maqsum rhythm, a riq, finger cymbals, a sistrum and a drone, with the priests of the dead humming and bones rattling. Its referee taunt is the mizmar with the oud, ending on finger cymbals and a rattle of bones.
  - **Pitch menus:** Khemri can also be picked from the Pitch menus. The Tomb Kings were on the Graveyard before.
- **Changed:** the Snotlings now play at home on Mossy Flagstones, the Goblins' caves, instead of Muddy Grass.

## v3.33 (23 Oct 2026)
- **Added:** a new pitch, **Mootland Green**, the Halflings' home ground, with its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)).
  - **The pitch:** a bright village green mown in a check, dotted with daisies, buttercups and clover, with a great painted pie in a ring of wildflowers in the middle.
  - **Behind the block clashes:** gently rolling hills with hedgerows, trees and a windmill, and a stadium dug into grassy banks like hobbit holes, with round coloured doors, round windows with flower boxes, and chimneys smoking out of the turf. Rosy-cheeked halflings fill the terraces with ale and drumsticks, under bunting, behind a picket fence and a table of food. Off to one side, a huge stew pot bubbles over a fire while a halfling cook stirs it.
  - **The music:** a jolly folk polka. An oom-pah tuba and squeezebox, a fiddle and tin whistle, spoons, a bodhran and clapping, pots and pans clanging, the stew pot bubbling and the halflings shouting HEY! Its referee taunt is the whistle and squeezebox with spoons, ending on a pot clang and a HEY!
  - **Pitch menus:** Mootland Green can also be picked from the Pitch menus. The Halflings were on Muddy Grass before.

## v3.32 (23 Oct 2026)
- **Added:** a new pitch, **Frozen Fjord**, the Norse home ground, with its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)).
  - **The pitch:** snow, trampled to slush in places with frozen grass showing through, with glassy ice sheets, footprints and glittering frost. The lines are painted red, with a red valknut in a ring of runes in the middle.
  - **Behind the block clashes:** a frozen fjord at dusk, with a green and violet aurora that slowly shimmers and drifts, snowy peaks and falling snow. Longships are moored either side. A snow-roofed longhouse grandstand carved with dragon heads is packed with horned, bearded Norse waving axes and drinking horns, behind a row of painted round shields, with raven banners and braziers.
  - **The music:** death metal. Blast beats and double kick, tremolo-picked guitars, guttural growls and raspy shrieks, war horns, the gang roaring HEY! and the wind howling. Its referee taunt is power-chord stabs with HEYs, ending on a growl and a war horn, at the music's own pace.
  - **Pitch menus:** Frozen Fjord can also be picked from the Pitch menus. The Norse were on Muddy Grass before.

## v3.31 (23 Oct 2026)
- **Fixed:** on Orc Shantytown, the music's taunt at the referee after a sending-off dropped to half speed, because the music is so fast. It now plays at the music's own pace, and the band keeps driving underneath it instead of dropping back.

## v3.30 (23 Oct 2026)
- **Added:** a new pitch, **Altdorf**, the home ground of the Humans, Imperial Nobility and the Old World Alliance ([#7](https://github.com/sirspoon/BludBowl/issues/7)).
  - **The pitch:** Muddy Grass, with Sigmar's twin-tailed comet painted in the middle in white and gold.
  - **Behind the block clashes:** the city stadium in Altdorf. A covered timber grandstand is packed with fans in feathered caps and bobble hats, some singing and holding up scarves, with Imperial griffon and comet banners hanging from the roof and coloured boards along the front. Behind it rise the timber-framed houses of the city with smoking chimneys, the spire of the Temple of Sigmar topped by a golden comet, and the palace tower flying the Imperial flag.
  - **The music:** the same as Muddy Grass: the supporters' band, the terraces chanting, and their taunt at the referee.
  - **Pitch menus:** Altdorf can also be picked from the Pitch menus. These teams were on Muddy Grass before.

## v3.29 (23 Oct 2026)
- **Added:** a new pitch, **Ziggurat**, the Chaos Dwarfs' home ground, with its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)).
  - **The pitch:** a temple court of fired-clay tiles, one a square, blackened with soot and dusted with ash, a few cracked and glowing. Blue glazed brick bands with gold rosettes run along the sides, and Hashut's bronze bull head sits in the middle in a ring of rosettes.
  - **Behind the block clashes:** Hashut's great ziggurat with furnaces glowing on every tier, fire bowls on its corners and a blaze in the temple on top, between smoking volcanoes and furnace chimneys. In front are blue glazed walls in the Ishtar Gate style, with stepped battlements, fire bowls and gold bulls striding towards the gate. Brick stands are packed with Chaos Dwarfs, many in great flared hats with curling horns, and hobgoblins. Winged-bull lamassu guard the gate, and tall braziers blaze along the front.
  - **The music:** heavy, oppressive industrial doom. Crushing low guitars grinding from E to F, enormous slave drums, forge hammers, roaring furnaces, steam, chains and the whip, bull horns, and the priests of Hashut chanting in an ancient eastern scale. Its referee taunt is the priests chanting over hammer blows, ending on a bull horn and a doom chord.
  - **Pitch menus:** Ziggurat can also be picked from the Pitch menus. The Chaos Dwarfs were on Mossy Flagstones before.

## v3.28 (23 Oct 2026)
- **Added:** a new pitch, **Bretonnian Castle**, the Bretonnians' home ground, with its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)).
  - **The pitch:** a lord's tourney lawn, mown in stripes a square wide, with daisies and clover. The arms of Bretonnia are painted in the middle: a blue and red shield with a golden fleur-de-lis.
  - **Behind the block clashes:** a castle stadium on a summer's day. Tiered grandstands painted in heraldic colours are packed with peasants, knights and ladies in tall pointed hats, behind a barrier hung with knights' shields. Behind them is a crenellated wall with more spectators, fleur-de-lis banners and bunting, and round turrets with pointed blue roofs and fluttering flags. The players come out through the gatehouse, under the royal box where the king sits. Green hills rise beyond, with a far-off castle on one.
  - **The music:** a courtly dance for tourney day. A fingerpicked lute leads, with a recorder and a reedy shawm on the tune, a tabor and tambourine, a hurdy-gurdy drone, and herald trumpets sounding fanfares. Its referee taunt is played on the trumpets with the lute and tabor.
  - **Pitch menus:** Bretonnian Castle can also be picked from the Pitch menus. The Bretonnians were on Muddy Grass before.

## v3.27 (23 Oct 2026)
- **Added:** a new pitch, **Plague Garden**, Nurgle's home ground, with its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)).
  - **The pitch:** rotten, sickly green turf with dark mire, a few pools of bubbling slime, green spotted toadstools, patches of rot crawling with maggots and the odd fly. The Mark of Nurgle (three rings around a fourth, grinning) is daubed in dripping slime across the middle.
  - **Behind the block clashes:** a foggy yellow-green garden of dead trees and giant toadstools. A sagging, mossy timber stand is packed with bloated cultists and one-horned plaguebearers, with nurglings clambering along the rail. There are tattered banners, a plague bell on a crooked gallows, a cauldron bubbling over with green fumes, and swarms of flies.
  - **The music:** slow, gloomy doom. Sludgy guitar chords over a heavy half-time beat, a wheezing out-of-tune harmonium, a cracked plague bell and plague monks droning a dirge. Slime bubbles and squelches, and flies buzz everywhere: swarms drifting from side to side, a buzzing drone on the chords, and flies swooping past at the big moments. Its referee taunt is the harmonium and monks, ending on the bell and a doom chord.
  - **Pitch menus:** Plague Garden can also be picked from the Pitch menus. Nurgle was on Brimstone before.

## v3.26 (23 Oct 2026)
- **Added:** a new pitch, **Ogre Wastes**, the Ogres' home ground, with its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)).
  - **The pitch:** sun-baked sand and grit, scattered with rocks and pebbles, cracked dry earth, dead scrub and bleached bones. The Great Maw is painted in red ochre across the middle: a gaping round mouth ringed with fangs.
  - **Behind the block clashes:** a two-tier wooden palisade stadium under a hazy sun and snowy mountains, packed with ogres (some with long droopy moustaches) and gnoblars squeezed in between or riding on shoulders. Tall red, gold and black banners in the eastern style hang from crossbars, with horsetail standards, yurts at each end, heaps of roast haunches and beer barrels, and a whole beast turning on a spit, with gnoblars raiding the food.
  - **The music:** loud eastern folk-metal from the steppes. Great war drums and gongs, a horsehead fiddle, a throat singer droning with a whistling melody in his overtones, distorted guitars and a kit at a gallop, and the ogres grunting HUR! and bellowing the chorus. Its referee taunt is played on the fiddle over war drums, with HURs and a gong to finish.
  - **Pitch menus:** Ogre Wastes can also be picked from the Pitch menus. The Ogres were on Muddy Grass before.

## v3.25 (23 Oct 2026)
- **Added:** a new pitch, **Dwarf Hold**, the Dwarfs' home ground, with its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)).
  - **The pitch:** the polished stone floor of a great hall deep underground. Each square is its own slab, dark granite and veined marble in turn, edged with bronze. Bands of gold runes run along each end, and in the middle is a gold rune circle with an ancestor's face in a winged helm.
  - **Behind the block clashes:** a vast hall with carved pillars, burning braziers and red banners with gold hammers. Two dwarf king statues stand either side of a rune-lit great gate. Stone stands of dwarf fans (helmets, horns, beards of every colour, a few tankards raised) fill each side, and an ale stall with kegs, a barkeep and a foaming-tankard sign stands at the end of one.
  - **The music:** a deep dwarf choir, anvils ringing out a smith's rhythm, war drums, horns and the forge's bellows, all echoing round the hall. The choir hums when it's calm, chants HUM… HA! on the march and sings a hymn in the chorus. Its referee taunt is sung by the choir, with anvil strikes and a horn to finish.
  - **Pitch menus:** Dwarf Hold can also be picked from the Pitch menus. The Dwarfs were on Mossy Flagstones before. Chaos Dwarfs stay there.

## v3.24 (23 Oct 2026)
- **Added:** a new pitch, **Orc Shantytown**, the home ground of the Orcs and Black Orcs, with its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)).
  - **The pitch:** trampled almost bare and thick with mud, strewn with bones, skulls, broken planks, scraps of rusty iron and dried blood. A great cream-painted orc glyph covers the middle: a lopsided skull with a zig-zag jaw.
  - **Behind the block clashes:** a two-tier stadium of rusty corrugated iron packed with green orcs, some waving choppas. Fat stone idols of Gork (red-eyed and glaring) and Mork (green-eyed and squinting) stand at either side, with a scrap watchtower flying a war banner, skull totems, a bonfire and smoke rising.
  - **The music:** loud, fast, shouty orc punk. Distorted power chords hammered out in eighths, a pumping bass, a thrashing drum kit, and a gang of orcs shouting OI! OI! OI!, roaring WAAAGH! and chanting the chorus. Its referee taunt is power-chord stabs with OI!s and a WAAAGH! to finish.
  - **Pitch menus:** Orc Shantytown can also be picked from the Pitch menus. The Orcs and Black Orcs were on Muddy Grass before.

## v3.23 (23 Oct 2026)
- **Added:** a new pitch, **Black Ark**, the Dark Elves' home ground, with its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)).
  - **The pitch:** the deck of a floating fortress at night. Blackened planks run the length of the pitch, with iron nails, gratings over the hold, coiled ropes, mooring rings, chains along the sidelines, salt streaks and wet patches, and faint violet runes in the end zones.
  - **Behind the block clashes:** a moonlit sea, and the Ark's black spires with violet-lit windows and purple pennants.
  - **The music:** a dark sea shanty in D minor. A wheezing concertina, the crew chanting "heave… ho" and singing the tune, a booming oar-drum, rattling chains and low strings, with the hull creaking, waves, gulls and a distant ship's bell. Its referee taunt is played on the concertina with the crew singing along.
  - **Pitch menus:** Black Ark can also be picked from the Pitch menus. The Dark Elves were on Grass before.

## v3.22 (23 Oct 2026)
- **Added:** keyboard shortcuts ([#34](https://github.com/sirspoon/BludBowl/issues/34)). **Space** or **Enter** confirms: a roll, an announcement, the inducements panel, a kick-off event, the set-up, or the planned move. **Esc** cancels the planned route, a roll that can be cancelled, or the action. **M** Move, **B** Block, **L** Blitz, **F** Foul, **P** Pass, **H** Hand-off and **E** End activation pick from the action buttons. W A S D still scroll the view.
- **Changed:** a saved team's players are now numbered in their Team Builder order ([#2](https://github.com/sirspoon/BludBowl/issues/2)). The in-match Rosters list and the line-up screen already followed that order. Only the formation decides where the starters stand.
- **Clearer:** when a Rat Ogre (or anyone with Animal Savagery) fails its roll and lashes out at a team-mate, the log now says it carries on with its action afterwards, as the 2025 rules allow. It wasn't a bug, but it looked like the player acting twice. ([#31](https://github.com/sirspoon/BludBowl/issues/31))

## v3.21 (23 Oct 2026)
- **Changed:** moving now takes two taps, so you can see the route first and change it.
  - **First tap:** shows the route, with a dot for each step (D for a dodge, R for a rush) and the chance of getting there. Tap the same square again to go, or tap another square to plan a route there instead.
  - **A square next to the player:** always the direct step, even if it means a dodge. The game used to go round the long way to avoid a dodge, which costs movement.
  - **Changing the route:** drag any dot onto another square to make the route go through it, for example to take a riskier dodge and keep more movement for later. Drag the last dot to change where the move ends.
  - **Activation rolls:** rolls like Bone Head now wait until you actually move.
  - **Tap once:** Settings → Moving brings back moving on the first tap. In two-device play each player's own setting is used for their taps.

## v3.20 (23 Oct 2026)
- **Added:** recent opponents in two-device play ([#18](https://github.com/sirspoon/BludBowl/issues/18)). The Two Devices screen now remembers who you've played.
  - **Online:** each recent opponent shows a green dot when they have the game open.
  - **Invite:** tap Invite to ask them for a game without a room code. They get a pop-up and tap Join.
  - **Looking for a game:** a switch that pops up on your recent opponents' screens (with a chime) when they have the game open, so they can invite you. On a computer it can also show a desktop notification if the game is in a background tab.
  - **Privacy:** only people you've played can see you or invite you, and only while your game is open. A Forget button takes someone off the list, and a switch stops anyone seeing you at all.
  - **Phones:** a phone pauses the game when it isn't on screen, so the other player needs the game open to get a pop-up.

## v3.19 (23 Oct 2026)
- **Added:** voice chat in two-device play ([#18](https://github.com/sirspoon/BludBowl/issues/18)). Tap **🎤 Mic** next to the connection chip at the top. The browser asks for the microphone the first time, and then it's an open mic: tap again to mute (🔇) or unmute (🎙️).
  - A 🔊 on the button shows when the other player's microphone is on, and the match log says when they switch it on or off.
  - The sound goes straight between the two devices, with the browser's echo cancellation and noise suppression.
  - After a dropped connection the voice link comes back by itself.

## v3.18 (23 Oct 2026)
- **Fixed:** dragging the pitch with the mouse to look around also counted as a click where you let go, so it could move a player. A press that moves more than a few pixels now just moves the view. The same goes for dragging or pinching on a touch screen, and for the joining player in two-device play.
- **Added:** W A S D or the arrow keys move the view around the pitch while held. They do nothing while you're typing in a box, such as the chat.

## v3.17 (21 Oct 2026)
- **Changed:** on a phone held upright, the main action buttons are two to a row, as in landscape, instead of one per row, so the bigger buttons take up about half the space.

## v3.16 (21 Oct 2026)
- **Changed:** the action buttons (Move, Block, Blitz, Pass and the rest) are bigger and further apart, so they're harder to mis-tap: about half as tall again, with larger text.

## v3.15 (21 Oct 2026)
- **Fixed:** league and tournament matches followed the Pitch setting from Exhibition and Settings, so once it had been set to a particular pitch (the Jungle Temple, say), every league match was played there. They're now always at the home team's ground, whatever the setting. Exhibition matches still use the setting.

## v3.14 (17 Oct 2026)
- **Fixed:** before kick-off, the panel showing the computer's inducements couldn't be closed: its OK button counted as the computer's to press, and the computer never pressed it, so the match was stuck. You can now close it. In two-device play, each team's panel is closed by the other player, who's the one reading it.

## v3.13 (16 Oct 2026)
- **Improved:** dropped connections in two-device play ([#18](https://github.com/sirspoon/BludBowl/issues/18)).
  - **Host:** when the other player drops, the banner says the game is waiting for them to reconnect. If it's been their move for 20 seconds, a panel gives the code to rejoin with and offers Keep waiting or Computer takes over. It asks again every couple of minutes, and goes away when they're back. It no longer uses the game's question panel, so a question the other player still has to answer isn't lost.
  - **Joining player:** after 10 minutes of trying to reach the host, the game stops and offers Try again or Leave the match, instead of trying forever.
  - **Host's page closed during the inducements:** Two Devices now offers to reopen the same room. The other player's device rejoins it, and both go back to the lobby to start again.

## v3.12 (16 Oct 2026)
- **Added:** the two-device lobby has the same match settings as an exhibition. The host picks the **game** (11 a side or Sevens), the **pitch** and the **inducements**, and the other player sees what's been chosen. For Sevens, both players pick from their saved Sevens teams (or a standard Sevens squad). ([#18](https://github.com/sirspoon/BludBowl/issues/18))

## v3.11 (16 Oct 2026)
- **Fixed:** in two-device play the ball could vanish after an interception or a pass. A thrown ball only landed when the screen was redrawn, which stops while the host's phone is asleep or switched to another app. Thrown balls and players now always land on time. ([#18](https://github.com/sirspoon/BludBowl/issues/18))
- **Changed:** the "Interception possible!" message now says which team chooses. Only the defending player's taps count, on either device.

## v3.1 (16 Oct 2026)
Everything since v3.00 (the updates numbered v3.01 to v3.38), rolled into one update.

**New pitches**
- **Brimstone** (Khorne and Chaos), **Woodland** (Wood Elves and Gnomes) and **Warped Flagstones** (Skaven, with a pulsing warpstone glow), each with its own scenery behind the block clashes.
- More teams get a home pitch that suits them. Any pitch can be picked from the Pitch menu.

**Music** ([#7](https://github.com/sirspoon/BludBowl/issues/7))
- **Every pitch has its own music:** organ in the Graveyard, echoing drums in the caves, the supporters' band on Muddy Grass, epic rock on Brimstone, a folk jig in the Woodland, and squealing rats on the Warped Flagstones.
- **Referee taunt:** a sending-off gets the terraces' two-note taunt, in each pitch's own style.
- **Fixes:** the music was too quiet at the start of a match, could fail to start on phones, and cut out on Brimstone.

**Fouls** ([#11](https://github.com/sirspoon/BludBowl/issues/11))
- **Sent off:** a big pixel-art referee jumps out as the whistle blows, red card held high. He's a halfling, goblin, dwarf, elf or troll, picked at random.

**The computer coach** ([#19](https://github.com/sirspoon/BludBowl/issues/19))
- **Plays much better:** smarter re-rolls, attacks and defence, use of its players' skills, and fewer careless moves. It also thinks about twice as fast.
- **Level-ups:** its league teams pick skills that suit each position.

**Fixes and smaller changes**
- **Block banner:** declaring a Block shows a banner, like Blitz and Pass do.
- **Freezes:** several ways a match could freeze are fixed, with a safety net for any others.
- **Move odds:** they count Diving Tackle and Sure Feet.
- **Version number:** it no longer covers the menu on phones.

## v3.00 (15 Oct 2026)
Everything since version numbering began (v2.00), rolled into one update.

**Teams and Star Players**
- **All 30 teams from the 2025 rules,** each with a default team, a Sevens squad, kits and sprites. Every team works in exhibitions, the Team Builder, leagues, two-device play and Sevens.
- **Star Players:** every 2025 Star Player is in ([#16](https://github.com/sirspoon/BludBowl/issues/16)).
- **Rules:** new skills and rules for the new teams, Chaos gods, Big Guy limits, and a new league, the Chaos Clash.
- **Team Builder:** players can be reordered ([#2](https://github.com/sirspoon/BludBowl/issues/2)) and team lists are alphabetical.

**Two-device play** ([#18](https://github.com/sirspoon/BludBowl/issues/18))
- **Play a friend** on another phone, tablet or computer with a room code, with chat and reconnecting.
- **Leagues:** career teams and shared leagues work across devices.

**On the pitch**
- **Blocks and replays:** blocks play out on the pitch, and passes, throws and bombs get slow-motion 16-bit replays.
- **Camera and weather:** the camera follows the action and the weather shows on the pitch.
- **High Elven pitch:** new.
- **Kick-offs:** you can save formations, and the computer's turns can be sped up.

**Rules and fixes**
- **Team re-rolls:** they work on more rolls ([#20](https://github.com/sirspoon/BludBowl/issues/20), [#29](https://github.com/sirspoon/BludBowl/issues/29)).
- **Activation rolls:** these, like Bone Head, wait until the player acts ([#6](https://github.com/sirspoon/BludBowl/issues/6)).
- **Post-game:** spending and advancements follow the rules, and Journeymen get names ([#10](https://github.com/sirspoon/BludBowl/issues/10)).
- **Fixes:** a last-turn touchdown no longer starts a new drive ([#28](https://github.com/sirspoon/BludBowl/issues/28)), and MVPs follow the rules ([#8](https://github.com/sirspoon/BludBowl/issues/8)).

**Look and sound**
- **Inducements:** each team's get their own panel.
- **Interface:** tidier panels, a tidier top bar and a resizable match log.
- **Music:** the Jungle Temple and High Elf pitches have their own.
- **Team calls:** picking a team can play its own call.
- **This list:** tap the version number to see it.
