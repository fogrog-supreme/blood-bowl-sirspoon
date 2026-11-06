// What-if tests for the AI: one decision judged in its own position. Plain match tests (ai-match-jsdom.js) compare two AIs
// over whole matches, and averages over recorded games compare kinds of decision across different positions; this compares
// two choices in the same positions.
//
// 1. Collect: play AI-v-AI matches (both sides --base) and, at every activation, ask what the AI would choose with --a and
//    with --b. Where they differ, save the whole match at that moment (the game's own match save).
//      node tools/ai-whatif.js collect --races orc,human --n 4 --base all --a all --b end --per 6 --out pos.jsonl
// 2. Play out: load each saved position, play option A (or B) for that one decision, then both sides --base to full time,
//    --k times each.
//      node tools/ai-whatif.js play --in pos.jsonl --k 4 --par 14 --out roll.jsonl [--to game]
//    By default (--to next) a play-out stops at the start of the deciding side's next turn and saves the position as the
//    network sees it, for the outcome predictor to judge (nn/whatif_value.py on the PC): one turn of dice instead of a whole
//    match, so far less luck in the comparison, and quick. --to game plays to full time and prints, from the deciding side's
//    view and averaged over positions, B's result minus A's (win 1, draw 0.5), the touchdown difference at full time and at
//    the end of the half the decision was in, each with its margin (95%).
//      node tools/ai-whatif.js report --in roll.jsonl      (the same summary again, from a finished play-out)
//
// --a / --b / --base: AIX switches as in ai-match.js ('all', 'none' or a list), or 'end' (end the turn there) for --a / --b;
// --ap / --bp: tuning values (window.AIP) for that option. Each match collected, and each position's play-outs, run in a
// fresh Node process.
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const flags = f => f === 'all' ? null : f === 'none' ? [] : f === 'end' ? 'end' : f.split(',');
const LIMIT = +arg('limit', 300) * 1000;

// ---- in a child process ----
async function collectOne(job) {
  const { openGame } = require('./headless-match.js');
  const { window: w } = await openGame({ simtest: true });
  const t0 = Date.now();
  w.__job = JSON.stringify(job);
  w.eval(`(() => { const J = JSON.parse(window.__job);
    try { localStorage.setItem('bb-replays', '0'); localStorage.setItem('bb-ex-ind', 'off'); } catch (e) {}
    AIX.flags[0] = J.base; AIX.flags[1] = J.base; AI.set(0, true); AI.set(1, true);
    window.WI = [];
    window.AI_WHATIF = ({ plan, me, again, desc }) => {
      if (state.charge || state.half > 2 || state.isGameOver || WI.length >= J.per || Math.random() > J.rate) return;
      const pa = J.A === 'end' ? null : again(J.A, J.ap), pb = J.B === 'end' ? null : again(J.B, J.bp);
      const da = desc(pa), db = desc(pb);
      if (da === db) return;
      const d = SAVE.snapshot(); d.log = '';
      WI.push({ me, half: state.half, turn: state.turn[me], score: [state.score[me], state.score[1 - me]], da, db, snap: d });
    };
    window.launchMatch(J.a, J.b, { replaceOk: true }); })()`);
  let over = false;
  while (Date.now() - t0 < LIMIT) {
    await new Promise(r => setTimeout(r, 400));
    over = w.eval(`(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && !b.closest('.hidden')) b.click(); return !!state.isGameOver; })()`);
    if (over) break;
  }
  const out = JSON.parse(w.eval('JSON.stringify(window.WI)'));
  try { w.close(); } catch (e) {}
  return out.map((p, k) => ({ id: `${job.a}-${job.b}-${job.i}-${k}`, a: job.a, b: job.b, ...p, A: job.A, B: job.B, ap: job.ap, bp: job.bp, base: job.base }));
}

