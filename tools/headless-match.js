// Plays a computer-vs-computer match with no browser at all: index.html runs inside jsdom (a simulated browser in Node) in
// test mode, with drawing and sound stubbed out. It's slower than the hidden Chrome that tools/ai-match.js uses (~45s a match
// v ~10s), but needs only Node and the jsdom package: the first step towards driving BludBowl's AI from other programs
// (BotBowl, a Python training loop). Needs jsdom: npm i jsdom (any recent version).
//   node tools/headless-match.js [homeRace] [awayRace]
const path = require('path'), fs = require('fs');
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) { console.error('Needs jsdom: npm i jsdom'); process.exit(1); }

// a BludBowl page in jsdom, ready to use (resolves with its window once the game has loaded)
function openGame({ simtest = true } = {}) {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/<script[^>]*src=["'][^"']*tailwind[^"']*["'][^>]*><\/script>/g, '');
  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(String(e && e.message || e).slice(0, 200)));
  vc.on('error', e => errors.push(String(e).slice(0, 200)));
  const noop = () => {};
  const ctx = new Proxy({}, { get: (o, k) => {   // a canvas that draws nothing
    if (k === 'canvas') return { width: 300, height: 150 };
    if (k === 'measureText') return () => ({ width: 10 });
    if (k === 'getImageData' || k === 'createImageData') return () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
    if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') return () => ({ addColorStop: noop });
    return typeof k === 'string' ? (o[k] !== undefined ? o[k] : noop) : undefined;
  }, set: (o, k, v) => { o[k] = v; return true; } });
  const dom = new JSDOM(html, { url: 'http://localhost/index.html' + (simtest ? '?simtest' : ''), runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => ctx; w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.HTMLMediaElement.prototype.play = () => Promise.resolve(); w.HTMLMediaElement.prototype.pause = noop;
      w.matchMedia = () => ({ matches: false, addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop });
      w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }; w.IntersectionObserver = w.ResizeObserver;
      w.scrollTo = noop; w.Element.prototype.scrollIntoView = noop;
      Object.defineProperty(w.document, 'fonts', { value: { ready: Promise.resolve(), load: () => Promise.resolve([]), check: () => true, add: noop } });
      // Node has these; jsdom's window doesn't
      ['MessageChannel', 'MessagePort', 'BroadcastChannel', 'structuredClone', 'TextEncoder', 'TextDecoder', 'CompressionStream', 'DecompressionStream',
        'ReadableStream', 'WritableStream', 'Blob', 'Response'].forEach(k => { try { if (!w[k] && globalThis[k]) w[k] = globalThis[k]; } catch (e) {} });
      w.fetch = () => Promise.reject(new Error('offline'));
    } });
  return new Promise(res => dom.window.addEventListener('load', () => setTimeout(() => res({ window: dom.window, errors }), 300)));
}

async function playMatch(a = 'orc', b = 'human', { timeoutMs = 300000 } = {}) {
  const { window: w, errors } = await openGame(), t0 = Date.now();
  w.eval(`AI.set(0, true); AI.set(1, true); window.launchMatch(${JSON.stringify(a)}, ${JSON.stringify(b)}, { replaceOk: true });`);
  return new Promise(res => {
    const iv = setInterval(() => {
      const o = JSON.parse(w.eval(`(() => { const b = document.getElementById('btn-lineup-confirm'); if (b && !b.closest('.hidden')) b.click();
        return JSON.stringify({ over: !!state.isGameOver, half: state.half, turn: [state.turn[0], state.turn[1]], score: [state.score[0], state.score[1]] }); })()`));
      if (o.over || Date.now() - t0 > timeoutMs) { clearInterval(iv); o.secs = +((Date.now() - t0) / 1000).toFixed(1); o.errors = errors; w.close(); res(o); }
    }, 500);
  });
}

module.exports = { openGame, playMatch };
if (require.main === module) {
  const [a = 'orc', b = 'human'] = process.argv.slice(2);
  playMatch(a, b).then(r => { console.log(`${a} ${r.score[0]} - ${r.score[1]} ${b}${r.over ? '' : ' (not finished)'}, ${r.secs}s`); if (r.errors.length) console.log('page errors:\n' + r.errors.slice(0, 10).join('\n')); process.exit(0); });
}
