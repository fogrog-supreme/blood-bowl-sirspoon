// ai-match.js without a browser: the same computer-v-computer test matches (test mode, ?simtest), the game running in jsdom
// (tools/headless-match.js) in several Node processes at once. For a PC without Playwright / Chromium: needs only jsdom.
//
//   node tools/ai-match-jsdom.js --races orc,human,skaven --n 4 --new all --old blk1 --par 14 [--newp '{"k":1}'] [--out r.jsonl]
//
// Options as ai-match.js (--races / --pairs, --n, --new / --old AIX switches: 'all', 'none' or a list, --newp, --oldp, --par,
// --limit seconds a match, --out). The new AI is home in even-numbered matches and away in odd ones. Every match gets a fresh
// Node process (the game reloads itself between matches, and a process that keeps going slows down): ~30s alone, ~100s with
// 14 at once, so about 500 matches an hour.
// Also counts each side's blocks by dice: 1-die blocks and blocks where the defender picks.
const path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };

if (process.argv.includes('--child')) {
  // a worker: play the matches in JOBS (a JSON file), one JSON line each on stdout
  const { openGame } = require('./headless-match.js');
  const jobs = JSON.parse(fs.readFileSync(arg('child'), 'utf8'));
  const LIMIT = +arg('limit', 300) * 1000;
  (async () => {
    for (const job of jobs) {
      let r;
      try { r = await play(job); } catch (e) { r = { ...job, over: false, errs: [String(e && e.message || e).slice(0, 200)] }; }
      process.stdout.write(JSON.stringify(r) + '\n');
    }
    process.exit(0);
  })();
  async function play(job) {
    const { window: w, errors } = await openGame({ simtest: true });
    const t0 = Date.now();
    w.__job = JSON.stringify(job);
    w.eval(`(() => { const J = JSON.parse(window.__job);
      window.BX = { one: [0, 0], defPicks: [0, 0], two: [0, 0], three: [0, 0] };
      const oRB = window.resolveBlock;
      if (typeof oRB === 'function') window.resolveBlock = function () { const c = state.combat;
        if (c && !c._bbx && c.atk) { c._bbx = 1; const n = (c.dice || []).length, own = c.chooser === c.atk.team, t = c.atk.team;
          if (!own) BX.defPicks[t]++; else if (n === 1) BX.one[t]++; else if (n === 2) BX.two[t]++; else if (n >= 3) BX.three[t]++; }
        return oRB.apply(this, arguments); };
      try { localStorage.setItem('bb-replays', '0'); localStorage.setItem('bb-ex-ind', 'off'); } catch (e) {}
      window.AIP = [J.p0, J.p1]; AIX.flags[0] = J.f0; AIX.flags[1] = J.f1; AI.set(0, true); AI.set(1, true);
      window.launchMatch(J.a, J.b, { replaceOk: true }); })()`);
    let res = null;
    while (Date.now() - t0 < LIMIT) {
      await new Promise(r => setTimeout(r, 400));
      res = JSON.parse(w.eval(`(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && !b.closest('.hidden')) b.click();
        return JSON.stringify({ over: !!state.isGameOver, half: state.half, turn: [state.turn[0], state.turn[1]], score: [state.score[0], state.score[1]],
          cas: [0, 1].map(t => state.players.filter(q => q.team !== t && q.isCasualty).length),
          to: MATCH.data ? MATCH.data.turnovers.slice() : [0, 0], bl: MATCH.data ? MATCH.data.blocks.slice() : [0, 0], rr: MATCH.data ? MATCH.data.rerolls.slice() : [0, 0],
          bx: window.BX }); })()`));
      if (res.over) break;
    }
    try { w.close(); } catch (e) {}
    const n = job.newHome ? 0 : 1;
    return { a: job.a, b: job.b, i: job.i, newSide: job.newHome ? 'home' : 'away', secs: +((Date.now() - t0) / 1000).toFixed(1), over: !!(res && res.over),
      newTD: res.score[n], oldTD: res.score[1 - n], newCas: res.cas[n], oldCas: res.cas[1 - n], newTO: res.to[n], oldTO: res.to[1 - n],
      newBl: res.bl[n], oldBl: res.bl[1 - n], newRR: res.rr[n], oldRR: res.rr[1 - n],
      newOne: res.bx.one[n], oldOne: res.bx.one[1 - n], newDef: res.bx.defPicks[n], oldDef: res.bx.defPicks[1 - n],
      errs: errors.slice(0, 3) };
  }
} else {
  const N = +arg('n', 4), PAR = +arg('par', 4), NEW = arg('new', 'all'), OLD = arg('old', 'all'), OUT = arg('out', null);
  const NEWP = JSON.parse(arg('newp', '{}')), OLDP = JSON.parse(arg('oldp', '{}'));
  const flags = f => f === 'all' ? null : f === 'none' ? [] : f.split(',');
  const jobs = [];
  (arg('races', '') ? arg('races').split(',') : []).forEach(r => { for (let i = 0; i < N; i++) jobs.push({ a: r, b: r, i }); });
  (arg('pairs', '') ? arg('pairs').split(',') : []).forEach(pr => { const [a, b] = pr.split(':'); for (let i = 0; i < N; i++) jobs.push({ a, b, i }); });
  if (!jobs.length) { console.error('Give --races or --pairs (see the top of this file).'); process.exit(1); }
  jobs.forEach((j, k) => { j.newHome = k % 2 === 0; j.f0 = j.newHome ? flags(NEW) : flags(OLD); j.f1 = j.newHome ? flags(OLD) : flags(NEW); j.p0 = j.newHome ? NEWP : OLDP; j.p1 = j.newHome ? OLDP : NEWP; });
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'aim-'));
  const results = [], t0 = Date.now(), out = OUT ? fs.createWriteStream(OUT) : null;
  // every match in a fresh Node process (up to --par at once): a process that plays one match after another keeps the old
  // pages in memory and slows down steadily (28s for its first match, over 300s by its eighteenth)
  const queue = jobs.slice();
  let running = 0, n = 0;
  const next = () => {
    if (!queue.length) { if (running === 0) summary(); return; }
    const job = queue.shift(), f = path.join(tmp, `job${n++}.json`);
    fs.writeFileSync(f, JSON.stringify([job]));
    running++;
    const p = spawn(process.execPath, [__filename, '--child', f, '--limit', arg('limit', '300')], { stdio: ['ignore', 'pipe', 'inherit'] });
    let buf = '';
    p.stdout.on('data', d => {
      buf += d; let k;
      while ((k = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, k); buf = buf.slice(k + 1);
        let r; try { r = JSON.parse(line); } catch (e) { continue; }
        results.push(r); if (out) out.write(line + '\n');
        console.log(`${String(results.length).padStart(3)}/${jobs.length} ${r.a} v ${r.b}: new ${r.newTD ?? '?'} - ${r.oldTD ?? '?'} old (new ${r.newSide}, ${r.secs}s)${r.over ? '' : ' UNFINISHED'}`);
      }
    });
    p.on('exit', () => { running--; try { fs.unlinkSync(f); } catch (e) {} next(); });
  };
  for (let w = 0; w < Math.min(PAR, jobs.length); w++) next();
  function luck(k, n) {
    if (!n) return 1;
    const lo = Math.min(k, n - k); let p = 0, c = 1;
    for (let i = 0; i <= n; i++) { if (i > 0) c = c * (n - i + 1) / i; if (i <= lo) p += c; }
    return Math.min(1, 2 * p / Math.pow(2, n));
  }
  function summary() {
    if (out) out.end();
    const done = results.filter(r => r.over), sum = k => done.reduce((a, r) => a + (r[k] || 0), 0), per = k => (sum(k) / Math.max(1, done.length)).toFixed(1);
    const nt = sum('newTD'), ot = sum('oldTD'), w = done.filter(r => r.newTD > r.oldTD).length, l = done.filter(r => r.newTD < r.oldTD).length;
    console.log(`\n${done.length} matches finished (${results.length - done.length} not), ${results.filter(r => r.errs && r.errs.length).length} with page errors, ${((Date.now() - t0) / 1000).toFixed(0)}s in all`);
    console.log(`touchdowns  new ${nt} - ${ot} old   (chance of a split this uneven by luck: ${(100 * luck(nt, nt + ot)).toFixed(0)}%)`);
    console.log(`results     new won ${w}, drew ${done.length - w - l}, lost ${l}   (luck: ${(100 * luck(w, w + l)).toFixed(0)}%)`);
    console.log(`casualties  new caused ${sum('newCas')} - ${sum('oldCas')} old`);
    console.log(`turnovers   new ${sum('newTO')} - ${sum('oldTO')} old`);
    console.log(`re-rolls    new ${sum('newRR')} - ${sum('oldRR')} old (per team per match: ${per('newRR')} - ${per('oldRR')})`);
    console.log(`blocks      new ${sum('newBl')} - ${sum('oldBl')} old (per team per match: ${per('newBl')} - ${per('oldBl')}); 1-die ${per('newOne')} - ${per('oldOne')}; defender picks ${per('newDef')} - ${per('oldDef')}`);
    process.exit(0);
  }
}
