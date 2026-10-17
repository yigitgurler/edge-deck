// Edge Deck — local server for the CORSAIR XENEON EDGE (2560x720) dashboard.
// Zero dependencies. Serves the UI, exposes PC stats, media + launcher controls.
// Binds to 127.0.0.1 only: nothing on the network can reach it.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const crypto = require('crypto');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const CONFIG_PATH = path.join(ROOT, 'config.json');
const SETTINGS_PATH = path.join(ROOT, 'settings.json');

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const PORT = Number(process.env.EDGE_DECK_PORT || config.port || 5280);
const IS_WIN = process.platform === 'win32';

// ---------- CPU / RAM (native) ----------
let lastCpu = os.cpus();
let cpuLoad = 0;
let cpuPerCore = [];
setInterval(() => {
  const now = os.cpus();
  let idleAll = 0, totalAll = 0;
  cpuPerCore = now.map((c, i) => {
    const p = lastCpu[i] || c;
    const idle = c.times.idle - p.times.idle;
    const total = Object.keys(c.times).reduce((s, k) => s + (c.times[k] - p.times[k]), 0);
    idleAll += idle; totalAll += total;
    return total > 0 ? Math.round((1 - idle / total) * 100) : 0;
  });
  cpuLoad = totalAll > 0 ? Math.round((1 - idleAll / totalAll) * 1000) / 10 : 0;
  lastCpu = now;
}, 1000);

// ---------- Windows bridge (GPU, network, disk, media) ----------
let bridge = { gpu: null, net: null, disks: [], media: null, ts: 0 };
function startBridge() {
  if (!IS_WIN) return;
  const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', path.join(ROOT, 'bridge', 'stats.ps1')], { windowsHide: true });
  let buf = '';
  ps.stdout.on('data', d => {
    buf += d.toString('utf8');
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith('{')) continue;
      try { bridge = { ...bridge, ...JSON.parse(line), ts: Date.now() }; } catch { /* partial line */ }
    }
  });
  ps.stderr.on('data', d => process.env.EDGE_DECK_DEBUG && console.error('[stats]', d.toString()));
  ps.on('exit', () => setTimeout(startBridge, 3000));
}
startBridge();

// Persistent control process: reads one command per line from stdin.
let control = null;
function startControl() {
  if (!IS_WIN) return;
  control = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', path.join(ROOT, 'bridge', 'control.ps1')], { windowsHide: true });
  control.stderr.on('data', d => process.env.EDGE_DECK_DEBUG && console.error('[control]', d.toString()));
  control.on('exit', () => { control = null; setTimeout(startControl, 2000); });
}
startControl();
function sendControl(cmd) {
  if (!control) return false;
  control.stdin.write(JSON.stringify(cmd) + '\n');
  return true;
}

// Optional: LibreHardwareMonitor "Remote Web Server" (port 8085) for CPU/GPU temps.
// Every sensor it reports (temps, fans, clocks, loads, power…) is offered in the sensor widgets.
let lhm = { cpuTemp: null, gpuTemp: null, sensors: [] };
const LHM_TYPES = /^(Temperature|Load|Fan|Clock|Power|Voltage|Data|SmallData|Throughput|Control|Level|Factor|Frequency)$/;
function walk(node, hw, out) {
  if (!node) return;
  // Hardware nodes carry an ImageURL; remember the nearest one as the sensor's device name.
  const here = node.ImageURL && node.Text && !node.Value ? node.Text : hw;
  if (node.Type && LHM_TYPES.test(node.Type) && node.Value && node.Value !== '-') {
    const m = /^(-?[\d.,]+)\s*(.*)$/.exec(String(node.Value).trim());
    if (m) out.push({ id: node.SensorId || `${here}/${node.Text}/${node.Type}`, name: node.Text, hw: here, type: node.Type,
      value: parseFloat(m[1].replace(',', '.')), unit: m[2] });
  }
  (node.Children || []).forEach(c => walk(c, here, out));
}
function pollLhm() {
  const url = config.libreHardwareMonitorUrl || 'http://127.0.0.1:8085/data.json';
  http.get(url, { timeout: 1500 }, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      try {
        const sensors = []; walk(JSON.parse(body), '', sensors);
        const temps = sensors.filter(s => s.type === 'Temperature');
        const cpu = temps.find(t => /package|tctl|tdie/i.test(t.name) && /cpu|ryzen|intel|core/i.test(t.hw)) || temps.find(t => /cpu/i.test(t.name));
        const gpu = temps.find(t => /gpu core|gpu hot spot/i.test(t.name)) || temps.find(t => /gpu/i.test(t.name));
        lhm = { cpuTemp: cpu ? cpu.value : null, gpuTemp: gpu ? gpu.value : null, sensors };
      } catch { lhm = { cpuTemp: null, gpuTemp: null, sensors: [] }; }
    });
  }).on('error', () => { lhm = { cpuTemp: null, gpuTemp: null, sensors: [] }; });
}
setInterval(pollLhm, 3000); pollLhm();