// one position's play-outs (job.items: [{ opt, rep, to }]) in one page: the game's own resume needs no reload. The page tells
// us when a play-out is done (window.__done): in test mode its clock jumps from event to event, and once the play-out is
// paused or over it keeps the process too busy for a timer of ours to notice for seconds.
async function playMany(job) {
  const { openGame } = require('./headless-match.js');
  const { window: w, errors } = await openGame({ simtest: true });
  w.__pos = JSON.stringify(job.pos);
  w.eval(`(() => { const P = JSON.parse(window.__pos);
    try { localStorage.setItem('bb-replays', '0'); localStorage.setItem('bb-ex-ind', 'off'); } catch (e) {}
    const finish = () => { const C = window.WI_CUR; if (!C || C.done) return; C.done = true; AI.setPaused(true); C.over = !!state.isGameOver;
      if (!C.at) C.at = [state.score[0], state.score[1]]; window.__done && window.__done(); };
    window.AI_WHATIF = ({ me, again, desc }) => {
      const C = window.WI_CUR; if (!C || C.done) return;
      if (C.desc != null) {
        if (C.half == null && state.half !== P.half) C.half = [state.score[0], state.score[1]];
        if (C.to === 'next' && me === P.me && (state.half !== P.half || state.turn[me] !== P.turn)) { C.obs = AI.bridge.nnNow(me); finish(); }
        return;
      }
      const pl = C.opt === 'end' ? null : again(C.opt, C.op);
      C.desc = desc(pl);
      return pl;
    };
    setInterval(() => {
      const C = window.WI_CUR; if (!C || C.done) return;
      if (state.isGameOver) { if (C.half == null) C.half = [state.score[0], state.score[1]]; finish(); return; }
      const b = document.getElementById('btn-lineup-confirm'); if (b && !b.closest('.hidden')) b.click();
    }, 150); })()`);
  const out = [];
  for (const it of job.items) {
    const t0 = Date.now();
    w.__cur = JSON.stringify(it);
    const done = new Promise(res => { w.__done = res; setTimeout(res, LIMIT); });
    w.eval(`(() => { const P = JSON.parse(window.__pos), I = JSON.parse(window.__cur);
      AIX.flags[0] = P.base; AIX.flags[1] = P.base;
      window.WI_CUR = { opt: I.opt === 'A' ? P.A : P.B, op: I.opt === 'A' ? P.ap : P.bp, to: I.to, desc: null, obs: null, at: null, half: null, done: false, over: false };
      SAVE.resume(P.snap);
      AI.setPaused(false); AI.set(0, true); AI.set(1, true); })()`);
    await done;
    const C = JSON.parse(w.eval('JSON.stringify(window.WI_CUR)'));
    const me = job.pos.me, s = C.at || [0, 0], h = C.half || s;
    out.push({ id: job.pos.id, opt: it.opt, rep: it.rep, over: C.over, done: C.done, obs: C.obs, me, forced: C.desc, meant: it.opt === 'A' ? job.pos.da : job.pos.db,
      td: s[me] - s[1 - me], tdHalf: h[me] - h[1 - me], pts: s[me] > s[1 - me] ? 1 : s[me] === s[1 - me] ? 0.5 : 0,
      secs: +((Date.now() - t0) / 1000).toFixed(1), errs: errors.slice(0, 2) });
  }
  try { w.close(); } catch (e) {}
  return out;
}

