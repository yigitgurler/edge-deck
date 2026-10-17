/* Edge Deck — touch dashboard for the CORSAIR XENEON EDGE (2560×720). */
(() => {
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const API = params.get('api') || (location.protocol === 'file:' ? 'http://localhost:5280' : '');
const icon = (id) => `<svg><use href="#i-${id}"/></svg>`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const T = (s) => (S.lang === 'tr' && TR[s]) || s;
const LOC = () => (S.lang === 'tr' ? 'tr-TR' : 'en-US');
const TR = {
  'Local time': 'Yerel saat', 'Loading…': 'Yükleniyor…', 'Feels': 'Hissedilen', 'System': 'Sistem', 'PC link offline': 'PC bağlantısı yok',
  'threads': 'iş parçacığı', 'n/a': 'yok', 'offline': 'çevrimdışı', 'Now playing': 'Şimdi çalıyor', 'Nothing playing': 'Çalan bir şey yok',
  'Play something on your PC': 'Bilgisayarda bir şey çalın', 'Launch': 'Başlat', 'World': 'Dünya', 'Focus': 'Odak', 'Focusing': 'Odaklanılıyor',
  'On a break': 'Molada', 'Tap to start': 'Başlatmak için dokun', 'Start the Edge Deck server to use the launcher.': 'Başlatıcı için Edge Deck sunucusu çalışmalı.',
  'Processor': 'İşlemci', 'Graphics': 'Ekran kartı', 'Network': 'Ağ', 'Download': 'İndirme', 'Upload': 'Yükleme', 'Memory & storage': 'Bellek ve depolama',
  'Power': 'Güç', 'Uptime': 'Çalışma süresi', 'free': 'boş', 'Volume': 'Ses', 'Break': 'Mola', 'Pause': 'Duraklat', 'Resume': 'Devam',
  'Start': 'Başlat', 'Reset': 'Sıfırla', 'To-do': 'Yapılacaklar', 'Add a task…': 'Görev ekle…', 'No tasks. Add one below.': 'Görev yok. Aşağıdan ekleyin.',
  'Notes': 'Notlar', 'Tap to write a note…': 'Not yazmak için dokunun…', 'Break over — back to it': 'Mola bitti — işe dönüş',
  'Nice work — take a break': 'Harika iş — mola zamanı', 'Day': 'Gündüz', 'Night': 'Gece', 'Theme': 'Tema', 'Accent color': 'Vurgu rengi',
  'Display': 'Ekran', 'Background glow': 'Arka plan ışıltısı', 'Night dimming': 'Gece karartma', 'Lowers brightness overnight. Tap to wake.': 'Gece parlaklığı düşürür. Uyandırmak için dokunun.',
  'Dim from': 'Başlangıç', 'Until': 'Bitiş', 'Idle screensaver': 'Ekran koruyucu', 'Black screen with a drifting clock.': 'Siyah ekranda kayan saat.',
  'After': 'Süre', 'Home screen widgets': 'Ana ekran bileşenleri', 'Format': 'Biçim', 'Clock': 'Saat', '12-hour': '12 saat', '24-hour': '24 saat',
  'Show seconds': 'Saniyeleri göster', 'Temperature': 'Sıcaklık', 'Weather location': 'Hava durumu konumu', 'Search a city…': 'Şehir ara…',
  'Second city': 'İkinci şehir', 'None': 'Yok', 'Shown under the main forecast': 'Ana tahminin altında gösterilir', 'World clocks': 'Dünya saatleri',
  'Add a city…': 'Şehir ekle…', 'About': 'Hakkında', 'Linked to': 'Bağlı:', 'Searching…': 'Aranıyor…', 'No matches.': 'Sonuç yok.',
  'Search failed — check the internet connection.': 'Arama başarısız — internet bağlantısını kontrol edin.', 'Language': 'Dil', 'Opening': 'Açılıyor:',
  'Weather': 'Hava durumu', 'Clock & date': 'Saat ve tarih', 'System monitor': 'Sistem monitörü', 'App launcher': 'Uygulama başlatıcı',
  'Calendar': 'Takvim', 'Focus timer': 'Odak sayacı', 'Run start.bat on the PC to stream live stats here.': 'Canlı veriler için bilgisayarda Edge Deck çalışmalı.',
  'Clear': 'Açık', 'Mostly clear': 'Çoğunlukla açık', 'Partly cloudy': 'Parçalı bulutlu', 'Overcast': 'Kapalı', 'Fog': 'Sis', 'Freezing fog': 'Dondurucu sis',
  'Light drizzle': 'Hafif çisenti', 'Drizzle': 'Çisenti', 'Heavy drizzle': 'Yoğun çisenti', 'Freezing drizzle': 'Dondurucu çisenti', 'Light rain': 'Hafif yağmur',
  'Rain': 'Yağmur', 'Heavy rain': 'Şiddetli yağmur', 'Freezing rain': 'Dondurucu yağmur', 'Light snow': 'Hafif kar', 'Snow': 'Kar', 'Heavy snow': 'Yoğun kar',
  'Snow grains': 'Kar taneleri', 'Showers': 'Sağanak', 'Violent showers': 'Şiddetli sağanak', 'Snow showers': 'Kar sağanağı', 'Thunderstorm': 'Gök gürültülü fırtına',
  'Thunderstorm, hail': 'Fırtına, dolu', 'Weather:': 'Hava durumu:', 'Theme default': 'Tema varsayılanı',
  'Customize home screen': 'Ana ekranı düzenle', 'Add, remove, resize and reorder widgets.': 'Bileşen ekle, sil, boyutlandır ve sırala.',
  'Add widget': 'Bileşen ekle', 'Done': 'Bitti', 'Website': 'Web sitesi', 'Photos': 'Fotoğraflar', 'Countdown': 'Geri sayım',
  'Sticky note': 'Not', 'Apps': 'Uygulamalar', 'Steam games': 'Steam oyunları', 'Search…': 'Ara…', 'Add': 'Ekle', 'Added': 'Eklendi:',
  'Name': 'Ad', 'Address (URL)': 'Adres (URL)', 'Icon': 'Simge', 'Color': 'Renk', 'Buttons': 'Düğmeler', 'Tap an app to add it.': 'Eklemek için bir uygulamaya dokunun.',
  'No apps found.': 'Uygulama bulunamadı.', 'Some websites block being shown inside other pages.': 'Bazı siteler başka sayfaların içinde gösterilmeyi engeller.',
  'Tap the gear to set a website': 'Site eklemek için ayar düğmesine dokunun', 'Zoom': 'Yakınlaştırma', 'Add photos': 'Fotoğraf ekle',
  'Change every': 'Değiştirme sıklığı', 'Fill': 'Doldur', 'Fit': 'Sığdır', 'Title': 'Başlık', 'Date & time': 'Tarih ve saat', 'days': 'gün',
  'Today!': 'Bugün!', 'Ended': 'Bitti', 'Game mode': 'Oyun modu', 'Off': 'Kapalı', 'Auto': 'Otomatik', 'On': 'Açık',
  'Locks the mouse to the game screen so it can’t slip onto the Edge. Touch still works. Auto: only while a game is full screen.':
    'Fareyi oyun ekranına kilitler, Edge’e kaymaz. Dokunmatik çalışmaya devam eder. Otomatik: sadece bir oyun tam ekrandayken.',
  'Game mode on — mouse locked to the game screen': 'Oyun modu açık — fare oyun ekranına kilitli', 'Game mode: automatic': 'Oyun modu: otomatik',
  'Game mode off': 'Oyun modu kapalı', 'Write something…': 'Bir şey yazın…', 'Loading apps…': 'Uygulamalar yükleniyor…', 'No Steam games found.': 'Steam oyunu bulunamadı.',
  'Tap the gear to add buttons': 'Düğme eklemek için ayar düğmesine dokunun', 'Tap the gear to add photos': 'Fotoğraf eklemek için ayar düğmesine dokunun',
  'Tap the gear to set a date': 'Tarih seçmek için ayar düğmesine dokunun', 'Any website, Twitch, a map…': 'Herhangi bir site, Twitch, harita…',
  'Your own photo slideshow': 'Kendi fotoğraf slaytınız', 'Days until an event': 'Bir etkinliğe kalan gün', 'Quick text on the screen': 'Ekranda kısa not',
  'Apps, games and websites': 'Uygulamalar, oyunlar ve siteler', 'Time, date, other cities': 'Saat, tarih, diğer şehirler',
  'Now and next hours': 'Şimdi ve sonraki saatler', 'CPU, GPU, RAM, network': 'CPU, GPU, RAM, ağ', 'Music controls': 'Müzik kontrolleri',
  'This month': 'Bu ay', 'Up to 4 cities': '4 şehre kadar', 'Pomodoro shortcut': 'Pomodoro kısayolu', 'Uploading…': 'Yükleniyor…',
  'Upload failed': 'Yükleme başarısız', 'Opening…': 'Açılıyor…', 'Could not open': 'Açılamadı', 'Save': 'Kaydet', 'seconds': 'saniye',
  'minutes': 'dakika', 'Remove widget': 'Bileşeni kaldır', 'Size': 'Boyut', 'Ends': 'Bitiş', 'Launcher': 'Başlatıcı',
};

// ---------------------------------------------------------------- settings
const DEFAULTS = {
  theme: 'obsidian', accent: null, glow: true,
  lang: 'en', clock24: false, showSeconds: true, tempUnit: 'F',
  location: { name: 'Charlotte', admin: 'North Carolina, United States', lat: 35.2271, lon: -80.8431 },
  location2: { name: 'Istanbul', admin: 'Istanbul, Türkiye', lat: 41.0082, lon: 28.9784 },
  zones: [
    { city: 'Charlotte', tz: 'America/New_York' },
    { city: 'Istanbul', tz: 'Europe/Istanbul' },
    { city: 'Los Angeles', tz: 'America/Los_Angeles' },
    { city: 'London', tz: 'Europe/London' },
    { city: 'Tokyo', tz: 'Asia/Tokyo' },
  ],
  // Home screen = ordered widget instances: { uid, type, size: 's'|'m'|'l', cfg }
  home: ['clock', 'weather', 'system', 'media', 'launcher'].map(type => ({ uid: type, type, size: 'm', cfg: {} })),
  gameMode: 'auto',
  dim: { on: true, from: 22, to: 7 },
  saver: { on: false, minutes: 15 },
  pomo: { work: 25, brk: 5 },
  todos: [{ t: 'Plug in the Edge Deck server', d: true }, { t: 'Pick a theme in Settings', d: false }],
  notes: '',
};
let S = structuredClone(DEFAULTS);

function merge(base, over) {
  if (!over || typeof over !== 'object') return base;
  const out = { ...base };
  for (const k of Object.keys(over)) {
    out[k] = (over[k] !== null && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) ? merge(base[k], over[k]) : over[k];
  }
  return out;
}
let saveTimer;
function save() {
  if (DEMO) return;
  try { localStorage.setItem('edgeDeck', JSON.stringify(S)); } catch {}
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fetch(API + '/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(S) }).catch(() => {});
  }, 600);
}
async function loadSettings() {
  let local = null, remote = null;
  if (!DEMO) {
    try { local = JSON.parse(localStorage.getItem('edgeDeck')); } catch {}
    try { remote = await (await fetch(API + '/api/settings', { cache: 'no-store' })).json(); } catch {}
  }
  S = merge(structuredClone(DEFAULTS), remote || local || {});
  // v1.0 stored { id, on } toggles; turn them into widget instances.
  S.home = (S.home || []).filter(h => h.type || h.on).map(h => h.type ? h : { uid: h.id, type: h.id, size: 'm', cfg: {} });
  // URL overrides (not saved): ?theme=aurora&lang=tr&accent=%233ee0c5&widgets=clock,weather,calendar
  if (params.get('theme')) S.theme = params.get('theme');
  if (params.get('lang')) S.lang = params.get('lang');
  if (params.get('accent')) S.accent = params.get('accent');
  if (params.get('widgets')) {
    const demoCfg = {
      countdown: { title: 'Summer trip to Istanbul', date: new Date(Date.now() + 41 * 864e5 + 5 * 36e5).toISOString().slice(0, 16) },
      note: { text: 'Squad night Friday 9 PM\nBring the new headset' },
      web: { url: 'https://embed.windy.com/embed2.html?lat=35.2&lon=-80.8&zoom=5&overlay=wind', zoom: .8 },
    };
    S.home = params.get('widgets').split(',').map(type => ({ uid: type, type, size: 'm', cfg: DEMO ? structuredClone(demoCfg[type] || {}) : {} }));
  }
  if (DEMO) {
    S.dim.on = false;
    S.todos = [
      { t: 'Finish the build log', d: true }, { t: 'Order more thermal paste', d: false },
      { t: 'Call mom — Sunday', d: false }, { t: 'Update GPU drivers', d: true }, { t: 'Gym 6 PM', d: false },
    ];
    S.notes = 'Fan curve: 40% idle, 70% @ 75°C\nSteam sale ends Thursday\nNew desk mat — 900×400';
  }
}

// ---------------------------------------------------------------- demo data (?demo) for screenshots
const DEMO = params.has('demo');
let demoT = 0;
const walk = {};
function demoStats() {
  demoT++;
  // smooth random walk per key, so graphs look like real load
  const w = (a, f, o = 0) => {
    const k = `${a}|${f}|${o}`;
    walk[k] = clamp((walk[k] ?? 0) * .85 + (Math.random() - .5) * .9 + .12 * Math.sin(demoT / (f * 3) + o), -1, 1);
    return a * walk[k];
  };
  const cpu = 34 + w(12, 3) + w(6, 1.3, 1);
  return {
    online: true, host: 'GAMING-PC',
    cpu: { load: cpu, cores: Array.from({ length: 16 }, (_, i) => Math.max(4, Math.round(cpu + w(22, 2 + i % 5, i)))), model: 'AMD Ryzen 7 7800X3D 8-Core Processor', temp: 61 + w(4, 4) },
    ram: { used: 19.4 * 2 ** 30 + w(2 ** 29, 6), total: 32 * 2 ** 30 },
    uptime: 3 * 86400 + 5 * 3600 + 42 * 60,
    gpu: { name: 'NVIDIA GeForce RTX 4080 SUPER', load: 58 + w(18, 2.5) + w(8, 0.9, 2), temp: 64 + w(3, 5), vramUsed: 9.6 * 2 ** 30, vramTotal: 16 * 2 ** 30, power: 238 + w(30, 2) },
    net: { down: 4.2e6 + w(2.6e6, 2.2) + w(1e6, 0.7, 1), up: 6.5e5 + w(3e5, 1.8, 2) },
    disks: [
      { name: 'C:', label: 'System', size: 2e12, free: 0.74e12 }, { name: 'D:', label: 'Games', size: 4e12, free: 1.1e12 },
      { name: 'E:', label: 'Media', size: 2e12, free: 1.42e12 },
    ],
    media: { title: 'Midnight Drive', artist: 'Neon Avenue', album: 'City Lights', app: 'Spotify.exe', status: 'Playing', position: 94, duration: 213, updated: Date.now() },
  };
}

// ---------------------------------------------------------------- scaling
const stage = $('#stage');
function fit() {
  const s = Math.min(innerWidth / 2560, innerHeight / 720);
  stage.style.transform = `translate(-50%, -50%) scale(${s})`;
}
addEventListener('resize', fit);

function applyTheme() {
  document.documentElement.dataset.theme = S.theme;
  const st = document.documentElement.style;
  if (S.accent) st.setProperty('--accent', S.accent); else st.removeProperty('--accent');
  st.setProperty('--glow-strength', S.glow ? 1 : 0);
}

// ---------------------------------------------------------------- toast
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800);
}

