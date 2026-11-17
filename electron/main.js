// Maturitní deska – desktopová aplikace (Electron)
const { app, BrowserWindow, ipcMain, shell, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');

let Anthropic = null;
try { Anthropic = require('@anthropic-ai/sdk'); Anthropic = Anthropic.default || Anthropic; } catch (e) { Anthropic = null; }

const MODEL = 'claude-opus-5-5';
let win = null;
const running = new Map(); // id -> stream

/* ---------- uložení API klíče (jen v tomto počítači) ---------- */
const settingsPath = () => path.join(app.getPath('userData'), 'settings.json');
function readSettings() { try { return JSON.parse(fs.readFileSync(settingsPath(), 'utf8')); } catch (e) { return {}; } }
function writeSettings(s) { fs.mkdirSync(path.dirname(settingsPath()), { recursive: true }); fs.writeFileSync(settingsPath(), JSON.stringify(s), { mode: 0o600 }); }
function getKey() {
  const s = readSettings();
  if (s.keyEnc && safeStorage.isEncryptionAvailable()) {
    try { return safeStorage.decryptString(Buffer.from(s.keyEnc, 'base64')); } catch (e) { /* fall through */ }
  }
  if (s.key) return s.key;
  return process.env.ANTHROPIC_API_KEY || '';
}
function setKey(k) {
  const s = readSettings(); delete s.key; delete s.keyEnc;
  if (k) {
    if (safeStorage.isEncryptionAvailable()) s.keyEnc = safeStorage.encryptString(k).toString('base64');
    else s.key = k;
  }
  writeSettings(s);
}

/* ---------- AI ---------- */
ipcMain.handle('ai:status', () => ({ available: !!Anthropic, hasKey: !!getKey(), model: MODEL }));
ipcMain.handle('ai:setKey', (e, k) => { setKey(String(k || '').trim()); return true; });
ipcMain.on('ai:abort', (e, id) => {
  for (const [k, s] of running) if (id === '*' || k === id) { try { s.abort(); } catch (x) {} }
});

ipcMain.handle('ai:ask', async (event, { id, system, messages }) => {
  if (!Anthropic) return { ok: false, code: 'unavailable', message: 'Knihovna Anthropic SDK chybí.' };
  const key = getKey();
  if (!key) return { ok: false, code: 'no_key', message: 'Chybí API klíč.' };
  const client = new Anthropic({ apiKey: key });
  let text = '';
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: 'low' },          // konverzace se zkoušejícím – rychlé odpovědi
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',                         // při odmítnutí odpoví záložní model
      system: String(system || ''),
      messages: (messages || []).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) })),
    });
    running.set(id, stream);
    stream.on('text', (delta) => {
      text += delta;
      if (!event.sender.isDestroyed()) event.sender.send('ai:delta', { id, text });
    });
    const msg = await stream.finalMessage();
    running.delete(id);
    if (msg.stop_reason === 'refusal') return { ok: false, code: 'refused', message: 'Model odmítl odpovědět.' };
    const full = msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
    return { ok: true, text: full || text };
  } catch (err) {
    running.delete(id);
    if (err instanceof Anthropic.APIUserAbortError) return { ok: false, code: 'cancelled', message: 'Zastaveno.', text };
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return { ok: false, code: 'auth', message: 'Neplatný API klíč.' };
    if (err instanceof Anthropic.RateLimitError) return { ok: false, code: 'rate_limited', message: 'Příliš mnoho dotazů.' };
    if (err instanceof Anthropic.APIConnectionError) return { ok: false, code: 'upstream_error', message: 'Bez připojení k internetu.' };
    if (err instanceof Anthropic.APIError) return { ok: false, code: 'upstream_error', message: 'Chyba API ' + (err.status || '') };
    return { ok: false, code: 'upstream_error', message: String(err && err.message || err) };
  }
});

/* ---------- okno ---------- */
function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 860, minWidth: 380, minHeight: 500,
    backgroundColor: '#0c3125',
    title: app.getName(),
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, autoplayPolicy: 'no-user-gesture-required' },
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'app.html'));
  // odkazy ven otevírat v prohlížeči
  // PDF materiály: přibalené v resources/materialy, otevřou se ve výchozím prohlížeči PDF
  const openPdf = (url) => {
    const m = /materialy\/(\d{2})\.pdf$/.exec(decodeURIComponent(url));
    if (!m) return false;
    const cands = [path.join(process.resourcesPath || '', 'materialy', m[1] + '.pdf'), path.join(__dirname, 'materialy', m[1] + '.pdf')];
    const f = cands.find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
    if (f) shell.openPath(f);
    return true;
  };
  win.webContents.setWindowOpenHandler(({ url }) => { if (openPdf(url)) return { action: 'deny' }; if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (openPdf(url)) { e.preventDefault(); return; } if (!url.startsWith('file:')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