// ---------- Window helper: the Edge Deck window never steals focus (bridge/window.ps1) ----------
const TYPING_FILE = path.join(ROOT, 'cache', 'typing.txt');
function startWindowHelper() {
  if (!IS_WIN) return;
  const p = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', path.join(ROOT, 'bridge', 'window.ps1'), '-TypingFile', TYPING_FILE, '-ServerPid', String(process.pid)], { windowsHide: true });
  p.stderr.on('data', d => process.env.EDGE_DECK_DEBUG && console.error('[window]', d.toString()));
  p.on('exit', () => setTimeout(startWindowHelper, 2000));
}
startWindowHelper();

// ---------- Installed apps + Steam games for the launcher picker ----------
const ICON_DIR = path.join(ROOT, 'cache', 'icons');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const iconKey = p => crypto.createHash('sha1').update(p.toLowerCase()).digest('hex');
const SKIP_APP = /uninstall|readme|read me|help|documentation|manual|website|license|release notes|support|changelog|faq/i;

function walkShortcuts(dir, out, depth = 0) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && depth < 3) walkShortcuts(full, out, depth + 1);
    else if (/\.(lnk|url)$/i.test(e.name)) {
      const name = e.name.replace(/\.(lnk|url)$/i, '');
      if (!SKIP_APP.test(name)) out.push({ name, target: full, kind: 'app' });
    }
  }
}
function steamGames() {
  if (!IS_WIN) return [];
  let steam = 'C:\\Program Files (x86)\\Steam';
  try {
    const r = require('child_process').spawnSync('reg', ['query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'], { encoding: 'utf8' });
    const m = /SteamPath\s+REG_SZ\s+(.+)/.exec(r.stdout || ''); if (m) steam = m[1].trim().replace(/\//g, '\\');
  } catch {}
  const libs = new Set([steam]);
  try {
    const vdf = fs.readFileSync(path.join(steam, 'steamapps', 'libraryfolders.vdf'), 'utf8');
    for (const m of vdf.matchAll(/"path"\s+"([^"]+)"/g)) libs.add(m[1].replace(/\\\\/g, '\\'));
  } catch {}
  const games = [];
  for (const lib of libs) {
    let files = [];
    try { files = fs.readdirSync(path.join(lib, 'steamapps')).filter(f => /^appmanifest_\d+\.acf$/.test(f)); } catch { continue; }
    for (const f of files) {
      try {
        const acf = fs.readFileSync(path.join(lib, 'steamapps', f), 'utf8');
        const id = /"appid"\s+"(\d+)"/.exec(acf)?.[1], name = /"name"\s+"([^"]+)"/.exec(acf)?.[1];
        if (id && name && !/redistributable|steamworks|proton|runtime/i.test(name)) {
          games.push({ name, target: `steam://rungameid/${id}`, kind: 'steam', img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg` });
        }
      } catch {}
    }
  }
  return games.filter((g, i) => games.findIndex(x => x.target === g.target) === i);
}
let appsCache = null, appsAt = 0, iconJob = null;
function listApps() {
  if (appsCache && Date.now() - appsAt < 60e3) return appsCache;
  const out = [];
  const env = process.env;
  [path.join(env.ProgramData || 'C:\\ProgramData', 'Microsoft\\Windows\\Start Menu\\Programs'),
   path.join(env.APPDATA || '', 'Microsoft\\Windows\\Start Menu\\Programs'),
   path.join(env.PUBLIC || 'C:\\Users\\Public', 'Desktop'),
   path.join(env.USERPROFILE || '', 'Desktop')].forEach(d => walkShortcuts(d, out));
  const seen = new Set();
  const apps = out.filter(a => !seen.has(a.name.toLowerCase()) && seen.add(a.name.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(a => ({ ...a, img: `/api/icon?k=${iconKey(a.target)}` }));
  appsCache = { apps, games: steamGames().sort((a, b) => a.name.localeCompare(b.name)) };
  appsAt = Date.now();
  extractIcons(apps.map(a => a.target));
  return appsCache;
}
// Pull real app icons (256px with transparency) in one background PowerShell run.
function extractIcons(paths) {
  if (!IS_WIN || iconJob) return;
  fs.mkdirSync(ICON_DIR, { recursive: true });
  const todo = paths.filter(p => !fs.existsSync(path.join(ICON_DIR, iconKey(p) + '.png')))
    .map(p => ({ path: p, out: path.join(ICON_DIR, iconKey(p) + '.png') }));
  if (!todo.length) return;
  const list = path.join(os.tmpdir(), `edgedeck-icons-${Date.now()}.json`);
  fs.writeFileSync(list, JSON.stringify(todo));
  iconJob = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', path.join(ROOT, 'bridge', 'icons.ps1'), list], { windowsHide: true });
  iconJob.on('exit', () => { iconJob = null; fs.rm(list, () => {}); });
}

// A launch target must be an existing file on this PC or a URL / app protocol (steam://, spotify:, ms-settings:…).
function validTarget(t) {
  if (typeof t !== 'string' || !t || t.length > 2048) return false;
  if (/^[a-zA-Z]:[\\/]/.test(t) || t.startsWith('\\\\')) { try { return fs.statSync(t).isFile(); } catch { return false; } }
  if (/^(file|javascript|data|vbscript):/i.test(t)) return false;
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(t) || /^[\w.-]+\.exe$/i.test(t);
}

// ---------- HTTP ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm' };
const IMG_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm' };

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
function readBody(req) {
  return new Promise(resolve => {
    let b = ''; req.on('data', d => { b += d; if (b.length > 2e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch { resolve({}); } });
  });
}
function readRaw(req, max) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', d => { n += d.length; if (n > max) { req.destroy(); reject(new Error('too big')); } else chunks.push(d); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function sendFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

// Only this PC's own Edge Deck page may talk to the server. Blocks other websites (CSRF) and DNS rebinding.
const HTTPS_PORT = PORT + 1;
const OK_HOSTS = new Set([PORT, HTTPS_PORT].flatMap(p => [`localhost:${p}`, `127.0.0.1:${p}`, `[::1]:${p}`]));
function trusted(req) {
  if (!OK_HOSTS.has(req.headers.host)) return false;
  const o = req.headers.origin;
  if (!o) return true;
  try { return OK_HOSTS.has(new URL(o).host); } catch { return false; }
}

const MEDIA_CMDS = new Set(['playpause', 'next', 'prev', 'volup', 'voldown', 'mute']);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  if (!trusted(req)) { res.writeHead(403); return res.end('Forbidden'); }

  if (p === '/api/stats') {
    const total = os.totalmem(), free = os.freemem();
    return json(res, 200, {
      online: true,
      host: os.hostname(),
      cpu: { load: cpuLoad, cores: cpuPerCore, model: (os.cpus()[0] || {}).model?.trim(), temp: lhm.cpuTemp },
      ram: { used: total - free, total },
      uptime: os.uptime(),
      gpu: bridge.gpu ? { ...bridge.gpu, temp: bridge.gpu.temp ?? lhm.gpuTemp } : (lhm.gpuTemp ? { temp: lhm.gpuTemp } : null),
      net: bridge.net,
      disks: bridge.disks,
      media: bridge.media,
      audio: bridge.audio,
      fps: bridge.fps,
      lhm: lhm.sensors,
      bridgeAge: bridge.ts ? Date.now() - bridge.ts : null,
    });
  }

  if (p === '/api/config') {
    return json(res, 200, { launchers: config.launchers.map(({ id, name, icon, color, target }) => ({ id, name, icon, color, target })) });
  }

  if (p === '/api/apps') return json(res, 200, listApps());

  if (p === '/api/icon') {
    const k = url.searchParams.get('k') || '';
    if (!/^[0-9a-f]{40}$/.test(k)) { res.writeHead(400); return res.end(); }
    return sendFile(res, path.join(ICON_DIR, k + '.png'));
  }

  if (p === '/api/upload' && req.method === 'POST') {
    const ext = IMG_EXT[(req.headers['content-type'] || '').split(';')[0]];
    if (!ext) return json(res, 415, { ok: false });
    // Streamed to disk so large videos don't sit in memory. Limit: 25 MB images, 500 MB videos.
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const file = path.join(UPLOAD_DIR, name), max = (ext === 'mp4' || ext === 'webm' ? 500 : 25) * 2 ** 20;
    const out = fs.createWriteStream(file); let n = 0, failed = false;
    req.on('data', d => { n += d.length; if (n > max && !failed) { failed = true; req.unpipe(out); out.destroy(); fs.rm(file, () => {}); json(res, 413, { ok: false }); } });
    req.pipe(out);
    out.on('finish', () => { if (!failed) json(res, 200, { ok: true, src: `/uploads/${name}` }); });
    out.on('error', () => { if (!failed) { failed = true; json(res, 500, { ok: false }); } });
    return;
  }

  if (p.startsWith('/uploads/')) {
    const file = path.normalize(path.join(UPLOAD_DIR, decodeURIComponent(p.slice(9))));
    if (!file.startsWith(UPLOAD_DIR + path.sep)) { res.writeHead(403); return res.end(); }
    return sendFile(res, file);
  }

  // Volume, shortcut keys, typing and touchpad. Inputs are validated before reaching the control process.
  if (p === '/api/volume' && req.method === 'POST') {
    const b = await readBody(req);
    if (b.mute) return json(res, 200, { ok: sendControl({ type: 'mute' }) });
    const level = Number(b.level);
    if (!(level >= 0 && level <= 1)) return json(res, 400, { ok: false });
    return json(res, 200, { ok: sendControl({ type: 'volume', level }) });
  }
  if (p === '/api/keys' && req.method === 'POST') {
    const { vks } = await readBody(req);
    if (!Array.isArray(vks) || !vks.length || vks.length > 6 || !vks.every(v => Number.isInteger(v) && v > 0 && v < 255)) return json(res, 400, { ok: false });
    return json(res, 200, { ok: sendControl({ type: 'keys', vks }) });
  }
  if (p === '/api/text' && req.method === 'POST') {
    const { text } = await readBody(req);
    if (typeof text !== 'string' || !text || text.length > 2000) return json(res, 400, { ok: false });
    return json(res, 200, { ok: sendControl({ type: 'text', text }) });
  }
  if (p === '/api/mouse' && req.method === 'POST') {
    const b = await readBody(req);
    if (!['move', 'click', 'dbl', 'down', 'up', 'scroll'].includes(b.op)) return json(res, 400, { ok: false });
    const n = (v) => Math.max(-4000, Math.min(4000, Math.round(Number(v) || 0)));
    return json(res, 200, { ok: sendControl({ type: 'mouse', op: b.op, dx: n(b.dx), dy: n(b.dy), button: b.button === 'right' ? 'right' : 'left' }) });
  }
  // While a text field on the Edge has focus, let its window take keyboard focus (see bridge/window.ps1).
  if (p === '/api/typing' && req.method === 'POST') {
    const { on } = await readBody(req);
    fs.mkdirSync(path.dirname(TYPING_FILE), { recursive: true });
    fs.writeFileSync(TYPING_FILE, on ? '1' : '0');
    return json(res, 200, { ok: true });
  }


  if (p.startsWith('/api/media/') && req.method === 'POST') {
    const cmd = p.split('/').pop();
    if (!MEDIA_CMDS.has(cmd)) return json(res, 400, { ok: false });
    return json(res, 200, { ok: sendControl({ type: 'media', cmd }) });
  }

  if (p === '/api/launch' && req.method === 'POST') {
    const { target } = await readBody(req);
    if (!validTarget(target)) return json(res, 400, { ok: false });
    return json(res, 200, { ok: sendControl({ type: 'launch', target, args: '' }) });
  }

  if (p === '/api/settings') {
    if (req.method === 'POST') {
      const body = await readBody(req);
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(body, null, 2));
      return json(res, 200, { ok: true });
    }
    try { return json(res, 200, JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'))); }
    catch { return json(res, 200, null); }
  }

  // static
  const file = path.normalize(path.join(PUBLIC, p === '/' ? 'index.html' : decodeURIComponent(p)));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  sendFile(res, file);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Edge Deck running → http://localhost:${PORT}`);
});
// Also answer on IPv6 loopback, since "localhost" may resolve to ::1 first.
const server6 = http.createServer((req, res) => server.emit('request', req, res));
server6.on('error', () => {});
// HTTPS twin for iCUE's Web URL / iFrame widgets, which only open https:// pages.
// The installer creates a localhost-only certificate (installer/cert.ps1).
try {
  const pfx = fs.readFileSync(path.join(ROOT, 'cache', 'https.pfx'));
  const passphrase = fs.readFileSync(path.join(ROOT, 'cache', 'https.pass'), 'utf8').trim();
  for (const host of ['127.0.0.1', '::1']) {
    const s = require('https').createServer({ pfx, passphrase }, (req, res) => server.emit('request', req, res));
    s.on('error', () => {});
    s.listen(HTTPS_PORT, host);
  }
  console.log(`Edge Deck (HTTPS) → https://localhost:${HTTPS_PORT}`);
} catch { /* no certificate yet: http only */ }
server6.listen(PORT, '::1');
