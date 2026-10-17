// Edge Deck — local server for the CORSAIR XENEON EDGE (2560x720) dashboard.
// Zero dependencies. Serves the UI, exposes PC stats, media + launcher controls.
// Binds to 127.0.0.1 only: nothing on the network can reach it.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

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
let lhm = { cpuTemp: null, gpuTemp: null };
function walk(node, out) {
  if (!node) return;
  if (node.Type === 'Temperature' || (node.Value && /°C/.test(node.Value))) out.push(node);
  (node.Children || []).forEach(c => walk(c, out));
}
function pollLhm() {
  const url = config.libreHardwareMonitorUrl || 'http://127.0.0.1:8085/data.json';
  http.get(url, { timeout: 1500 }, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      try {
        const temps = []; walk(JSON.parse(body), temps);
        const val = n => parseFloat(String(n.Value).replace(',', '.'));
        const cpu = temps.find(t => /package|tctl|tdie|core \(tctl/i.test(t.Text)) || temps.find(t => /cpu/i.test(t.Text));
        const gpu = temps.find(t => /gpu core|gpu hot spot|gpu/i.test(t.Text));
        lhm = { cpuTemp: cpu ? val(cpu) : null, gpuTemp: gpu ? val(gpu) : null };
      } catch { lhm = { cpuTemp: null, gpuTemp: null }; }
    });
  }).on('error', () => { lhm = { cpuTemp: null, gpuTemp: null }; });
}
setInterval(pollLhm, 3000); pollLhm();

// ---------- HTTP ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}
function readBody(req) {
  return new Promise(resolve => {
    let b = ''; req.on('data', d => { b += d; if (b.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch { resolve({}); } });
  });
}

const MEDIA_CMDS = new Set(['playpause', 'next', 'prev', 'volup', 'voldown', 'mute']);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

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
      bridgeAge: bridge.ts ? Date.now() - bridge.ts : null,
    });
  }

  if (p === '/api/config') {
    return json(res, 200, { launchers: config.launchers.map(({ id, name, icon, color }) => ({ id, name, icon, color })) });
  }

  if (p.startsWith('/api/media/') && req.method === 'POST') {
    const cmd = p.split('/').pop();
    if (!MEDIA_CMDS.has(cmd)) return json(res, 400, { ok: false });
    return json(res, 200, { ok: sendControl({ type: 'media', cmd }) });
  }

  if (p === '/api/launch' && req.method === 'POST') {
    const { id } = await readBody(req);
    const item = config.launchers.find(l => l.id === id); // whitelist: only configured targets
    if (!item) return json(res, 404, { ok: false });
    return json(res, 200, { ok: sendControl({ type: 'launch', target: item.target, args: item.args || '' }) });
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
  let file = path.normalize(path.join(PUBLIC, p === '/' ? 'index.html' : decodeURIComponent(p)));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Edge Deck running → http://localhost:${PORT}`);
});
// Also answer on IPv6 loopback, since "localhost" may resolve to ::1 first.
const server6 = http.createServer((req, res) => server.emit('request', req, res));
server6.on('error', () => {});
server6.listen(PORT, '::1');