// ---------------------------------------------------------------- time helpers
const fmtTime = (d, tz, opts = {}) => new Intl.DateTimeFormat(LOC(), {
  hour: 'numeric', minute: '2-digit', hour12: !S.clock24, timeZone: tz, ...opts,
}).formatToParts(d).reduce((o, p) => (o[p.type] = p.value, o), {});
function tzHour(d, tz) {
  const p = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: tz }).formatToParts(d);
  const h = +p.find(x => x.type === 'hour').value % 24, m = +p.find(x => x.type === 'minute').value;
  return h + m / 60;
}
function tzOffsetLabel(tz) {
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US'));
  const there = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const diff = Math.round((there - local) / 36e5 * 2) / 2;
  if (diff === 0) return T('Local time');
  return `${diff > 0 ? '+' : ''}${diff}h`;
}
function dayPhaseColor(h) {
  if (h >= 7 && h < 18) return 'var(--warn)';
  if (h >= 5 && h < 7 || h >= 18 && h < 20) return 'var(--accent-2)';
  return 'var(--text-3)';
}

// ---------------------------------------------------------------- weather
const WX = {
  0: ['Clear', 'sun'], 1: ['Mostly clear', 'sun'], 2: ['Partly cloudy', 'partly'], 3: ['Overcast', 'cloud'],
  45: ['Fog', 'fog'], 48: ['Freezing fog', 'fog'], 51: ['Light drizzle', 'drizzle'], 53: ['Drizzle', 'drizzle'], 55: ['Heavy drizzle', 'drizzle'],
  56: ['Freezing drizzle', 'drizzle'], 57: ['Freezing drizzle', 'drizzle'], 61: ['Light rain', 'rain'], 63: ['Rain', 'rain'], 65: ['Heavy rain', 'rain'],
  66: ['Freezing rain', 'rain'], 67: ['Freezing rain', 'rain'], 71: ['Light snow', 'snow'], 73: ['Snow', 'snow'], 75: ['Heavy snow', 'snow'], 77: ['Snow grains', 'snow'],
  80: ['Showers', 'rain'], 81: ['Showers', 'rain'], 82: ['Violent showers', 'storm'], 85: ['Snow showers', 'snow'], 86: ['Snow showers', 'snow'],
  95: ['Thunderstorm', 'storm'], 96: ['Thunderstorm, hail', 'storm'], 99: ['Thunderstorm, hail', 'storm'],
};
function wxSvg(kind, day = true) {
  const sun = `<circle cx="32" cy="32" r="11" stroke="var(--warn)"/><g stroke="var(--warn)">${[0,45,90,135,180,225,270,315].map(a => {
    const r = a * Math.PI / 180; return `<line x1="${32 + Math.cos(r) * 18}" y1="${32 + Math.sin(r) * 18}" x2="${32 + Math.cos(r) * 24}" y2="${32 + Math.sin(r) * 24}"/>`; }).join('')}</g>`;
  const moon = `<path d="M40 14a18 18 0 1 0 12 26A14 14 0 0 1 40 14z" stroke="var(--text-2)"/>`;
  const cloud = (dy = 0, c = 'var(--text)') => `<path transform="translate(0 ${dy})" d="M20 48h26a10 10 0 0 0 0-20 14 14 0 0 0-27-2A11 11 0 0 0 20 48z" stroke="${c}"/>`;
  const drops = (n, c) => Array.from({ length: n }, (_, i) => `<line x1="${22 + i * 9}" y1="52" x2="${19 + i * 9}" y2="60" stroke="${c}"/>`).join('');
  let inner;
  switch (kind) {
    case 'sun': inner = day ? sun : moon; break;
    case 'partly': inner = `<g transform="translate(-8 -10) scale(.8)">${day ? sun : moon}</g>${cloud(4)}`; break;
    case 'cloud': inner = cloud(0); break;
    case 'fog': inner = `${cloud(-6, 'var(--text-2)')}<g stroke="var(--text-2)"><line x1="14" y1="50" x2="50" y2="50"/><line x1="18" y1="57" x2="46" y2="57"/></g>`; break;
    case 'drizzle': inner = `${cloud(-6)}${drops(3, 'var(--accent-2)')}`; break;
    case 'rain': inner = `${cloud(-6)}${drops(4, 'var(--accent-2)')}`; break;
    case 'snow': inner = `${cloud(-6)}<g fill="var(--text)" stroke="none">${[22, 32, 42].map((x, i) => `<circle cx="${x}" cy="${55 + (i % 2) * 4}" r="2.2"/>`).join('')}</g>`; break;
    case 'storm': inner = `${cloud(-6)}<path d="M33 46l-6 9h7l-4 8" stroke="var(--warn)"/>`; break;
    default: inner = cloud(0);
  }
  return `<svg viewBox="0 0 64 64">${inner}</svg>`;
}
let weather = null, weather2 = null;
async function loadWeather() {
  const { lat, lon } = S.location;
  const u = S.tempUnit === 'F';
  if (S.location2) {
    const l2 = S.location2;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${l2.lat}&longitude=${l2.lon}&current=temperature_2m,weather_code,is_day` +
      `&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1&temperature_unit=${u ? 'fahrenheit' : 'celsius'}`)
      .then(r => r.json()).then(j => { weather2 = j; updateWidgets('weather'); }).catch(() => {});
  } else weather2 = null;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day` +
    `&hourly=temperature_2m,weather_code,precipitation_probability,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max` +
    `&timezone=auto&forecast_days=6&temperature_unit=${u ? 'fahrenheit' : 'celsius'}&wind_speed_unit=${u ? 'mph' : 'kmh'}`;
  try {
    weather = await (await fetch(url)).json();
    weather.fetched = Date.now();
  } catch { /* keep last */ }
  updateWidgets('weather');
}

// ---------------------------------------------------------------- stats
let stats = null;
const hist = { cpu: [], gpu: [], ram: [], down: [], up: [] };
const HIST_N = 150;
function push(k, v) { hist[k].push(v); if (hist[k].length > HIST_N) hist[k].shift(); }
async function pollStats() {
  try {
    if (DEMO) {
      if (!hist.cpu.length) for (let i = 0; i < HIST_N - 1; i++) { const d = demoStats(); push('cpu', d.cpu.load); push('ram', 60); push('gpu', d.gpu.load); push('down', d.net.down); push('up', d.net.up); }
      stats = demoStats();
    } else stats = await (await fetch(API + '/api/stats', { cache: 'no-store' })).json();
    push('cpu', stats.cpu.load);
    push('ram', stats.ram.used / stats.ram.total * 100);
    push('gpu', stats.gpu?.load ?? 0);
    push('down', stats.net?.down ?? 0);
    push('up', stats.net?.up ?? 0);
  } catch { stats = null; }
  $('#railStatus').classList.toggle('on', !!stats);
  updateGameBtn();
  updateWidgets('system'); updateWidgets('media');
  if (currentPage === 'system') renderSystemPage(false);
  if (currentPage === 'media') updateMediaPage();
}
const fmtBytes = (b, d = 1) => {
  if (b == null || isNaN(b)) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0;
  while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
  return `${b.toFixed(i >= 3 ? d : 0)} ${u[i]}`;
};
const fmtRate = (b) => {
  if (b == null) return ['—', ''];
  const bits = b * 8;
  if (bits >= 1e9) return [(bits / 1e9).toFixed(2), 'Gbps'];
  if (bits >= 1e6) return [(bits / 1e6).toFixed(1), 'Mbps'];
  return [(bits / 1e3).toFixed(0), 'Kbps'];
};
const fmtTemp = (c) => c == null ? null : (S.tempUnit === 'F' ? Math.round(c * 9 / 5 + 32) + '°F' : Math.round(c) + '°C');
const fmtDur = (s) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; };
const fmtUptime = (s) => { const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return d ? `${d}d ${h}h` : `${h}h ${m}m`; };

