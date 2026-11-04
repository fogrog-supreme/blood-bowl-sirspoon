"""BludBowl's AI as a BotBowl Season 3 bot (github.com/dhillier/botbowl-season3).

Every decision is asked of BludBowl's own JavaScript AI, running with no browser in tools/bridge-server.js (Node + jsdom):
this bot describes the BotBowl game as BludBowl sees a position, asks, and turns the answer into BotBowl actions.
Where BludBowl's answer isn't a legal BotBowl action (a rules difference), it falls back to the nearest legal one and
counts it in `fallbacks`. Plan and notes: ai-training/botbowl-bridge.md.

Use: put this folder on PYTHONPATH (or copy the file into BotBowl), `import bludbowl_bot`, then
`botbowl.make_bot('bludbowl')`. Needs node, and jsdom (npm i jsdom) where Node can find it (NODE_PATH, or in the BludBowl folder).
"""
import collections
import json
import os
import subprocess

import botbowl
from botbowl import Action, ActionType, BBDieResult, Square, ProcBot

HERE = os.path.dirname(os.path.abspath(__file__))
SERVER = os.path.join(HERE, '..', 'bridge-server.js')
WEATHER = {'NICE': 'perfect', 'VERY_SUNNY': 'sunny', 'POURING_RAIN': 'rain', 'BLIZZARD': 'blizzard', 'SWELTERING_HEAT': 'heat'}
FACE = {BBDieResult.ATTACKER_DOWN: 1, BBDieResult.BOTH_DOWN: 2, BBDieResult.PUSH: 3, BBDieResult.DEFENDER_STUMBLES: 5, BBDieResult.DEFENDER_DOWN: 6}
SELECT = {1: ActionType.SELECT_ATTACKER_DOWN, 2: ActionType.SELECT_BOTH_DOWN, 3: ActionType.SELECT_PUSH, 4: ActionType.SELECT_PUSH,
          5: ActionType.SELECT_DEFENDER_STUMBLES, 6: ActionType.SELECT_DEFENDER_DOWN}
ROLL_TYPE = {'Dodge': 'DODGE', 'GFI': 'RUSH', 'Pickup': 'PICKUP', 'Catch': 'CATCH', 'PassAttempt': 'PASS', 'Jump': 'JUMP', 'SecureBall': 'PICKUP'}
START = {'move': ActionType.START_MOVE, 'block': ActionType.START_BLOCK, 'blitz': ActionType.START_BLITZ, 'handoff': ActionType.START_HANDOFF,
         'pass': ActionType.START_PASS, 'foul': ActionType.START_FOUL, 'secure': ActionType.START_SECURE_BALL, 'pickup': ActionType.START_MOVE,
         'stab': ActionType.START_STAB, 'vomit': ActionType.START_PROJECTILE_VOMIT, 'chainsaw': ActionType.START_CHAINSAW,
         'gaze': ActionType.START_HYPNOTIC_GAZE, 'bomb': ActionType.START_THROW_BOMB, 'ttm': ActionType.START_THROW_TEAM_MATE}
SKILL_NAME = {'THROW_TEAM_MATE': 'Throw Team Mate', 'MIGHTY_BLOW': 'Mighty Blow'}


def skill_name(s):
    return SKILL_NAME.get(s.name, s.name.replace('_', ' ').title())


class Bridge:
    """The Node process running BludBowl's AI: one JSON line out, one back."""

    def __init__(self):
        env = dict(os.environ)
        here_modules = os.path.join(HERE, '..', '..', 'node_modules')
        env['NODE_PATH'] = os.pathsep.join(p for p in [env.get('NODE_PATH', ''), here_modules] if p)
        self.proc = subprocess.Popen(['node', SERVER], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, env=env, bufsize=1)
        first = json.loads(self.proc.stdout.readline())
        assert first.get('ready'), first

    def ask(self, op, desc=None, arg=None):
        self.proc.stdin.write(json.dumps({'op': op, 'desc': desc, 'arg': arg}) + '\n')
        self.proc.stdin.flush()
        r = json.loads(self.proc.stdout.readline())
        if not r.get('ok'):
            raise RuntimeError('BludBowl AI: ' + r.get('error', '?'))
        return r.get('result')

    def close(self):
        try:
            self.proc.stdin.close()
            self.proc.wait(10)
        except Exception:
            self.proc.kill()