if (process.argv.includes('--child')) {
  const job = JSON.parse(fs.readFileSync(arg('child'), 'utf8'));
  (job.kind === 'collect' ? collectOne(job) : playMany(job))
    .then(r => { process.stdout.write(JSON.stringify(r) + '\n'); process.exit(0); })
    .catch(e => { process.stdout.write(JSON.stringify({ error: String(e && e.message || e).slice(0, 300), job: { ...job, pos: undefined } }) + '\n'); process.exit(0); });
} else {
  const mode = process.argv[2], PAR = +arg('par', 4), OUT = arg('out', null);
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'wif-'));
  // run the jobs, each in a fresh Node process, up to PAR at once; onResult(result) for each
  const pool = (jobs, onResult, done) => {
    const queue = jobs.slice(); let running = 0, n = 0;
    const next = () => {
      if (!queue.length) { if (running === 0) done(); return; }
      const job = queue.shift(), f = path.join(tmp, `job${n++}.json`);
      fs.writeFileSync(f, JSON.stringify(job)); running++;
      const p = spawn(process.execPath, [__filename, '--child', f, '--limit', arg('limit', '300')], { stdio: ['ignore', 'pipe', 'inherit'] });
      let buf = '';
      p.stdout.on('data', d => { buf += d; });
      p.on('exit', () => {
        running--; try { fs.unlinkSync(f); } catch (e) {}
        const line = buf.trim().split('\n').pop();
        try { onResult(JSON.parse(line)); } catch (e) { console.error('no result from a job'); }
        next();
      });
    };
    for (let w = 0; w < Math.min(PAR, jobs.length); w++) next();
  };

  if (mode === 'collect') {
    const N = +arg('n', 2), jobs = [];
    const races = arg('races', '') ? arg('races').split(',') : [];
    const job = (a, b, i) => ({ kind: 'collect', a, b, i, base: flags(arg('base', 'all')), A: flags(arg('a', 'all')), B: flags(arg('b', 'end')),
      ap: arg('ap') ? JSON.parse(arg('ap')) : undefined, bp: arg('bp') ? JSON.parse(arg('bp')) : undefined, per: +arg('per', 6), rate: +arg('rate', 1) });
    races.forEach(r => { for (let i = 0; i < N; i++) jobs.push(job(r, r, i)); });
    (arg('pairs', '') ? arg('pairs').split(',') : []).forEach(pr => { const [a, b] = pr.split(':'); for (let i = 0; i < N; i++) jobs.push(job(a, b, i)); });
    if (!jobs.length || !OUT) { console.error('Give --races or --pairs, and --out (see the top of this file).'); process.exit(1); }
    const out = fs.createWriteStream(OUT); let total = 0, done = 0;
    pool(jobs, r => {
      done++;
      if (!Array.isArray(r)) { console.log(`${done}/${jobs.length}: ${r.error || 'failed'}`); return; }
      r.forEach(p => out.write(JSON.stringify(p) + '\n')); total += r.length;
      console.log(`${String(done).padStart(3)}/${jobs.length} ${r.length} positions` + (r[0] ? ` (e.g. A: ${r[0].da} | B: ${r[0].db})` : ''));
    }, () => { out.end(() => { console.log(`\n${total} positions -> ${OUT}`); process.exit(0); }); });
  } else if (mode === 'play') {
    const K = +arg('k', 4), IN = arg('in');
    const pos = fs.readFileSync(IN, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
    const max = +arg('max', pos.length), use = pos.slice(0, max), jobs = [];
    // A and B alternate, so a run stopped early still has both for most positions
    const TO = arg('to', 'next');
    use.forEach(p => { const items = []; for (let r = 0; r < K; r++) ['A', 'B'].forEach(opt => items.push({ opt, rep: r, to: TO })); jobs.push({ kind: 'play', pos: p, items }); });
    const results = [], out = OUT ? fs.createWriteStream(OUT) : null, t0 = Date.now();
    console.log(`${use.length} positions x 2 options x ${K} = ${use.length * 2 * K} play-outs`);
    let done = 0;
    pool(jobs, rs => {
      done++;
      (Array.isArray(rs) ? rs : [rs]).forEach(r => { results.push(r); if (out) out.write(JSON.stringify(r) + '\n'); });
      if (done % 10 === 0) console.log(`${done}/${jobs.length} positions (${((Date.now() - t0) / 60000).toFixed(1)} min)`);
    }, () => { const fin = () => { report(results); process.exit(0); }; out ? out.end(fin) : fin(); });
  } else if (mode === 'report') {
    report(fs.readFileSync(arg('in'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)));
  } else {
    console.error('node tools/ai-whatif.js collect|play|report ... (see the top of this file)'); process.exit(1);
  }

  // per position: the mean of B's play-outs minus the mean of A's; then the mean and its margin over positions
  function report(rs) {
    if (rs.some(r => r.obs)) { console.log('\nPlay-outs stopped at the next turn: score them with the outcome predictor (nn/whatif_value.py --in <this file>).'); return; }
    const ok = rs.filter(r => r.over && r.id != null && r.done !== false);
    const bad = rs.length - ok.length, mism = ok.filter(r => r.forced !== r.meant).length;
    const by = new Map();
    ok.forEach(r => { if (!by.has(r.id)) by.set(r.id, { A: [], B: [] }); by.get(r.id)[r.opt].push(r); });
    const both = [...by.values()].filter(v => v.A.length && v.B.length);
    const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
    const line = (name, k, unit) => {
      const d = both.map(v => mean(v.B.map(r => r[k])) - mean(v.A.map(r => r[k])));
      const m = mean(d), sd = Math.sqrt(d.reduce((x, y) => x + (y - m) ** 2, 0) / Math.max(1, d.length - 1)), e = 1.96 * sd / Math.sqrt(d.length);
      const a = mean(both.map(v => mean(v.A.map(r => r[k])))), b = mean(both.map(v => mean(v.B.map(r => r[k]))));
      console.log(`${name.padEnd(28)} A ${a.toFixed(3)}  B ${b.toFixed(3)}  B-A ${m >= 0 ? '+' : ''}${(m * unit).toFixed(unit === 100 ? 1 : 3)} +- ${(e * unit).toFixed(unit === 100 ? 1 : 3)}${unit === 100 ? ' points' : ''}`);
    };
    console.log(`\n${both.length} positions with both options played out (${ok.length} play-outs; ${bad} unfinished or failed; ${mism} where the forced choice wasn't the one collected)`);
    if (!both.length) return;
    line('result (win 1, draw 0.5)', 'pts', 100);
    line('touchdown difference', 'td', 1);
    line('touchdowns by end of half', 'tdHalf', 1);
  }
}
