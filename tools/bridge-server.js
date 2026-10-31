// BludBowl's AI as a service, for other programs (BotBowl's Python bot: tools/botbowl/bludbowl_bot.py; ai-training/botbowl-bridge.md).
// Opens the game with no browser (tools/headless-match.js), then answers one question per line on stdin, one JSON line back on stdout:
//   {"op": "turn" | "reroll" | "dice" | "push" | "follow" | "setup" | "kick" | "touchback", "desc": {...position...}, "arg": ...}
//   -> {"ok": true, "result": ...}   or   {"ok": false, "error": "..."}
// desc (optional) loads a position first: see the bridge in index.html (AI.bridge.load) for its fields. Prints {"ready": true} when set.
// Needs jsdom: npm i jsdom
const readline = require('readline');
const { openGame } = require('./headless-match');

(async () => {
  const { window: w } = await openGame({ simtest: false });   // (the normal clock: test mode's runs flat out even when idle)
  // a Human v Human match, with nobody playing it: only there to give the AI its teams and a game to put positions into
  w.eval(`AI.set(0, false); AI.set(1, false); window.launchMatch('human', 'human', { replaceOk: true });`);
  await new Promise(r => setTimeout(r, 1500));
  const B = w.eval('AI.bridge');
  const out = o => process.stdout.write(JSON.stringify(o) + '\n');
  out({ ready: true });
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', line => {
    if (!line.trim()) return;
    let q; try { q = JSON.parse(line); } catch (e) { out({ ok: false, error: 'bad JSON' }); return; }
    try {
      if (q.desc) B.load(q.desc);
      const fn = q.op && q.op !== 'load' ? B[q.op] : null;
      if (q.op && q.op !== 'load' && typeof fn !== 'function') throw new Error('unknown op ' + q.op);
      const r = fn ? fn(q.arg) : null;
      out({ ok: true, result: r == null ? null : JSON.parse(JSON.stringify(r)) });
    } catch (e) { out({ ok: false, error: String(e && e.stack || e).slice(0, 600) }); }
  });
  rl.on('close', () => process.exit(0)); process.stdin.on('end', () => process.exit(0));
})();
