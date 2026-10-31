"""BludBowl's AI (tools/botbowl/bludbowl_bot.py) against BotBowl Season 3's scripted bot, inside BotBowl.

Run from the botbowl-season3 folder (it needs its examples/ for the scripted bot), with BotBowl installed:
    python /path/to/BludBowl/tools/botbowl/play.py --n 20
Sides swap every game. Prints wins, touchdowns, and how often BludBowl's answers had to be adjusted to BotBowl's rules.
"""
import argparse, math, os, sys, time, types
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.getcwd())
try:
    import tkinter  # noqa: F401  (BotBowl imports it for its viewer, which isn't used here)
except ImportError:
    sys.modules['tkinter'] = types.ModuleType('tkinter')
import botbowl
from examples.scripted_bot_example import MyScriptedBot
import bludbowl_bot


def luck(a, b):
    """Two-sided chance of a split at least this uneven if both sides were equally good (a binomial test, draws left out)."""
    n = a + b
    if n == 0:
        return 1.0
    k = max(a, b)
    tail = sum(math.comb(n, i) for i in range(k, n + 1)) / 2 ** n
    return min(1.0, 2 * tail)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--n', type=int, default=10)
    ap.add_argument('--seed', type=int, default=0)
    ap.add_argument('--team', default='human', help="a Season 3 team (orc, dwarf, wood-elf...): both sides play it (BotBowl's coverage squads; needs the team-expansion version)")
    args = ap.parse_args()
    config = botbowl.load_config('season3-preview')
    rules = botbowl.load_rule_set(config.ruleset)
    res = {'won': 0, 'drew': 0, 'lost': 0, 'td_for': 0, 'td_against': 0}
    for i in range(args.n):
        if args.team == 'human':
            home = botbowl.load_team_by_filename('human', rules)
            away = botbowl.load_team_by_filename('human', rules)
        else:
            from examples.season3_teams import coverage_squads, build_team
            squad = next(coverage_squads(args.team))
            home, away = build_team(squad, rules), build_team(squad, rules)
        bb_home = i % 2 == 0
        ours, theirs = bludbowl_bot.BludBowlBot('BludBowl'), MyScriptedBot('Scripted')
        game = botbowl.Game(f'g{i}', home, away, ours if bb_home else theirs, theirs if bb_home else ours, config, ruleset=rules, seed=args.seed + i)
        game.config.fast_mode = True
        t0 = time.time()
        game.init()
        hs, as_ = game.state.home_team.state.score, game.state.away_team.state.score
        f, a = (hs, as_) if bb_home else (as_, hs)
        res['td_for'] += f; res['td_against'] += a
        res['won' if f > a else 'lost' if f < a else 'drew'] += 1
        print(f'{i + 1}/{args.n}: BludBowl {"home" if bb_home else "away"} {f}-{a} scripted ({time.time() - t0:.0f}s)', flush=True)
    print(f"\nBludBowl won {res['won']}, drew {res['drew']}, lost {res['lost']}; touchdowns {res['td_for']}-{res['td_against']}")
    print(f"chance a split this uneven is luck: results {luck(res['won'], res['lost']):.0%}, touchdowns {luck(res['td_for'], res['td_against']):.0%}")
    if bludbowl_bot.BludBowlBot.fallbacks:
        print('adjusted to BotBowl:', dict(bludbowl_bot.BludBowlBot.fallbacks.most_common()))
    if bludbowl_bot._bridge:
        bludbowl_bot._bridge.close()


if __name__ == '__main__':
    main()