_bridge = None


def bridge():
    global _bridge
    if _bridge is None or _bridge.proc.poll() is not None:
        _bridge = Bridge()
    return _bridge


class BludBowlBot(ProcBot):
    fallbacks = collections.Counter()   # (shared by all instances: why BludBowl's answer couldn't be played as it was)

    def __init__(self, name):
        super().__init__(name)
        self.my_team = None
        self.queue = []          # the rest of the current activation's actions
        self.tried = set()       # players already asked to act this turn
        self.turn_key = None

    # ---- describing the BotBowl game as a BludBowl position ----
    def side(self, game, team):
        """BludBowl's team 0 scores at the right-hand end: whichever BotBowl team does that."""
        return 0 if game.get_opp_endzone_x(team) > game.arena.width // 2 else 1

    def describe(self, game):
        me = self.my_team
        players = []
        for team in (game.state.home_team, game.state.away_team):
            s = self.side(game, team)
            ko, cas, out = ({q.player_id for q in f(team)} for f in (game.get_knocked_out, game.get_casualties, game.get_dungeon))
            for p in team.players:
                on = p.position is not None and 1 <= p.position.x <= game.arena.width - 2 and 1 <= p.position.y <= game.arena.height - 2
                if on:
                    st = 'stunned' if p.state.stunned else ('up' if p.state.up else 'prone')
                    x, y = p.position.x - 1, p.position.y - 1
                else:
                    st = 'ko' if p.player_id in ko else 'cas' if p.player_id in cas else 'out' if p.player_id in out else 'reserve'
                    if st == 'reserve' and (getattr(p.state, 'heated', False) or getattr(p.state, 'snack_absent', False)):
                        st = 'out'   # (Sweltering Heat or a bad snack: sits out this drive)
                    x = y = None
                ma = p.get_ma()
                players.append({'id': p.player_id, 'team': s, 'type': p.role.name, 'race': team.race, 'ma': ma, 'st': p.get_st(), 'ag': p.get_ag_target(),
                                'pa': p.get_pa(), 'av': p.get_armor_target() if hasattr(p, 'get_armor_target') else p.get_av(),
                                'skills': [skill_name(k) for k in p.get_skills()], 'x': x, 'y': y, 'state': st, 'used': bool(p.state.used),
                                'maLeft': max(0, ma - p.state.moves),
                                'rooted': bool(getattr(p.state, 'taken_root', False)),
                                'distracted': bool(getattr(p.state, 'bone_headed', False) or getattr(p.state, 'really_stupid', False)
                                                   or getattr(p.state, 'hypnotized', False) or getattr(p.state, 'distracted', False))})
        cur = game.state.current_team
        carrier = game.get_ball_carrier()
        bpos = game.get_ball_position()
        ball = {'carrier': carrier.player_id if carrier else None, 'x': bpos.x - 1 if bpos else None, 'y': bpos.y - 1 if bpos else None}
        teams = (game.state.home_team, game.state.away_team)
        sides = {t.team_id: self.side(game, t) for t in teams}   # (BotBowl's teams can't be dictionary keys themselves)
        turn = [0, 0]; rr = [0, 0]
        for t in teams:
            turn[sides[t.team_id]] = t.state.turn
            rr[sides[t.team_id]] = t.state.rerolls
        mine = cur is not None and cur.team_id == me.team_id
        used = {'blitz': mine and not game.is_blitz_available(), 'pass': mine and not game.is_pass_available(),
                'handoff': mine and not game.is_handoff_available(), 'foul': mine and not game.is_foul_available()}
        kick = None
        try:
            kick = {'kicking': sides[game.get_kicking_team().team_id], 'receiving': sides[game.get_receiving_team().team_id]}
        except Exception:
            pass
        races = [None, None]
        for t in teams:
            races[sides[t.team_id]] = t.race
        return {'races': races, 'me': sides[me.team_id], 'active': sides[cur.team_id] if cur is not None else sides[me.team_id], 'half': game.state.half, 'turn': turn, 'rr': rr, 'rrUsed': False,
                'used': used, 'weather': WEATHER.get(game.get_weather().name, 'perfect'), 'ball': ball, 'players': players, 'kick': kick,
                'tried': sorted(self.tried)}

    @staticmethod
    def sq(c):
        return Square(c['x'] + 1, c['y'] + 1)

    def allowed(self, game, a):
        return a is not None and game._is_action_allowed(a)

    def first_allowed(self, game, types):
        for ac in game.get_available_actions():
            if ac.action_type in types:
                if ac.positions:
                    return Action(ac.action_type, position=ac.positions[0])
                if ac.players:
                    return Action(ac.action_type, player=ac.players[0])
                return Action(ac.action_type)
        return None

    # ---- BotBowl's questions ----
    def new_game(self, game, team):
        self.my_team = team
        bridge()

    def coin_toss_flip(self, game):
        return Action(ActionType.HEADS)

    def coin_toss_kick_receive(self, game):
        return Action(ActionType.RECEIVE)

    def setup(self, game):
        self.my_team = game.get_team_by_id(self.my_team.team_id)
        # (a turn that ended early - a touchdown, a turnover - can leave its moves queued: they're no use now)
        self.queue = [a for a in self.queue if a.action_type in (ActionType.PLACE_PLAYER, ActionType.END_SETUP)]
        while self.queue:   # (a placement BotBowl won't take is skipped)
            a = self.queue.pop(0)
            if self.allowed(game, a):
                return a
            self.fallbacks['set-up placement' + (' (to reserves)' if a.position is None else ' at %s,%s' % (a.position.x - 1, a.position.y - 1))] += 1
            if os.environ.get('BB_TRACE'):
                ac = next((c for c in game.get_available_actions() if c.action_type == a.action_type), None)
                print('  refused', a.action_type.name, a.player.role.name if a.player else None, a.player.position if a.player else None, '->', a.position,
                      '| allowed squares:', len(ac.positions) if ac else None, 'in list:', (a.position in ac.positions) if ac else None, 'player ok:', (a.player in ac.players) if ac and ac.players else 'n/a',
                      '| kicking:', game.get_kicking_team().team_id == self.my_team.team_id, 'side', self.side(game, self.my_team), 'types', [c.action_type.name for c in game.get_available_actions()], flush=True)
        if getattr(self, 'setup_asked', None) == (game.state.half, self.my_team.state.turn, game.state.home_team.state.score + game.state.away_team.state.score):
            return Action(ActionType.END_SETUP)   # (already placed once for this kick-off: done)
        self.setup_asked = (game.state.half, self.my_team.state.turn, game.state.home_team.state.score + game.state.away_team.state.score)
        spots = bridge().ask('setup', self.describe(game), self.side(game, self.my_team))
        acts = [Action(ActionType.PLACE_PLAYER, player=p, position=None) for p in self.my_team.players if p.position is not None]
        for s in spots or []:
            p = game.get_player(s['id'])
            if p is not None:
                acts.append(Action(ActionType.PLACE_PLAYER, player=p, position=self.sq(s)))
        acts.append(Action(ActionType.END_SETUP))
        self.queue = acts
        return self.queue.pop(0)

    def perfect_defense(self, game):
        return Action(ActionType.END_SETUP)

    def place_ball(self, game):
        t = bridge().ask('kick', self.describe(game))
        a = Action(ActionType.PLACE_BALL, position=self.sq(t)) if t else None
        if self.allowed(game, a):
            return a
        self.fallbacks['kick target'] += 1
        return self.first_allowed(game, [ActionType.PLACE_BALL])

    def high_kick(self, game):
        return Action(ActionType.SELECT_NONE)

    def touchback(self, game):
        pid = bridge().ask('touchback', self.describe(game))
        p = game.get_player(pid) if pid else None
        a = Action(ActionType.SELECT_PLAYER, player=p) if p else None
        if self.allowed(game, a):
            return a
        self.fallbacks['touchback'] += 1
        return self.first_allowed(game, [ActionType.SELECT_PLAYER])

    def quick_snap(self, game):
        return Action(ActionType.END_TURN)

    def blitz(self, game):
        return Action(ActionType.END_TURN)

    def turn(self, game):
        self.my_team = game.get_team_by_id(self.my_team.team_id)
        key = (game.state.half, self.my_team.state.turn)
        if key != self.turn_key or (self.queue and self.queue[0].action_type in (ActionType.PLACE_PLAYER, ActionType.END_SETUP)):
            self.turn_key, self.tried, self.queue, self.asks = key, set(), [], 0
        self.asks = getattr(self, 'asks', 0) + 1
        if self.asks > 80:   # (something isn't moving the turn on: end it rather than go round for ever)
            self.fallbacks['turn ended: too many decisions'] += 1
            self.queue = []
            return Action(ActionType.END_TURN)
        while self.queue:
            a = self.queue.pop(0)
            if self.allowed(game, a):
                return a
        for _ in range(12):   # (a plan BotBowl won't take: that player is set aside and the AI asked again)
            plan = bridge().ask('turn', self.describe(game))
            if not plan or plan.get('kind') == 'end':
                return Action(ActionType.END_TURN)
            acts = self.plan_actions(game, plan)
            if plan.get('player'):
                self.tried.add(plan['player'])
            if acts and self.allowed(game, acts[0]):
                self.queue = acts[1:]
                return acts[0]
            self.fallbacks['plan not allowed: ' + plan.get('kind', '?')] += 1
            if os.environ.get('BB_TRACE') and acts:
                ac = next((c for c in game.get_available_actions() if c.action_type == acts[0].action_type), None)
                pl = game.get_player(plan.get('player'))
                print('  plan refused', plan.get('kind'), pl.role.name if pl else None, 'up' if pl and pl.state.up else 'down', 'used' if pl and pl.state.used else '',
                      '| offered for it:', [q.role.name for q in ac.players] if ac else 'not offered at all', '| blitz available:', game.is_blitz_available(),
                      '| types:', sorted({c.action_type.name for c in game.get_available_actions()}), flush=True)
        return Action(ActionType.END_TURN)

    def plan_actions(self, game, plan):
        p = game.get_player(plan.get('player'))
        kind = plan.get('kind')
        if p is None:
            return []
        if kind not in START:
            self.fallbacks['unsupported action: ' + kind] += 1
            kind = 'move'
        acts = [Action(START[kind], player=p)]
        t = game.get_player(plan['target']) if plan.get('target') else None
        r = game.get_player(plan['receiver']) if plan.get('receiver') else None
        if kind == 'blitz' and t is None:
            # some of BludBowl's Blitz plans pick their target at the end of the move; Season 3 declares it first: the standing
            # opponent nearest where the move ends
            route = plan.get('route') or []
            end = self.sq(route[-1]) if route else p.position
            opps = [q for q in game.get_players_on_pitch(game.get_opp_team(self.my_team)) if q.state.up]
            if opps:
                t = min(opps, key=lambda q: (q.position.distance(end), q.position.distance(p.position)))
        if kind == 'blitz' and t is not None:
            acts.append(Action(ActionType.SELECT_PLAYER, player=t))
        if not p.state.up:
            acts.append(Action(ActionType.STAND_UP, player=p))
        prev = p.position
        for c in plan.get('route') or []:
            s = self.sq(c)
            acts.append(Action(ActionType.JUMP if game.is_season3 and prev.distance(s) == 2 else ActionType.MOVE, position=s))
            prev = s
        # the last step, at the target's square
        last = {'block': (ActionType.BLOCK, t), 'blitz': (ActionType.BLOCK, t), 'foul': (ActionType.FOUL, t),
                'handoff': (ActionType.HANDOFF, r), 'pass': (ActionType.PASS, r), 'stab': (ActionType.STAB, t),
                'vomit': (ActionType.PROJECTILE_VOMIT, t), 'chainsaw': (ActionType.CHAINSAW, t), 'gaze': (ActionType.HYPNOTIC_GAZE, t)}.get(kind)
        if last and last[1] is not None and last[1].position is not None:
            acts.append(Action(last[0], position=last[1].position))
        if kind == 'ttm':   # pick up the team-mate, then throw them at the square
            g = game.get_player(plan['thrown']) if plan.get('thrown') else None
            if g is not None and g.position is not None:
                acts.append(Action(ActionType.PICKUP_TEAM_MATE, position=g.position))
            if plan.get('tx') is not None:
                acts.append(Action(ActionType.THROW_TEAM_MATE, position=Square(plan['tx'] + 1, plan['ty'] + 1)))
        if kind == 'bomb' and plan.get('tx') is not None:
            acts.append(Action(ActionType.THROW_BOMB, position=Square(plan['tx'] + 1, plan['ty'] + 1)))
        return acts

    def player_action(self, game):
        while self.queue:
            a = self.queue.pop(0)
            if self.allowed(game, a):
                return a
            self.fallbacks['step not allowed: ' + a.action_type.name] += 1
        return Action(ActionType.END_PLAYER_TURN)

    def blitz_target(self, game):
        if self.queue and self.queue[0].action_type == ActionType.SELECT_PLAYER:
            a = self.queue.pop(0)
            if self.allowed(game, a):
                return a
        self.fallbacks['blitz target'] += 1
        if os.environ.get('BB_TRACE'):
            want = self.queue[0] if self.queue else None
            offered = [(q.role.name, q.position) for c in game.get_available_actions() for q in c.players]
            print('  blitz target refused: wanted', want.action_type.name if want else None, want.player.role.name if want and want.player else None,
                  want.player.position if want and want.player else None, '| offered:', offered, flush=True)
        self.queue = []
        return super().blitz_target(game)

    def block(self, game):
        proc = game.get_procedure()
        ctx = proc.context if isinstance(proc, botbowl.Reroll) else proc
        dice = [FACE[d.get_value()] for d in ctx.roll.dice]
        mine = ctx.favor == ctx.attacker.team
        can_rr = any(a.action_type == ActionType.USE_REROLL for a in game.get_available_actions())
        r = bridge().ask('dice', self.describe(game), {'atk': ctx.attacker.player_id, 'def': ctx.defender.player_id, 'dice': dice,
                                                     'chooser': 'atk' if mine else 'def', 'canReroll': can_rr})
        if r.get('reroll') and can_rr:
            return Action(ActionType.USE_REROLL)
        # Season 3 offers the re-roll and the dice together. Picking a die straight from that question skips a step BotBowl needs
        # (with Wrestle it then fails, waiting for that decision): decline the re-roll first, and pick the die when asked next
        if isinstance(proc, botbowl.Reroll) and any(x.action_type == ActionType.DONT_USE_REROLL for x in game.get_available_actions()):
            return Action(ActionType.DONT_USE_REROLL)
        a = Action(SELECT[dice[r.get('index', 0)]])
        if self.allowed(game, a):
            return a
        if any(x.action_type == ActionType.DONT_USE_REROLL for x in game.get_available_actions()):
            return Action(ActionType.DONT_USE_REROLL)
        self.fallbacks['block die'] += 1
        return self.first_allowed(game, list(SELECT.values()))

    def reroll(self, game):
        proc = game.get_procedure()
        ctx = proc.context
        if isinstance(ctx, botbowl.Block):
            return self.block(game)
        kind = ROLL_TYPE.get(type(ctx).__name__)
        player = getattr(ctx, 'player', None) or getattr(proc, 'player', None)
        roll = getattr(ctx, 'roll', None)
        target = getattr(roll, 'target', 4) if roll is not None else 4
        if kind and player is not None and bridge().ask('reroll', self.describe(game), {'type': kind, 'player': player.player_id, 'target': target}):
            return Action(ActionType.USE_REROLL)
        return Action(ActionType.DONT_USE_REROLL)

    def push(self, game):
        proc = game.get_procedure()
        squares = game.get_available_actions()[0].positions
        i = bridge().ask('push', self.describe(game), {'atk': proc.pusher.player_id, 'def': proc.player.player_id, 'pushed': proc.player.player_id,
                                                       'squares': [{'x': s.x - 1, 'y': s.y - 1} for s in squares]})
        return Action(ActionType.PUSH, position=squares[i if i is not None and i < len(squares) else 0])

    def follow_up(self, game):
        proc = game.get_procedure()
        squares = game.get_available_actions()[0].positions
        here = proc.attacker.position
        vacated = next((s for s in squares if s != here), None)
        if vacated is None:
            return Action(ActionType.FOLLOW_UP, position=here)
        go = bridge().ask('follow', self.describe(game), {'atk': proc.attacker.player_id, 'def': proc.defender.player_id, 'vacated': {'x': vacated.x - 1, 'y': vacated.y - 1}})
        return Action(ActionType.FOLLOW_UP, position=vacated if go else here)

    def apothecary(self, game):
        proc = game.get_procedure()
        ko = 'KNOCKED' in getattr(getattr(proc, 'outcome', None), 'name', '')
        bh = 'BADLY_HURT' in getattr(getattr(proc, 'casualty_first', None), 'name', '')
        use = bridge().ask('apothecary', self.describe(game), {'player': proc.player.player_id, 'kind': 'ko' if ko else 'cas', 'roll': 5 if bh else 12})
        return Action(ActionType.USE_APOTHECARY if use else ActionType.DONT_USE_APOTHECARY)

    def interception(self, game):
        offered = [p for ac in game.get_available_actions() if ac.action_type == ActionType.SELECT_PLAYER for p in ac.players]
        if not offered:
            return Action(ActionType.SELECT_NONE)
        pid = bridge().ask('intercept', self.describe(game), {'players': [p.player_id for p in offered]})
        p = next((q for q in offered if q.player_id == pid), None)
        return Action(ActionType.SELECT_PLAYER, player=p) if p is not None else Action(ActionType.SELECT_NONE)

    def use_pro(self, game):
        return Action(ActionType.USE_SKILL)

    def use_juggernaut(self, game):
        return Action(ActionType.USE_SKILL)

    def use_wrestle(self, game):
        return Action(ActionType.USE_SKILL)

    def use_stand_firm(self, game):
        return Action(ActionType.USE_SKILL)

    def use_bribe(self, game):
        return Action(ActionType.USE_BRIBE)

    def blood_lust_block_or_move(self, game):
        return Action(ActionType.START_BLOCK)

    def eat_thrall(self, game):
        return Action(ActionType.SELECT_PLAYER, position=game.get_available_actions()[0].positions[0])

    def handle_illegal_action(self, game, action):
        """Anything still not allowed: count it and play the first legal action instead (ending the activation if offered)."""
        self.fallbacks['illegal: ' + action.action_type.name] += 1
        self.queue = []
        for t in (ActionType.END_PLAYER_TURN, ActionType.END_TURN, ActionType.END_SETUP, ActionType.DONT_USE_REROLL, ActionType.SELECT_NONE):
            if any(a.action_type == t for a in game.get_available_actions()):
                return Action(t)
        return self.first_allowed(game, [a.action_type for a in game.get_available_actions()])

    def act(self, game):
        a = super().act(game)
        if os.environ.get('BB_TRACE_BLOCK'):
            proc = game.get_procedure()
            if type(proc).__name__ in ('Block', 'Reroll'):
                print('  act', type(proc).__name__, 'wrestle a/d', getattr(proc, 'waiting_wrestle_attacker', None), getattr(proc, 'waiting_wrestle_defender', None),
                      '->', a.action_type.name if a else None, '| offered', [c.action_type.name for c in game.get_available_actions()], flush=True)
        return a

    def end_game(self, game):
        pass


botbowl.register_bot('bludbowl', BludBowlBot)