// ---------------------------------------------------------------- media helpers
function appName(id = '') {
  const a = id.toLowerCase();
  const known = { spotify: 'Spotify', chrome: 'Chrome', msedge: 'Edge', firefox: 'Firefox', vlc: 'VLC', music: 'Apple Music', itunes: 'iTunes', zune: 'Media Player', opera: 'Opera', brave: 'Brave', discord: 'Discord', tidal: 'TIDAL' };
  for (const k in known) if (a.includes(k)) return known[k];
  if (/^[0-9a-f]{8,}$/i.test(id)) return 'Browser';
  return id || '';
}
function artGradient(seed = '') {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, hsl(${h} 75% 52%), hsl(${(h + 55) % 360} 80% 38%) 60%, hsl(${(h + 110) % 360} 70% 22%))`;
}
let optimisticPlaying = null, optimisticUntil = 0;
function mediaState() {
  const m = stats?.media;
  let playing = m?.status === 'Playing';
  if (Date.now() < optimisticUntil && optimisticPlaying != null) playing = optimisticPlaying;
  let pos = m?.position || 0;
  if (m && playing && m.updated && m.duration) pos = Math.min(m.duration, pos + (Date.now() - m.updated) / 1000);
  return { m, playing, pos };
}
async function media(cmd) {
  if (cmd === 'playpause') { optimisticPlaying = !mediaState().playing; optimisticUntil = Date.now() + 2500; }
  try {
    const r = await fetch(API + '/api/media/' + cmd, { method: 'POST' });
    if (!r.ok) throw 0;
  } catch { toast(T('PC link offline')); }
  updateWidgets('media'); if (currentPage === 'media') updateMediaPage();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-media]'); if (b) media(b.dataset.media);
});

// ---------------------------------------------------------------- launcher
// Launcher items: { name, target, icon (built-in) | img (picture URL), color }
let defaultLaunchers = [];
async function loadLaunchers() {
  if (DEMO) {
    defaultLaunchers = [['steam', 'Steam', '#66c0f4'], ['discord', 'Discord', '#5865f2'], ['spotify', 'Spotify', '#1ed760'], ['globe', 'Browser', '#f5a524'], ['play', 'YouTube', '#ff3b3b'], ['folder', 'Files', '#ffd166']]
      .map(([icon, name, color]) => ({ icon, name, color, target: 'demo:' }));
    return;
  }
  try {
    defaultLaunchers = (await (await fetch(API + '/api/config')).json()).launchers.map(({ name, icon, color, target }) => ({ name, icon, color, target }));
  } catch { defaultLaunchers = []; }
}
const launcherItems = (inst) => inst.cfg.items || (inst.cfg.items = structuredClone(defaultLaunchers));
const launchIcon = (l) => l.img ? `<img src="${esc(l.img)}" alt="" draggable="false" onerror="this.replaceWith(Object.assign(document.createElement('b'),{className:'mono',textContent:${esc(JSON.stringify((l.name || '?').slice(0, 1).toUpperCase()))}}))">` : icon(l.icon || 'activity');
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-launch]'); if (!b || editing) return;
  b.classList.remove('fired'); void b.offsetWidth; b.classList.add('fired');
  try {
    const r = await fetch(API + '/api/launch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: b.dataset.launch }) });
    if (!r.ok) throw r.status;
    toast(`${T('Opening')} ${b.dataset.name}`);
  } catch (s) { toast(s === 400 ? `${T('Could not open')} ${b.dataset.name}` : T('PC link offline')); }
});

// ---------------------------------------------------------------- gauge
const ARC = 2 * Math.PI * 44 * .75, CIRC = 2 * Math.PI * 44;
const gauge = (key, name) => `
  <div class="gauge" data-g="${key}">
    <div class="ring">
      <svg viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="44" stroke-dasharray="${ARC} ${CIRC}"/>
      <circle class="bar" cx="50" cy="50" r="44" stroke-dasharray="${ARC} ${CIRC}" stroke-dashoffset="${ARC}"/></svg>
      <div class="val"><div><b>—</b><span></span></div></div>
    </div>
    <div class="name">${name}</div>
  </div>`;
function setGauge(root, key, pct, sub, warnAt = 75, hotAt = 90) {
  const g = $(`[data-g="${key}"]`, root); if (!g) return;
  const p = pct == null ? 0 : clamp(pct, 0, 100);
  $('.bar', g).setAttribute('stroke-dashoffset', ARC * (1 - p / 100));
  $('b', g).innerHTML = pct == null ? '—' : `${Math.round(p)}<small>%</small>`;
  $('span', g).textContent = sub || '';
  g.classList.toggle('warm', p >= warnAt && p < hotAt);
  g.classList.toggle('hot', p >= hotAt);
}

// ---------------------------------------------------------------- sparkline
function spark(canvas, series, { max = null, color = null, fill = true, second = null, color2 = null } = {}) {
  if (!canvas) return;
  const dpr = 1, w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
  const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, w, h);
  const cs = getComputedStyle(document.documentElement);
  const c1 = color || cs.getPropertyValue('--accent').trim();
  const c2 = color2 || cs.getPropertyValue('--accent-2').trim();
  const grid = cs.getPropertyValue('--stroke').trim();
  ctx.strokeStyle = grid; ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) { const y = Math.round(h * i / 4) + .5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  const all = second ? series.concat(second) : series;
  const m = max ?? Math.max(1, ...all) * 1.15;
  const draw = (s, c) => {
    if (s.length < 2) return;
    const n = Math.max(s.length, 40), step = w / (n - 1), x0 = w - (s.length - 1) * step;
    ctx.beginPath();
    s.forEach((v, i) => { const x = x0 + i * step, y = h - (v / m) * (h - 6) - 3; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
    if (fill) {
      ctx.lineTo(w, h); ctx.lineTo(x0, h); ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, c + '55'); g.addColorStop(1, c + '00');
      ctx.fillStyle = g; ctx.fill();
    }
  };
  draw(series, c1); if (second) draw(second, c2);
}

// ---------------------------------------------------------------- widgets
const W = {
  clock: {
    name: 'Clock & date', desc: 'Time, date, other cities', ico: 'focus', basis: 640,
    html: () => `<div class="card-label">${icon('focus')} ${T('Local time')} <span class="right" data-tz></span></div>
      <div class="time"><span class="hm" data-hm></span><span class="side"><span class="sec" data-s></span><span class="ampm" data-ap></span></span></div>
      <div class="others" data-others></div>
      <div class="date" data-date></div><div class="sub" data-sub></div>
      <div class="daybar"><i data-day></i></div>`,
    update(el) {
      const d = new Date(), p = fmtTime(d, undefined, { second: '2-digit' });
      $('[data-hm]', el).textContent = `${p.hour}:${p.minute}`;
      $('[data-s]', el).textContent = S.showSeconds ? p.second : '';
      $('[data-ap]', el).textContent = S.clock24 ? '' : (p.dayPeriod || '');
      const wd = d.toLocaleDateString(LOC(), { weekday: 'long' });
      $('[data-date]', el).innerHTML = `<b>${wd}</b>, ${d.toLocaleDateString(LOC(), { month: 'long', day: 'numeric', year: 'numeric' })}`;
      const start = new Date(d.getFullYear(), 0, 1);
      const doy = Math.floor((d - start) / 864e5) + 1;
      const week = Math.ceil((doy + start.getDay()) / 7);
      const ylen = new Date(d.getFullYear(), 1, 29).getDate() === 29 ? 366 : 365;
      $('[data-sub]', el).textContent = S.lang === 'tr' ? `${week}. hafta · Gün ${doy}/${ylen}` : `Week ${week} · Day ${doy} of ${ylen}`;
      const frac = (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
      $('[data-day]', el).style.width = (frac * 100).toFixed(2) + '%';
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      $('[data-tz]', el).textContent = localTz.replace(/_/g, ' ');
      // Two world clocks that differ from local time, e.g. Istanbul when you're in Charlotte.
      const localNow = tzHour(d, localTz);
      $('[data-others]', el).innerHTML = S.zones.filter(z => Math.abs(tzHour(d, z.tz) - localNow) > .01).slice(0, 2).map(z => {
        const q = fmtTime(d, z.tz);
        return `<div class="other"><div class="c"><i style="background:${dayPhaseColor(tzHour(d, z.tz))}"></i>${esc(z.city)} · ${tzOffsetLabel(z.tz)}</div>
          <b>${q.hour}:${q.minute}<small>${S.clock24 ? '' : q.dayPeriod}</small></b></div>`;
      }).join('');
    },
  },
  weather: {
    name: 'Weather', desc: 'Now and next hours', ico: 'pin', basis: 560,
    html: () => `<div class="card-label">${icon('pin')} <span data-loc class="ellipsis"></span><span class="right" data-hl></span></div>
      <div class="now"><div class="wx-icon" data-ic></div><div class="col" style="gap:4px;min-width:0">
        <div class="temp num" data-t>—</div><div class="cond ellipsis" data-c>${T('Loading…')}</div></div></div>
      <div class="meta" data-meta></div>
      <div class="hours" data-hours></div>
      <div class="second" data-w2></div>`,
    update(el) {
      $('[data-loc]', el).textContent = S.location.name;
      const w2 = $('[data-w2]', el);
      if (S.location2 && weather2?.current) {
        const c2 = weather2.current, [l2, k2] = WX[c2.weather_code] || ['—', 'cloud'];
        const p = weather2.timezone ? fmtTime(new Date(), weather2.timezone) : null;
        w2.style.display = '';
        w2.innerHTML = `<div class="wx-sm">${wxSvg(k2, c2.is_day)}</div>
          <div class="grow" style="min-width:0"><b>${esc(S.location2.name)}</b><div class="faint ellipsis">${T(l2)}${p ? ` · ${p.hour}:${p.minute}${S.clock24 ? '' : ' ' + p.dayPeriod}` : ''}</div></div>
          <div class="t2 num">${Math.round(c2.temperature_2m)}°</div>
          <div class="faint hl2">H ${Math.round(weather2.daily.temperature_2m_max[0])}°<br>L ${Math.round(weather2.daily.temperature_2m_min[0])}°</div>`;
      } else w2.style.display = 'none';
      if (!weather?.current) return;
      const c = weather.current, [label, kind] = WX[c.weather_code] || ['—', 'cloud'];
      $('[data-ic]', el).innerHTML = wxSvg(kind, c.is_day);
      $('[data-t]', el).innerHTML = `${Math.round(c.temperature_2m)}<sup>°${S.tempUnit}</sup>`;
      $('[data-c]', el).textContent = T(label);
      const dd = weather.daily;
      $('[data-hl]', el).textContent = `H ${Math.round(dd.temperature_2m_max[0])}°  L ${Math.round(dd.temperature_2m_min[0])}°`;
      $('[data-meta]', el).innerHTML = `<span>${T('Feels')} ${Math.round(c.apparent_temperature)}°</span>
        <span>${icon('drop')} ${c.relative_humidity_2m}%</span>
        <span>${icon('wind')} ${Math.round(c.wind_speed_10m)} ${S.tempUnit === 'F' ? 'mph' : 'km/h'}</span>`;
      const nowIso = weather.current.time.slice(0, 13);
      let i0 = weather.hourly.time.findIndex(t => t.slice(0, 13) === nowIso); if (i0 < 0) i0 = 0;
      const hours = [];
      for (let k = 1; k <= 6; k++) {
        const i = i0 + k * 2; if (i >= weather.hourly.time.length) break;
        const t = new Date(weather.hourly.time[i]);
        const hl = S.clock24 ? `${String(t.getHours()).padStart(2, '0')}:00` : t.toLocaleTimeString(LOC(), { hour: 'numeric' });
        hours.push(`<div class="hour">${hl}<div class="wx-sm">${wxSvg((WX[weather.hourly.weather_code[i]] || [])[1], weather.hourly.is_day[i])}</div><b>${Math.round(weather.hourly.temperature_2m[i])}°</b></div>`);
      }
      $('[data-hours]', el).innerHTML = hours.join('');
    },
  },
  system: {
    name: 'System monitor', desc: 'CPU, GPU, RAM, network', ico: 'cpu', basis: 640,
    html: () => `<div class="card-label">${icon('cpu')} ${T('System')} <span class="right" data-host></span></div>
      <div class="gauges">${gauge('cpu', 'CPU')}${gauge('gpu', 'GPU')}${gauge('ram', 'RAM')}</div>
      <div class="sys-foot">
        <div class="chip">${icon('arrow-down')}<b data-down>—</b><span class="faint" data-downu></span></div>
        <div class="chip">${icon('arrow-up')}<b data-up>—</b><span class="faint" data-upu></span></div>
      </div>`,
    update(el) {
      if (!stats) {
        setGauge(el, 'cpu', null, T('offline')); setGauge(el, 'gpu', null, T('offline')); setGauge(el, 'ram', null, T('offline'));
        $('[data-host]', el).textContent = T('PC link offline'); return;
      }
      $('[data-host]', el).textContent = stats.host;
      setGauge(el, 'cpu', stats.cpu.load, fmtTemp(stats.cpu.temp) || `${stats.cpu.cores.length} ${T('threads')}`);
      setGauge(el, 'gpu', stats.gpu?.load ?? null, fmtTemp(stats.gpu?.temp) || (stats.gpu ? '' : T('n/a')));
      setGauge(el, 'ram', stats.ram.used / stats.ram.total * 100, `${(stats.ram.used / 2 ** 30).toFixed(1)} / ${Math.round(stats.ram.total / 2 ** 30)} GB`, 80, 92);
      const [dv, du] = fmtRate(stats.net?.down), [uv, uu] = fmtRate(stats.net?.up);
      $('[data-down]', el).textContent = dv; $('[data-downu]', el).textContent = du;
      $('[data-up]', el).textContent = uv; $('[data-upu]', el).textContent = uu;
    },
  },
  media: {
    name: 'Now playing', desc: 'Music controls', ico: 'music', basis: 540,
    html: () => `<div class="card-label">${icon('music')} ${T('Now playing')} <span class="right" data-app></span></div>
      <div class="row" style="align-items:flex-start;gap:24px">
        <div class="art" data-art><div class="eq"><i></i><i></i><i></i><i></i></div></div>
        <div class="grow" style="min-width:0"><div class="title" data-title>${T('Nothing playing')}</div><div class="artist ellipsis" data-artist></div></div>
      </div>
      <div class="progress" style="margin-top:22px" data-pw><i data-prog style="width:0"></i></div>
      <div class="controls" style="margin-top:auto">
        <button class="ctl sm" data-media="voldown" aria-label="Volume down">${icon('voldown')}</button>
        <button class="ctl" data-media="prev" aria-label="Previous">${icon('prev')}</button>
        <button class="ctl main" data-media="playpause" aria-label="Play/Pause" data-pp>${icon('play')}</button>
        <button class="ctl" data-media="next" aria-label="Next">${icon('next')}</button>
        <button class="ctl sm" data-media="volup" aria-label="Volume up">${icon('volup')}</button>
      </div>`,
    update(el) {
      const { m, playing, pos } = mediaState();
      const art = $('[data-art]', el);
      art.style.background = artGradient((m?.title || '') + (m?.artist || ''));
      art.classList.toggle('playing', playing);
      $('[data-title]', el).textContent = m?.title || (stats ? T('Nothing playing') : T('PC link offline'));
      $('[data-artist]', el).textContent = m?.artist || (m ? '' : T('Play something on your PC'));
      $('[data-app]', el).textContent = appName(m?.app);
      $('[data-pw]', el).style.visibility = m?.duration ? 'visible' : 'hidden';
      if (m?.duration) $('[data-prog]', el).style.width = (pos / m.duration * 100) + '%';
      $('[data-pp]', el).innerHTML = icon(playing ? 'pause' : 'play');
    },
  },
  launcher: {
    name: 'App launcher', desc: 'Apps, games and websites', ico: 'activity', basis: 380, edit: editLauncher,
    basisOf: (inst) => { const n = launcherItems(inst).length; return n <= 6 ? 380 : n <= 12 ? 540 : 700; },
    html: (inst) => {
      const items = launcherItems(inst), n = items.length;
      const cols = n <= 1 ? 1 : n <= 6 ? 2 : n <= 12 ? 3 : 4;
      return `<div class="card-label">${icon('activity')} ${esc(inst.cfg.title || T('Launch'))}</div>
      <div class="launch-grid" style="grid-template-columns:repeat(${cols},1fr)">${items.map(l => /steamstatic/.test(l.img || '')
        ? `<button class="launch game" style="--bg:url('${esc(l.img)}')" data-launch="${esc(l.target)}" data-name="${esc(l.name)}"><span class="ellipsis">${esc(l.name)}</span></button>`
        : `<button class="launch ${n > 6 ? 'small' : ''}" style="--c:${esc(l.color || 'var(--accent)')}" data-launch="${esc(l.target)}" data-name="${esc(l.name)}">${launchIcon(l)}<span class="ellipsis">${esc(l.name)}</span></button>`).join('')
        || `<div class="empty-note">${icon('gear')}<span>${T('Tap the gear to add buttons')}</span></div>`}</div>`;
    },
    update() {},
  },
  web: {
    name: 'Website', desc: 'Any website, Twitch, a map…', ico: 'globe', basis: 760, edit: editWeb, isNew: true,
    html: (inst) => inst.cfg.url
      ? `<div class="frame-wrap"><iframe src="${esc(inst.cfg.url)}" style="--z:${inst.cfg.zoom || 1}" referrerpolicy="no-referrer"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"></iframe></div>`
      : `<div class="card-label">${icon('globe')} ${T('Website')}</div><div class="empty-note">${icon('gear')}<span>${T('Tap the gear to set a website')}</span></div>`,
    update() {},
  },
  photo: {
    name: 'Photos', desc: 'Your own photo slideshow', ico: 'image', basis: 560, edit: editPhoto, isNew: true,
    html: (inst) => (inst.cfg.srcs || []).length
      ? `<div class="slides" style="--fit:${inst.cfg.fit === 'contain' ? 'contain' : 'cover'}">${inst.cfg.srcs.map(s => `<img src="${esc(s)}" alt="" draggable="false">`).join('')}</div>`
      : `<div class="card-label">${icon('image')} ${T('Photos')}</div><div class="empty-note">${icon('gear')}<span>${T('Tap the gear to add photos')}</span></div>`,
    update(el, inst) {
      const imgs = $$('.slides img', el); if (!imgs.length) return;
      const i = Math.floor(Date.now() / 1000 / (inst.cfg.every || 10)) % imgs.length;
      imgs.forEach((im, k) => im.classList.toggle('on', k === i));
    },
  },
  countdown: {
    name: 'Countdown', desc: 'Days until an event', ico: 'hourglass', basis: 420, edit: editCountdown, isNew: true,
    html: (inst) => `<div class="card-label">${icon('hourglass')} <span class="ellipsis">${esc(inst.cfg.title || T('Countdown'))}</span></div>
      ${inst.cfg.date ? `<div class="cd-main num" data-cd></div><div class="cd-sub num" data-cs></div><div class="cd-when faint" data-cw></div>`
        : `<div class="empty-note">${icon('gear')}<span>${T('Tap the gear to set a date')}</span></div>`}`,
    update(el, inst) {
      if (!inst.cfg.date) return;
      const end = new Date(inst.cfg.date), ms = end - Date.now();
      const main = $('[data-cd]', el), sub = $('[data-cs]', el);
      $('[data-cw]', el).textContent = end.toLocaleString(LOC(), { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      if (ms <= 0) { main.textContent = ms > -864e5 ? T('Today!') : T('Ended'); sub.textContent = ''; return; }
      const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3);
      main.innerHTML = `${d}<small>${T('days')}</small>`;
      sub.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },
  },
  note: {
    name: 'Sticky note', desc: 'Quick text on the screen', ico: 'note', basis: 420, isNew: true,
    html: (inst) => `<textarea class="note-text" data-note="${esc(inst.uid)}" placeholder="${T('Write something…')}">${esc(inst.cfg.text || '')}</textarea>`,
    update() {},
  },
  calendar: {
    name: 'Calendar', desc: 'This month', ico: 'calendar', basis: 420,
    html: () => `<div class="cal-head"><b data-m></b><span class="faint" data-y></span></div><div class="cal" data-cal></div>`,
    update(el) {
      const d = new Date(), key = d.toDateString();
      if (el.dataset.k === key + S.lang) return; el.dataset.k = key + S.lang;
      $('[data-m]', el).textContent = d.toLocaleDateString(LOC(), { month: 'long' });
      $('[data-y]', el).textContent = d.getFullYear();
      const first = new Date(d.getFullYear(), d.getMonth(), 1), start = new Date(first); start.setDate(1 - first.getDay());
      let h = (S.lang === 'tr' ? ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S']).map(x => `<span class="dow">${x}</span>`).join('');
      for (let i = 0; i < 42; i++) {
        const c = new Date(start); c.setDate(start.getDate() + i);
        if (i >= 35 && c.getMonth() !== d.getMonth()) break;
        const cls = [c.getMonth() !== d.getMonth() && 'out', c.toDateString() === key && 'today', (c.getDay() % 6 === 0) && 'wknd'].filter(Boolean).join(' ');
        h += `<span class="${cls}">${c.getDate()}</span>`;
      }
      $('[data-cal]', el).innerHTML = h;
    },
  },
  world: {
    name: 'World clocks', desc: 'Up to 4 cities', ico: 'globe', basis: 440,
    html: () => `<div class="card-label">${icon('globe')} ${T('World')}</div><div class="zones" data-z></div>`,
    update(el) {
      const d = new Date();
      $('[data-z]', el).innerHTML = S.zones.slice(0, 4).map(z => {
        const p = fmtTime(d, z.tz), h = tzHour(d, z.tz);
        return `<div class="zone"><i class="phase" style="background:${dayPhaseColor(h)}"></i><div><div class="city">${esc(z.city)}</div><div class="off">${tzOffsetLabel(z.tz)}</div></div>
          <div class="t">${p.hour}:${p.minute}<small>${S.clock24 ? '' : p.dayPeriod}</small></div></div>`;
      }).join('');
    },
  },
  focus: {
    name: 'Focus timer', desc: 'Pomodoro shortcut', ico: 'focus', basis: 360,
    html: () => `<div class="card-label">${icon('focus')} ${T('Focus')}</div>
      <button class="col focus-mini grow" data-goto="focus"><div class="num" data-ft></div><div class="muted" data-fs></div></button>`,
    update(el) {
      $('[data-ft]', el).textContent = fmtDur(pomo.left());
      $('[data-fs]', el).textContent = pomo.running ? T(pomo.mode === 'work' ? 'Focusing' : 'On a break') : T('Tap to start');
    },
  },
};

// ---------------------------------------------------------------- home screen + edit mode
const SIZE = { s: .72, m: 1, l: 1.45 };
let editing = false;
const instOf = (uid) => S.home.find(h => h.uid === uid);

function renderHome() {
  const row = $('#homeRow');
  const scroll = row.scrollLeft;
  row.innerHTML = '';
  S.home.filter(h => W[h.type]).forEach((h, i, list) => {
    const def = W[h.type], el = document.createElement('div');
    const basis = (def.basisOf ? def.basisOf(h) : def.basis) * (SIZE[h.size] || 1);
    el.className = `card w-${h.type}`; el.dataset.w = h.type; el.dataset.uid = h.uid;
    el.style.flex = `1 1 ${basis}px`; el.style.minWidth = `${Math.round(basis * .62)}px`;
    el.innerHTML = def.html(h) + (editing ? `<div class="edit-bar">
        <button class="eb" data-ed-move="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move left">${icon('left')}</button>
        <div class="eb-size">${['s', 'm', 'l'].map(s => `<button data-ed-size="${s}" class="${(h.size || 'm') === s ? 'on' : ''}">${s.toUpperCase()}</button>`).join('')}</div>
        ${def.edit ? `<button class="eb" data-ed-cfg aria-label="Settings">${icon('gear')}</button>` : ''}
        <button class="eb danger" data-ed-del aria-label="${T('Remove widget')}">${icon('trash')}</button>
        <button class="eb" data-ed-move="1" ${i === list.length - 1 ? 'disabled' : ''} aria-label="Move right">${icon('right')}</button>
      </div>` : '');
    row.appendChild(el);
    def.update(el, h);
  });
  if (editing) {
    const add = document.createElement('button');
    add.className = 'card add-tile'; add.dataset.edAdd = '';
    add.innerHTML = `${icon('plus')}<span>${T('Add widget')}</span>`;
    row.appendChild(add);
  }
  row.scrollLeft = scroll;
  $('#stage').classList.toggle('editing', editing);
  $('#editDone span').textContent = T('Done');
  $('#editBtn').classList.toggle('active', editing);
}
function updateWidgets(type) {
  $$(`#homeRow [data-w${type ? `="${type}"` : ''}]`).forEach(el => {
    const inst = instOf(el.dataset.uid); if (inst) W[el.dataset.w].update(el, inst);
  });
}
function setEditing(on) {
  editing = on;
  if (on && currentPage !== 'home') go('home');
  renderHome();
}
$('#homeRow').addEventListener('click', (e) => {
  if (!editing) return;
  const card = e.target.closest('[data-uid]'), inst = card && instOf(card.dataset.uid);
  let b;
  if (e.target.closest('[data-ed-add]')) return openWidgetPicker();
  if (!inst) return;
  const i = S.home.indexOf(inst);
  if ((b = e.target.closest('[data-ed-move]'))) {
    const j = i + Number(b.dataset.edMove);
    if (j >= 0 && j < S.home.length) [S.home[i], S.home[j]] = [S.home[j], S.home[i]];
  } else if ((b = e.target.closest('[data-ed-size]'))) inst.size = b.dataset.edSize;
  else if (e.target.closest('[data-ed-del]')) S.home.splice(i, 1);
  else if (e.target.closest('[data-ed-cfg]')) return W[inst.type].edit(inst);
  else return;
  save(); renderHome();
});
$('#homeRow').addEventListener('input', (e) => {
  const n = e.target.closest('[data-note]'); if (!n) return;
  const inst = instOf(n.dataset.note); if (inst) { inst.cfg.text = n.value; save(); }
});
$('#editDone').addEventListener('click', () => setEditing(false));
// Long-press empty space on the home screen also enters edit mode.
let lp;
$('#homeRow').addEventListener('pointerdown', (e) => {
  if (editing || e.target.closest('button, input, textarea, iframe, a')) return;
  lp = setTimeout(() => setEditing(true), 900);
});
['pointerup', 'pointercancel', 'pointermove'].forEach(ev => $('#homeRow').addEventListener(ev, (e) => {
  if (ev !== 'pointermove' || Math.abs(e.movementX) + Math.abs(e.movementY) > 6) clearTimeout(lp);
}));

// ---------------------------------------------------------------- sheets (pop-up panels)
function openSheet(title, body, { onClose, wide } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet ${wide ? 'wide' : ''}"><div class="sheet-head"><b>${title}</b>
    <button class="btn-done" data-sheet-close>${icon('check')} ${T('Done')}</button></div><div class="sheet-body">${body}</div></div>`;
  stage.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  const close = () => { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 250); onClose && onClose(); };
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-sheet-close]')) close(); });
  return { el: $('.sheet-body', wrap), close };
}

function openWidgetPicker() {
  const types = Object.keys(W);
  const sh = openSheet(T('Add widget'), `<div class="pick-grid">${types.map(t => `<button class="pick" data-pick="${t}">
      <span class="pick-ico">${icon(W[t].ico || 'plus')}</span><b>${T(W[t].name)}</b><small>${T(W[t].desc || '')}</small>
      ${W[t].isNew ? '<em>NEW</em>' : ''}</button>`).join('')}</div>`, { wide: true });
  sh.el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]'); if (!b) return;
    const inst = { uid: Math.random().toString(36).slice(2, 9), type: b.dataset.pick, size: 'm', cfg: b.dataset.pick === 'launcher' ? { items: [] } : {} };
    S.home.push(inst); save(); renderHome(); sh.close();
    requestAnimationFrame(() => { const row = $('#homeRow'); row.scrollLeft = row.scrollWidth; });
    if (W[inst.type].edit) W[inst.type].edit(inst);
  });
}

// Shared form bits for widget editors
const field = (label, inner) => `<label class="fld"><span>${label}</span>${inner}</label>`;
const choice = (name, opts, cur) => `<div class="seg" data-choice="${name}">${opts.map(([v, l]) =>
  `<button type="button" data-v="${esc(v)}" class="${String(cur) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
function bindChoices(root, onPick) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-choice] [data-v]'); if (!b) return;
    const g = b.closest('[data-choice]');
    $$('[data-v]', g).forEach(x => x.classList.toggle('on', x === b));
    onPick(g.dataset.choice, b.dataset.v);
  });
}
const refresh = () => { save(); renderHome(); };

function editWeb(inst) {
  const c = inst.cfg;
  const sh = openSheet(T('Website'), `
    ${field(T('Address (URL)'), `<input class="field" data-url value="${esc(c.url || '')}" placeholder="https://www.twitch.tv/…" inputmode="url" enterkeyhint="done">`)}
    <div class="quick">${[['Twitch', 'https://www.twitch.tv/'], ['YouTube', 'https://www.youtube.com/embed/jfKfPfyJRdk'], ['Windy', 'https://embed.windy.com/embed2.html'], ['Google Maps', 'https://maps.google.com/maps?output=embed'], ['Clock', 'https://time.is/']]
      .map(([n, u]) => `<button class="pill" data-quick="${esc(u)}">${n}</button>`).join('')}</div>
    ${field(T('Zoom'), choice('zoom', [[.6, '60%'], [.8, '80%'], [1, '100%'], [1.25, '125%'], [1.5, '150%']], c.zoom || 1))}
    <p class="hint">${T('Some websites block being shown inside other pages.')}</p>`, { onClose: refresh });
  const url = $('[data-url]', sh.el);
  const norm = (u) => (u = u.trim()) && !/^https?:\/\//i.test(u) ? 'https://' + u : u;
  url.addEventListener('change', () => { c.url = norm(url.value); });
  sh.el.addEventListener('click', (e) => { const q = e.target.closest('[data-quick]'); if (q) { url.value = c.url = q.dataset.quick; } });
  bindChoices(sh.el, (k, v) => { c[k] = Number(v); });
  sh.el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { c.url = norm(url.value); sh.close(); } });
}

function editPhoto(inst) {
  const c = inst.cfg; c.srcs ||= [];
  const sh = openSheet(T('Photos'), `
    <div class="thumbs" data-thumbs></div>
    <label class="btn-xl upload">${icon('plus')} ${T('Add photos')}<input type="file" accept="image/*" multiple hidden data-file></label>
    ${field(T('Change every'), choice('every', [[5, '5 s'], [10, '10 s'], [30, '30 s'], [60, '1 min'], [300, '5 min']], c.every || 10))}
    ${field(T('Size'), choice('fit', [['cover', T('Fill')], ['contain', T('Fit')]], c.fit || 'cover'))}`, { onClose: refresh });
  const draw = () => { $('[data-thumbs]', sh.el).innerHTML = c.srcs.map((s, i) => `<div class="thumb"><img src="${esc(s)}" alt=""><button data-rm="${i}" aria-label="Remove">${icon('x')}</button></div>`).join(''); };
  draw();
  sh.el.addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (b) { c.srcs.splice(+b.dataset.rm, 1); draw(); save(); } });
  $('[data-file]', sh.el).addEventListener('change', async (e) => {
    for (const f of e.target.files) {
      toast(T('Uploading…'));
      try {
        const r = await (await fetch(API + '/api/upload', { method: 'POST', headers: { 'Content-Type': f.type }, body: f })).json();
        if (!r.ok) throw 0; c.srcs.push(r.src); draw(); save();
      } catch { toast(T('Upload failed')); }
    }
    e.target.value = '';
  });
  bindChoices(sh.el, (k, v) => { c[k] = k === 'every' ? Number(v) : v; });
}

function editCountdown(inst) {
  const c = inst.cfg;
  const sh = openSheet(T('Countdown'), `
    ${field(T('Title'), `<input class="field" data-title value="${esc(c.title || '')}" maxlength="40" placeholder="Birthday, vacation, game release…">`)}
    ${field(T('Date & time'), `<input class="field" type="datetime-local" data-date value="${esc(c.date || '')}">`)}`, { onClose: refresh });
  $('[data-title]', sh.el).addEventListener('input', (e) => { c.title = e.target.value; });
  $('[data-date]', sh.el).addEventListener('change', (e) => { c.date = e.target.value; });
}

// Launcher editor: current buttons on top, a picker of installed apps / Steam games / websites below.
const LAUNCH_ICONS = ['activity', 'globe', 'play', 'music', 'folder', 'steam', 'discord', 'spotify', 'gear', 'cpu', 'home', 'note', 'image', 'gamepad'];
const LAUNCH_COLORS = ['#f5b301', '#ff5a36', '#ff3b3b', '#ff4fd8', '#8a7dff', '#5865f2', '#2a8cff', '#3ee0c5', '#1ed760', '#ffffff'];
let appList = null;
function editLauncher(inst) {
  const items = launcherItems(inst);
  let tab = 'apps', query = '';
  const sh = openSheet(T('Launcher'), `
    <div class="sub-h" style="margin-top:0">${T('Buttons')}</div>
    <div class="cur-items" data-cur></div>
    <div class="tabs">${[['apps', T('Apps')], ['games', T('Steam games')], ['web', T('Website')]].map(([k, l]) => `<button class="pill" data-tab="${k}">${l}</button>`).join('')}
      <input class="field search" data-q placeholder="${T('Search…')}" enterkeyhint="search"></div>
    <div data-pane></div>`, { wide: true, onClose: refresh });
  const cur = $('[data-cur]', sh.el), pane = $('[data-pane]', sh.el);
  const drawCur = () => {
    cur.innerHTML = items.map((l, i) => `<div class="cur" style="--c:${esc(l.color || 'var(--accent)')}">${launchIcon(l)}<span class="ellipsis">${esc(l.name)}</span>
      <div class="cur-ctl"><button data-cmove="${i},-1" aria-label="Move left">${icon('left')}</button><button data-cdel="${i}" aria-label="Remove">${icon('x')}</button><button data-cmove="${i},1" aria-label="Move right">${icon('right')}</button></div></div>`).join('')
      || `<p class="hint">${T('Tap an app to add it.')}</p>`;
  };
  const add = (item) => { items.push(item); drawCur(); save(); toast(`${T('Added')} ${item.name}`); };
  const drawPane = async () => {
    $$('[data-tab]', sh.el).forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('[data-q]', sh.el).style.visibility = tab === 'web' ? 'hidden' : 'visible';
    if (tab === 'web') {
      pane.innerHTML = `<div class="web-form">
        ${field(T('Name'), `<input class="field" data-wn maxlength="24" placeholder="YouTube">`)}
        ${field(T('Address (URL)'), `<input class="field" data-wu placeholder="https://www.youtube.com" inputmode="url">`)}
        ${field(T('Icon'), `<div class="icon-pick" data-wi>${LAUNCH_ICONS.map((ic, i) => `<button type="button" data-ic="${ic}" class="${i === 1 ? 'on' : ''}">${icon(ic)}</button>`).join('')}</div>`)}
        ${field(T('Color'), `<div class="icon-pick" data-wc>${LAUNCH_COLORS.map((c, i) => `<button type="button" data-col="${c}" class="${i === 0 ? 'on' : ''}"><i style="background:${c}"></i></button>`).join('')}</div>`)}
        <button class="btn-xl" data-wadd>${icon('plus')} ${T('Add')}</button></div>`;
      return;
    }
    if (!appList) {
      pane.innerHTML = `<p class="hint">${T('Loading apps…')}</p>`;
      try { appList = await (await fetch(API + '/api/apps')).json(); } catch { appList = { apps: [], games: [] }; }
    }
    const list = (tab === 'games' ? appList.games : appList.apps).filter(a => a.name.toLowerCase().includes(query));
    pane.innerHTML = list.length ? `<div class="app-grid ${tab}">${list.map((a, i) => `<button class="app" data-app="${i}">
        ${tab === 'games' ? `<img class="hdr" src="${esc(a.img)}" alt="" loading="lazy">` : `<img src="${esc(a.img)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`}
        <span class="ellipsis">${esc(a.name)}</span></button>`).join('')}</div>`
      : `<p class="hint">${T(tab === 'games' ? 'No Steam games found.' : 'No apps found.')}</p>`;
    pane._list = list;
  };
  drawCur(); drawPane();
  $('[data-q]', sh.el).addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); drawPane(); });
  sh.el.addEventListener('click', (e) => {
    let b;
    if ((b = e.target.closest('[data-tab]'))) { tab = b.dataset.tab; drawPane(); }
    else if ((b = e.target.closest('[data-app]'))) {
      const a = pane._list[+b.dataset.app];
      add({ name: a.name.replace(/:.*$/, '').slice(0, 24), target: a.target, img: a.img, color: tab === 'games' ? '#66c0f4' : null });
    }
    else if ((b = e.target.closest('[data-cdel]'))) { items.splice(+b.dataset.cdel, 1); drawCur(); save(); }
    else if ((b = e.target.closest('[data-cmove]'))) {
      const [i, d] = b.dataset.cmove.split(',').map(Number), j = i + d;
      if (j >= 0 && j < items.length) { [items[i], items[j]] = [items[j], items[i]]; drawCur(); save(); }
    }
    else if ((b = e.target.closest('[data-ic], [data-col]'))) { $$('button', b.parentElement).forEach(x => x.classList.toggle('on', x === b)); }
    else if (e.target.closest('[data-wadd]')) {
      let u = $('[data-wu]', pane).value.trim(); const n = $('[data-wn]', pane).value.trim();
      if (!u || !n) return;
      if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
      add({ name: n, target: u, icon: $('[data-wi] .on', pane).dataset.ic, color: $('[data-wc] .on', pane).dataset.col });
      $('[data-wu]', pane).value = $('[data-wn]', pane).value = '';
    }
  });
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-goto]'); if (b) go(b.dataset.goto); });

// ---------------------------------------------------------------- system page
function renderSystemPage(full = true) {
  const pg = $('#page-system');
  if (full || !$('.sys-grid', pg)) {
    pg.innerHTML = `<div class="sys-grid">
      <div class="card"><div class="card-label">${icon('cpu')} ${T('Processor')} <span class="right ellipsis" data-cpum style="max-width:420px"></span></div>
        <div class="big-metric"><b data-cpu>—</b><small>%</small><span class="muted" style="margin-left:auto;font-size:28px" data-cput></span></div>
        <div class="cores" data-cores></div><canvas class="spark" data-sc></canvas></div>
      <div class="card"><div class="card-label">${icon('activity')} ${T('Graphics')} <span class="right ellipsis" data-gpum style="max-width:420px"></span></div>
        <div class="big-metric"><b data-gpu>—</b><small>%</small><span class="muted" style="margin-left:auto;font-size:28px" data-gput></span></div>
        <dl class="kv"><dt>VRAM</dt><dd data-vram>—</dd><dt>${T('Power')}</dt><dd data-pw>—</dd></dl><canvas class="spark" data-sg></canvas></div>
      <div class="card"><div class="card-label">${icon('globe')} ${T('Network')}</div>
        <div class="net-row"><div><span>${icon('arrow-down')} ${T('Download')}</span><b data-nd>—</b><small class="faint" data-ndu></small></div>
        <div><span>${icon('arrow-up')} ${T('Upload')}</span><b data-nu>—</b><small class="faint" data-nuu></small></div></div>
        <canvas class="spark" data-sn></canvas></div>
      <div class="card"><div class="card-label">${icon('folder')} ${T('Memory & storage')}</div>
        <div class="disk"><div class="row"><span>RAM</span><span class="muted" data-ramt></span></div><div class="bar"><i data-ramb></i></div></div>
        <div data-disks></div>
        <dl class="kv" style="margin-top:auto"><dt>${T('Uptime')}</dt><dd data-upt>—</dd></dl></div>
    </div>`;
  }
  if (!stats) {
    $('[data-cpum]', pg).textContent = T('PC link offline');
    $('[data-disks]', pg).innerHTML = `<p class="offline-note">${T('Run start.bat on the PC to stream live stats here.')}</p>`;
    return;
  }
  $('[data-cpum]', pg).textContent = stats.cpu.model || '';
  $('[data-cpu]', pg).textContent = Math.round(stats.cpu.load);
  $('[data-cput]', pg).textContent = fmtTemp(stats.cpu.temp) || '';
  $('[data-cores]', pg).innerHTML = stats.cpu.cores.map(c => `<i style="height:${Math.max(4, c)}%"></i>`).join('');
  $('[data-gpum]', pg).textContent = stats.gpu?.name || 'n/a';
  $('[data-gpu]', pg).textContent = stats.gpu ? Math.round(stats.gpu.load) : '—';
  $('[data-gput]', pg).textContent = fmtTemp(stats.gpu?.temp) || '';
  $('[data-vram]', pg).textContent = stats.gpu?.vramUsed ? `${fmtBytes(stats.gpu.vramUsed)}${stats.gpu.vramTotal ? ' / ' + fmtBytes(stats.gpu.vramTotal, 0) : ''}` : '—';
  $('[data-pw]', pg).textContent = stats.gpu?.power ? `${Math.round(stats.gpu.power)} W` : '—';
  const [dv, du] = fmtRate(stats.net?.down), [uv, uu] = fmtRate(stats.net?.up);
  $('[data-nd]', pg).textContent = dv; $('[data-ndu]', pg).textContent = du;
  $('[data-nu]', pg).textContent = uv; $('[data-nuu]', pg).textContent = uu;
  const rp = stats.ram.used / stats.ram.total * 100;
  $('[data-ramt]', pg).textContent = `${fmtBytes(stats.ram.used)} / ${fmtBytes(stats.ram.total, 0)}`;
  $('[data-ramb]', pg).style.width = rp + '%';
  $('[data-disks]', pg).innerHTML = (stats.disks || []).slice(0, 4).map(d => {
    const used = d.size - d.free;
    return `<div class="disk"><div class="row"><span>${esc(d.name)} ${esc(d.label || '')}</span><span class="muted">${fmtBytes(d.free, d.free >= 2 ** 40 ? 1 : 0)} ${T('free')}</span></div>
      <div class="bar"><i style="width:${used / d.size * 100}%"></i></div></div>`;
  }).join('');
  $('[data-upt]', pg).textContent = fmtUptime(stats.uptime);
  spark($('[data-sc]', pg), hist.cpu, { max: 100 });
  spark($('[data-sg]', pg), hist.gpu, { max: 100 });
  spark($('[data-sn]', pg), hist.down, { second: hist.up });
}

// ---------------------------------------------------------------- media page
function renderMediaPage() {
  $('#page-media').innerHTML = `<div class="media-page">
    <div class="art" data-art><div class="eq"><i></i><i></i><i></i><i></i></div></div>
    <div class="card info"><div class="card-label" data-app>${T('Now playing')}</div>
      <div class="title" data-title></div><div class="artist" data-artist></div>
      <div class="progress" data-pw><i data-prog></i></div><div class="times" data-times><span data-pos></span><span data-dur></span></div>
      <div class="controls">
        <button class="ctl" data-media="prev" aria-label="Previous">${icon('prev')}</button>
        <button class="ctl main" data-media="playpause" aria-label="Play/Pause" data-pp>${icon('play')}</button>
        <button class="ctl" data-media="next" aria-label="Next">${icon('next')}</button>
      </div></div>
    <div class="card vol"><div class="card-label">${T('Volume')}</div>
      <button class="ctl" data-media="volup" aria-label="Volume up">${icon('volup')}</button>
      <button class="ctl" data-media="mute" aria-label="Mute">${icon('mute')}</button>
      <button class="ctl" data-media="voldown" aria-label="Volume down">${icon('voldown')}</button>
    </div></div>`;
  updateMediaPage();
}
function updateMediaPage() {
  const pg = $('#page-media'); if (!$('.media-page', pg)) return;
  const { m, playing, pos } = mediaState();
  const art = $('[data-art]', pg);
  art.style.background = artGradient((m?.title || '') + (m?.artist || ''));
  art.classList.toggle('playing', playing);
  $('[data-title]', pg).textContent = m?.title || (stats ? T('Nothing playing') : T('PC link offline'));
  $('[data-artist]', pg).textContent = [m?.artist, m?.album].filter(Boolean).join(' — ');
  $('[data-app]', pg).textContent = m ? `${T('Now playing')} · ${appName(m.app)}` : T('Now playing');
  const hasDur = !!m?.duration;
  $('[data-pw]', pg).style.visibility = hasDur ? 'visible' : 'hidden';
  $('[data-times]', pg).style.visibility = hasDur ? 'visible' : 'hidden';
  if (hasDur) {
    $('[data-prog]', pg).style.width = (pos / m.duration * 100) + '%';
    $('[data-pos]', pg).textContent = fmtDur(pos); $('[data-dur]', pg).textContent = fmtDur(m.duration);
  }
  $('[data-pp]', pg).innerHTML = icon(playing ? 'pause' : 'play');
}

// ---------------------------------------------------------------- focus / pomodoro
const pomo = {
  mode: 'work', running: false, endAt: 0, remaining: null, sessions: 0,
  total() { return (this.mode === 'work' ? S.pomo.work : S.pomo.brk) * 60; },
  left() { if (this.remaining == null) this.remaining = this.total(); return this.running ? Math.max(0, (this.endAt - Date.now()) / 1000) : this.remaining; },
  toggle() {
    if (this.running) { this.remaining = this.left(); this.running = false; }
    else { this.endAt = Date.now() + this.left() * 1000; this.running = true; unlockAudio(); }
  },
  reset() { this.running = false; this.remaining = this.total(); },
  switchTo(mode) { this.mode = mode; this.reset(); },
  tick() {
    if (this.running && this.left() <= 0) {
      chime();
      if (this.mode === 'work') this.sessions++;
      this.mode = this.mode === 'work' ? 'break' : 'work';
      this.remaining = this.total(); this.endAt = Date.now() + this.remaining * 1000;
      toast(T(this.mode === 'work' ? 'Break over — back to it' : 'Nice work — take a break'));
    }
  },
};
let audioCtx;
function unlockAudio() { try { audioCtx ||= new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch {} }
function chime() {
  if (!audioCtx) return;
  [0, .18, .36].forEach((t, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = [880, 1175, 1568][i]; o.type = 'sine';
    g.gain.setValueAtTime(0, audioCtx.currentTime + t);
    g.gain.linearRampToValueAtTime(.25, audioCtx.currentTime + t + .02);
    g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + t + .9);
    o.connect(g).connect(audioCtx.destination); o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 1);
  });
}
const POMO_C = 2 * Math.PI * 46;
function renderFocusPage() {
  const pg = $('#page-focus');
  pg.innerHTML = `<div class="focus-page">
    <div class="card pomo">
      <div class="pomo-ring" data-ring><svg viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="46"/>
        <circle class="bar" cx="50" cy="50" r="46" stroke-dasharray="${POMO_C}" stroke-dashoffset="0" data-bar/></svg>
        <div class="center"><b data-t></b><span data-m></span></div></div>
      <div class="pomo-side">
        <div class="pill-group">
          <button class="pill" data-pmode="work">${T('Focus')}</button><button class="pill" data-pmode="break">${T('Break')}</button>
        </div>
        <div class="pill-group" data-presets>${[[25, 5], [50, 10], [90, 15], [15, 3]].map(([w, b]) =>
          `<button class="pill" data-preset="${w},${b}">${w}/${b}</button>`).join('')}</div>
        <div class="sessions" data-sess></div>
        <div style="flex:1"></div>
        <button class="btn-xl" data-ptoggle></button>
        <button class="btn-xl ghost" data-preset-reset>${icon('reset')} ${T('Reset')}</button>
      </div>
    </div>
    <div class="card"><div class="card-label">${icon('check')} ${T('To-do')} <span class="right" data-tc></span></div>
      <div class="todo-list" data-todos></div>
      <form class="add-row" data-addtodo><input class="field" placeholder="${T('Add a task…')}" maxlength="120" enterkeyhint="done"><button class="icon-btn" aria-label="Add">${icon('plus')}</button></form>
    </div>
    <div class="card"><div class="card-label">${T('Notes')}</div>
      <textarea class="notes" data-notes placeholder="${T('Tap to write a note…')}">${esc(S.notes)}</textarea></div>
  </div>`;
  renderTodos(); updateFocus();
  $('[data-notes]', pg).addEventListener('input', e => { S.notes = e.target.value; save(); });
  $('[data-addtodo]', pg).addEventListener('submit', e => {
    e.preventDefault(); const inp = $('input', e.target), t = inp.value.trim();
    if (t) { S.todos.push({ t, d: false }); inp.value = ''; save(); renderTodos(); }
  });
  pg.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-ptoggle]')) { pomo.toggle(); updateFocus(); }
    else if (t.closest('[data-preset-reset]')) { pomo.reset(); updateFocus(); }
    else if (t.closest('[data-pmode]')) { pomo.switchTo(t.closest('[data-pmode]').dataset.pmode); updateFocus(); }
    else if (t.closest('[data-preset]')) {
      const [w, b] = t.closest('[data-preset]').dataset.preset.split(',').map(Number);
      S.pomo = { work: w, brk: b }; save(); pomo.reset(); updateFocus();
    }
    else if (t.closest('[data-tdel]')) { S.todos.splice(+t.closest('[data-tdel]').dataset.tdel, 1); save(); renderTodos(); }
    else if (t.closest('[data-ttog]')) { const i = +t.closest('[data-ttog]').dataset.ttog; S.todos[i].d = !S.todos[i].d; save(); renderTodos(); }
  });
}
function renderTodos() {
  const pg = $('#page-focus'), list = $('[data-todos]', pg); if (!list) return;
  list.innerHTML = S.todos.map((x, i) => `<div class="todo ${x.d ? 'done' : ''}">
    <button class="box" data-ttog="${i}" aria-label="Toggle">${icon('check')}</button>
    <button class="txt ellipsis" data-ttog="${i}" style="text-align:left">${esc(x.t)}</button>
    <button class="del" data-tdel="${i}" aria-label="Delete">${icon('x')}</button></div>`).join('')
    || `<p class="faint" style="font-size:20px;padding:12px 4px">${T('No tasks. Add one below.')}</p>`;
  $('[data-tc]', pg).textContent = `${S.todos.filter(x => x.d).length}/${S.todos.length}`;
}
function updateFocus() {
  const pg = $('#page-focus'); if (!$('[data-ring]', pg)) return;
  const left = pomo.left(), tot = pomo.total();
  $('[data-t]', pg).textContent = fmtDur(left);
  $('[data-m]', pg).textContent = T(pomo.mode === 'work' ? 'Focus' : 'Break');
  $('[data-bar]', pg).setAttribute('stroke-dashoffset', POMO_C * (1 - left / tot));
  $('[data-ring]', pg).classList.toggle('break', pomo.mode !== 'work');
  $('[data-ptoggle]', pg).innerHTML = pomo.running ? `${icon('pause')} ${T('Pause')}` : `${icon('play')} ${T(left < tot ? 'Resume' : 'Start')}`;
  $$('[data-pmode]', pg).forEach(b => b.classList.toggle('on', b.dataset.pmode === pomo.mode));
  $$('[data-preset]', pg).forEach(b => b.classList.toggle('on', b.dataset.preset === `${S.pomo.work},${S.pomo.brk}`));
  $('[data-sess]', pg).innerHTML = Array.from({ length: 4 }, (_, i) => `<i class="${i < pomo.sessions % 4 || (pomo.sessions && pomo.sessions % 4 === 0) ? 'done' : ''}"></i>`).join('');
}

// ---------------------------------------------------------------- world page
function analog(h) {
  const m = (h % 1) * 60, ha = (h % 12) / 12 * 360, ma = m / 60 * 360;
  const ticks = Array.from({ length: 12 }, (_, i) => { const a = i * 30 * Math.PI / 180;
    return `<line x1="${50 + Math.sin(a) * 40}" y1="${50 - Math.cos(a) * 40}" x2="${50 + Math.sin(a) * 44}" y2="${50 - Math.cos(a) * 44}" stroke="var(--text-3)" stroke-width="2"/>`; }).join('');
  return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" stroke="var(--stroke)" stroke-width="2"/>${ticks}
    <line x1="50" y1="50" x2="50" y2="26" stroke="var(--text)" stroke-width="4" transform="rotate(${ha} 50 50)"/>
    <line x1="50" y1="50" x2="50" y2="14" stroke="var(--accent)" stroke-width="2.5" transform="rotate(${ma} 50 50)"/>
    <circle cx="50" cy="50" r="3.5" fill="var(--accent)" stroke="none"/></svg>`;
}
function renderWorldPage() {
  const d = new Date();
  $('#page-world').innerHTML = `<div class="world-page">${S.zones.map(z => {
    const p = fmtTime(d, z.tz), h = tzHour(d, z.tz);
    const day = h >= 6.5 && h < 19;
    const sky = day ? 'radial-gradient(600px 300px at 80% 0%, rgba(255,190,80,.18), transparent 70%)'
                    : 'radial-gradient(600px 300px at 80% 0%, rgba(90,110,255,.16), transparent 70%)';
    return `<div class="card world-card"><div class="sky" style="background:${sky}"></div>
      <div class="analog">${analog(h)}</div>
      <div class="city">${esc(z.city)}</div><div class="tz">${tzOffsetLabel(z.tz)} · ${T(day ? 'Day' : 'Night')}</div>
      <div class="t">${p.hour}:${p.minute}<small>${S.clock24 ? '' : p.dayPeriod}</small></div>
      <div class="d">${d.toLocaleDateString(LOC(), { weekday: 'long', month: 'short', day: 'numeric', timeZone: z.tz })}</div></div>`;
  }).join('')}</div>`;
}

// ---------------------------------------------------------------- settings page
const THEMES = [
  ['obsidian', 'Obsidian', '#08090b', ['#f5b301', '#ff7a1a']],
  ['aurora', 'Aurora', '#050a14', ['#3ee0c5', '#8a7dff']],
  ['synthwave', 'Synthwave', '#0d0518', ['#ff4fd8', '#29d9ff']],
  ['ember', 'Ember', '#0c0606', ['#ff5a36', '#ffb347']],
  ['terminal', 'Terminal', '#020403', ['#3cff78', '#b6ff3c']],
  ['paper', 'Paper', '#f1eee8', ['#e2531c', '#2a6df4']],
];
const ACCENTS = [null, '#f5b301', '#ff5a36', '#ff4fd8', '#8a7dff', '#2a8cff', '#3ee0c5', '#3cff78', '#ffffff'];
const ZONE_CHOICES = [
  ['Honolulu', 'Pacific/Honolulu'], ['Anchorage', 'America/Anchorage'], ['Los Angeles', 'America/Los_Angeles'], ['Denver', 'America/Denver'],
  ['Chicago', 'America/Chicago'], ['New York', 'America/New_York'], ['São Paulo', 'America/Sao_Paulo'], ['London', 'Europe/London'],
  ['Paris', 'Europe/Paris'], ['Berlin', 'Europe/Berlin'], ['Istanbul', 'Europe/Istanbul'], ['Dubai', 'Asia/Dubai'],
  ['Mumbai', 'Asia/Kolkata'], ['Singapore', 'Asia/Singapore'], ['Seoul', 'Asia/Seoul'], ['Tokyo', 'Asia/Tokyo'], ['Sydney', 'Australia/Sydney'],
];
const hourLabel = (h) => S.clock24 ? `${String(h).padStart(2, '0')}:00` : `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
const seg = (key, opts, cur) => `<div class="seg">${opts.map(([v, l]) => `<button data-set="${key}" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
const tog = (key, on) => `<button class="toggle ${on ? 'on' : ''}" data-tog="${key}" aria-label="Toggle"></button>`;

function renderSettings() {
  const pg = $('#page-settings');
  const scroll = $$('.card', pg).map(c => c.scrollTop);
  pg.innerHTML = `<div class="settings-page">
    <div class="card"><div class="sub-h">${T('Language')}</div>
      <div class="set-row"><div>Language / Dil</div>${seg('lang', [['en', 'English'], ['tr', 'Türkçe']], S.lang)}</div>
      <div class="sub-h">${T('Theme')}</div>
      <div class="themes">${THEMES.map(([id, nm, bg, [a, b]]) => `<button class="theme-tile ${S.theme === id ? 'on' : ''}" data-theme-pick="${id}" style="background:${bg};color:${id === 'paper' ? '#1b1a17' : '#fff'}">
        <span style="position:absolute;inset:0;background:radial-gradient(160px 90px at 100% 0%, ${a}44, transparent)"></span>
        <b>${nm}</b><span class="sw"><i style="background:${a}"></i><i style="background:${b}"></i></span></button>`).join('')}</div>
      <div class="sub-h">${T('Accent color')}</div>
      <div class="accents">${ACCENTS.map(c => `<button class="accent-dot ${S.accent === c ? 'on' : ''}" data-accent="${c || ''}" aria-label="${c || T('Theme default')}">
        <i style="background:${c || 'conic-gradient(var(--accent), var(--accent-2), var(--accent))'}"></i></button>`).join('')}</div>
      <div class="sub-h">${T('Display')}</div>
      <div class="set-row"><div>${T('Background glow')}</div>${tog('glow', S.glow)}</div>
      <div class="set-row"><div>${T('Night dimming')}<div class="hint">${T('Lowers brightness overnight. Tap to wake.')}</div></div>${tog('dim.on', S.dim.on)}</div>
      ${S.dim.on ? `<div class="set-row"><div>${T('Dim from')}</div>${seg('dim.from', [[20, hourLabel(20)], [21, hourLabel(21)], [22, hourLabel(22)], [23, hourLabel(23)], [0, hourLabel(0)]], S.dim.from)}</div>
      <div class="set-row"><div>${T('Until')}</div>${seg('dim.to', [[5, hourLabel(5)], [6, hourLabel(6)], [7, hourLabel(7)], [8, hourLabel(8)], [9, hourLabel(9)]], S.dim.to)}</div>` : ''}
      <div class="set-row"><div>${T('Idle screensaver')}<div class="hint">${T('Black screen with a drifting clock.')}</div></div>${tog('saver.on', S.saver.on)}</div>
      ${S.saver.on ? `<div class="set-row"><div>${T('After')}</div>${seg('saver.minutes', [[5, '5 min'], [15, '15 min'], [30, '30 min'], [60, '1 h']], S.saver.minutes)}</div>` : ''}
    </div>
    <div class="card"><div class="sub-h">${T('Home screen widgets')}</div>
      <button class="btn-xl" data-customize>${icon('edit')} ${T('Customize home screen')}</button>
      <p class="hint" style="margin-top:10px">${T('Add, remove, resize and reorder widgets.')}</p>
      <div class="sub-h">${T('Game mode')}</div>
      <div class="set-row"><div>${T('Game mode')}<div class="hint">${T('Locks the mouse to the game screen so it can’t slip onto the Edge. Touch still works. Auto: only while a game is full screen.')}</div></div>
        ${seg('gameMode', [['off', T('Off')], ['auto', T('Auto')], ['on', T('On')]], S.gameMode)}</div>
      <div class="sub-h">${T('Format')}</div>
      <div class="set-row"><div>${T('Clock')}</div>${seg('clock24', [[false, T('12-hour')], [true, T('24-hour')]], S.clock24)}</div>
      <div class="set-row"><div>${T('Show seconds')}</div>${tog('showSeconds', S.showSeconds)}</div>
      <div class="set-row"><div>${T('Temperature')}</div>${seg('tempUnit', [['F', '°F'], ['C', '°C']], S.tempUnit)}</div>
    </div>
    <div class="card"><div class="sub-h">${T('Weather location')}</div>
      <div class="set-row"><div>${esc(S.location.name)}<div class="hint">${esc(S.location.admin || '')}</div></div>${icon('pin')}</div>
      <form class="add-row" data-citysearch="location"><input class="field" placeholder="${T('Search a city…')}" enterkeyhint="search"><button class="icon-btn" aria-label="Search">${icon('globe')}</button></form>
      <div class="search-results" data-results="location"></div>
      <div class="sub-h">${T('Second city')}</div>
      <div class="set-row"><div>${esc(S.location2?.name || T('None'))}<div class="hint">${esc(S.location2?.admin || T('Shown under the main forecast'))}</div></div>${S.location2 ? `<button class="icon-btn ghost" data-loc2-clear aria-label="Remove">${icon('x')}</button>` : ''}</div>
      <form class="add-row" data-citysearch="location2"><input class="field" placeholder="${T('Search a city…')}" enterkeyhint="search"><button class="icon-btn" aria-label="Search">${icon('globe')}</button></form>
      <div class="search-results" data-results="location2"></div>
      <div class="sub-h">${T('World clocks')}</div>
      <div class="widget-list">${S.zones.map((z, i) => `<div class="widget-item"><span class="nm">${esc(z.city)} <span class="faint">${tzOffsetLabel(z.tz)}</span></span>
        <button class="icon-btn ghost" data-zdel="${i}" aria-label="Remove">${icon('x')}</button></div>`).join('')}</div>
      <div class="add-row"><select class="field" data-zadd><option value="">${T('Add a city…')}</option>${ZONE_CHOICES.filter(([, tz]) => !S.zones.find(z => z.tz === tz))
        .map(([c, tz]) => `<option value="${tz}">${c}</option>`).join('')}</select></div>
      <div class="sub-h">${T('About')}</div>
      <p class="faint" style="font-size:17px;line-height:1.6">Edge Deck · 2560×720 · ${stats ? T('Linked to') + ' ' + esc(stats.host) : T('PC link offline')}</p>
    </div>
  </div>`;
  $$('.card', pg).forEach((c, i) => c.scrollTop = scroll[i] || 0);
}
function setPath(path, val) {
  const ks = path.split('.'); let o = S;
  while (ks.length > 1) o = o[ks.shift()];
  o[ks[0]] = val;
}
const getPath = (path) => path.split('.').reduce((o, k) => o?.[k], S);

// ---------------------------------------------------------------- game mode
async function setGameMode(mode, quiet) {
  S.gameMode = mode; save();
  try { await fetch(API + '/api/gamemode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) }); }
  catch { if (!quiet) toast(T('PC link offline')); return; }
  if (!quiet) toast(T(mode === 'on' ? 'Game mode on — mouse locked to the game screen' : mode === 'auto' ? 'Game mode: automatic' : 'Game mode off'));
  updateGameBtn();
}
function updateGameBtn() {
  const b = $('#gameBtn'), g = stats?.game;
  b.classList.toggle('on', !!g?.active);
  b.dataset.mode = S.gameMode;
  $('.badge', b).textContent = S.gameMode === 'auto' ? 'A' : S.gameMode === 'on' ? 'ON' : '';
  b.title = `${T('Game mode')}: ${T(S.gameMode === 'on' ? 'On' : S.gameMode === 'auto' ? 'Auto' : 'Off')}${g?.game ? ' · ' + g.game : ''}`;
}
// Rail button: switch between "always on" and the usual automatic mode.
$('#gameBtn').addEventListener('click', () => setGameMode(S.gameMode === 'on' ? 'auto' : 'on'));
$('#editBtn').addEventListener('click', () => setEditing(!editing));
function settingsChanged(kind) {
  save(); applyTheme(); renderSettings();
  if (kind !== 'appearance') renderHome();
  if (kind === 'weather') loadWeather();
  checkDim();
}
$('#page-settings').addEventListener('click', (e) => {
  const t = e.target;
  let b;
  if ((b = t.closest('[data-theme-pick]'))) { S.theme = b.dataset.themePick; S.accent = null; settingsChanged('appearance'); }
  else if ((b = t.closest('[data-accent]'))) { S.accent = b.dataset.accent || null; settingsChanged('appearance'); }
  else if ((b = t.closest('[data-tog]'))) { setPath(b.dataset.tog, !getPath(b.dataset.tog)); settingsChanged(); }
  else if ((b = t.closest('[data-set]'))) {
    let v = b.dataset.v; v = v === 'true' ? true : v === 'false' ? false : isNaN(v) ? v : Number(v);
    const unitChanged = b.dataset.set === 'tempUnit' && S.tempUnit !== v;
    setPath(b.dataset.set, v); settingsChanged(unitChanged ? 'weather' : undefined);
    if (b.dataset.set === 'gameMode') setGameMode(v);
  }
  else if (t.closest('[data-customize]')) setEditing(true);
  else if ((b = t.closest('[data-zdel]'))) { S.zones.splice(+b.dataset.zdel, 1); settingsChanged(); }
  else if ((b = t.closest('[data-city]'))) {
    const key = b.dataset.target === 'location2' ? 'location2' : 'location';
    S[key] = JSON.parse(b.dataset.city); toast(`${T('Weather:')} ${S[key].name}`); settingsChanged('weather');
  }
  else if (t.closest('[data-loc2-clear]')) { S.location2 = null; settingsChanged('weather'); }
});
$('#page-settings').addEventListener('change', (e) => {
  if (e.target.matches('[data-zadd]') && e.target.value) {
    const c = ZONE_CHOICES.find(([, tz]) => tz === e.target.value);
    S.zones.push({ city: c[0], tz: c[1] }); settingsChanged();
  }
});
$('#page-settings').addEventListener('submit', async (e) => {
  if (!e.target.matches('[data-citysearch]')) return;
  e.preventDefault();
  const q = $('input', e.target).value.trim(); if (!q) return;
  const target = e.target.dataset.citysearch;
  const box = $(`[data-results="${target}"]`, $('#page-settings'));
  box.innerHTML = `<p class="faint" style="font-size:18px">${T('Searching…')}</p>`;
  try {
    const r = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=${S.lang}`)).json();
    box.innerHTML = (r.results || []).map(c => {
      const loc = { name: c.name, admin: [c.admin1, c.country].filter(Boolean).join(', '), lat: c.latitude, lon: c.longitude };
      return `<button data-target="${target}" data-city='${esc(JSON.stringify(loc))}'>${esc(c.name)}<small>${esc(loc.admin)}</small></button>`;
    }).join('') || `<p class="faint" style="font-size:18px">${T('No matches.')}</p>`;
  } catch { box.innerHTML = `<p class="faint" style="font-size:18px">${T('Search failed — check the internet connection.')}</p>`; }
});

// ---------------------------------------------------------------- navigation
const ORDER = ['home', 'system', 'media', 'focus', 'world', 'settings'];
let currentPage = 'home';
function go(page) {
  if (page !== 'home' && editing) { editing = false; renderHome(); }
  currentPage = page;
  $$('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
  $$('.rail-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  if (page === 'system') renderSystemPage(true);
  if (page === 'media') renderMediaPage();
  if (page === 'focus') renderFocusPage();
  if (page === 'world') renderWorldPage();
  if (page === 'settings') renderSettings();
  if (page === 'home') updateWidgets();
  try { sessionStorage.setItem('edgeDeckPage', page); } catch {}
}
$('#rail').addEventListener('click', (e) => { const b = e.target.closest('[data-page]'); if (b) go(b.dataset.page); });

// Horizontal swipe between pages.
let sw = null;
$('#pages').addEventListener('pointerdown', (e) => {
  if (editing || e.target.closest('input, textarea, select, iframe, .todo-list, .settings-page .card, .sheet-wrap')) return;
  const row = e.target.closest('.home-row'); if (row && row.scrollWidth > row.clientWidth + 4) return;
  sw = { x: e.clientX, y: e.clientY, t: Date.now() };
});
addEventListener('pointerup', (e) => {
  if (!sw) return;
  const dx = e.clientX - sw.x, dy = e.clientY - sw.y, dt = Date.now() - sw.t; sw = null;
  const scale = stage.getBoundingClientRect().width / 2560;
  if (Math.abs(dx) / scale > 220 && Math.abs(dx) > Math.abs(dy) * 2 && dt < 700) {
    const i = ORDER.indexOf(currentPage) + (dx < 0 ? 1 : -1);
    if (i >= 0 && i < ORDER.length) go(ORDER[i]);
  }
});

// ---------------------------------------------------------------- dimming + screensaver
let wakeUntil = 0, lastInput = Date.now();
function inDimWindow() {
  if (!S.dim.on) return false;
  const h = new Date().getHours(), { from, to } = S.dim;
  return from > to ? (h >= from || h < to) : (h >= from && h < to);
}
function checkDim() { stage.classList.toggle('dimmed', inDimWindow() && Date.now() > wakeUntil); }
const saver = document.createElement('div'); saver.id = 'saver'; saver.innerHTML = '<div class="s-time"></div>'; stage.appendChild(saver);
function moveSaver() {
  const t = $('.s-time', saver), p = fmtTime(new Date());
  t.textContent = `${p.hour}:${p.minute}`;
  t.style.left = (80 + Math.random() * 1800) + 'px'; t.style.top = (40 + Math.random() * 440) + 'px';
}
function checkSaver() {
  const on = S.saver.on && Date.now() - lastInput > S.saver.minutes * 60e3;
  if (on && !saver.classList.contains('on')) moveSaver();
  saver.classList.toggle('on', on);
}
addEventListener('pointerdown', (e) => {
  lastInput = Date.now();
  if (saver.classList.contains('on')) { saver.classList.remove('on'); e.stopPropagation(); e.preventDefault(); }
  if (stage.classList.contains('dimmed')) { wakeUntil = Date.now() + 90e3; checkDim(); }
}, true);

// ---------------------------------------------------------------- boot
async function boot() {
  fit();
  await loadSettings();
  applyTheme();
  await loadLaunchers();
  renderHome();
  if (!DEMO) setGameMode(S.gameMode, true);
  if (DEMO) { pomo.remaining = 17 * 60 + 42; pomo.sessions = 2; }
  let start = params.get('page') || 'home'; try { start = params.get('page') || sessionStorage.getItem('edgeDeckPage') || 'home'; } catch {}
  go(ORDER.includes(start) ? start : 'home');
  if (params.has('edit')) setEditing(true);
  if (params.get('sheet') === 'widgets') openWidgetPicker();
  pollStats(); setInterval(pollStats, 1500);
  loadWeather(); setInterval(loadWeather, 15 * 60e3);
  setInterval(() => {
    ['clock', 'world', 'calendar', 'focus', 'photo', 'countdown'].forEach(updateWidgets);
    pomo.tick(); if (currentPage === 'focus') updateFocus();
    if (currentPage === 'media') updateMediaPage();
  }, 1000);
  setInterval(() => { if (currentPage === 'world') renderWorldPage(); }, 15e3);
  setInterval(() => { checkDim(); checkSaver(); }, 10e3); checkDim();
  setInterval(() => { if (saver.classList.contains('on')) moveSaver(); }, 30e3);
}
boot();
})();
