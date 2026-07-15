const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#14181d',
    title: 'DITA Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ---------------- helpers ---------------- */

const IGNORED_DIRS = new Set(['node_modules', '.git', '.svn', '.hg', 'temp', '.autosave']);

async function readTree(dir, depth = 0) {
  const out = [];
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch (e) {
    return out;
  }
  entries.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const e of entries) {
    if (e.name.startsWith('.') && e.isDirectory()) continue;
    if (IGNORED_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (depth < 12) {
        out.push({ name: e.name, path: full, dir: true, children: await readTree(full, depth + 1) });
      }
    } else {
      out.push({ name: e.name, path: full, dir: false });
    }
  }
  return out;
}

function tsStamp(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/* ---------------- IPC: project / filesystem ---------------- */

ipcMain.handle('dialog:openFolder', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
  if (r.canceled || !r.filePaths.length) return null;
  const root = r.filePaths[0];
  return { root, tree: await readTree(root) };
});

ipcMain.handle('fs:refreshTree', async (_e, root) => ({ root, tree: await readTree(root) }));

ipcMain.handle('fs:readFile', async (_e, file) => {
  const buf = await fsp.readFile(file);
  return buf.toString('utf8');
});

ipcMain.handle('fs:writeFile', async (_e, file, content) => {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, content, 'utf8');
  return true;
});

ipcMain.handle('fs:exists', async (_e, file) => fs.existsSync(file));

ipcMain.handle('fs:createFile', async (_e, file, content) => {
  if (fs.existsSync(file)) throw new Error('File already exists: ' + file);
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, content, 'utf8');
  return true;
});

ipcMain.handle('fs:copyFile', async (_e, src, dest) => {
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.copyFile(src, dest);
  return true;
});

ipcMain.handle('fs:createFolder', async (_e, dir) => {
  await fsp.mkdir(dir, { recursive: true });
  return true;
});

ipcMain.handle('fs:rename', async (_e, from, to) => {
  await fsp.rename(from, to);
  return true;
});

ipcMain.handle('fs:delete', async (_e, target) => {
  await fsp.rm(target, { recursive: true, force: true });
  return true;
});

/* Collect all authoring files under root (for dependency index) */
const AUTHOR_EXT = new Set(['.dita', '.ditamap', '.bookmap', '.xml', '.md', '.mdx', '.markdown']);
async function collectFiles(dir, acc) {
  let entries;
  try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch (e) { return acc; }
  for (const e of entries) {
    if (IGNORED_DIRS.has(e.name) || (e.name.startsWith('.') && e.isDirectory())) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await collectFiles(full, acc);
    else if (AUTHOR_EXT.has(path.extname(e.name).toLowerCase())) acc.push(full);
  }
  return acc;
}

ipcMain.handle('fs:collectAuthoringFiles', async (_e, root) => {
  const files = await collectFiles(root, []);
  const out = [];
  for (const f of files) {
    try {
      const st = await fsp.stat(f);
      if (st.size > 4 * 1024 * 1024) continue; // skip >4MB
      out.push({ path: f, content: await fsp.readFile(f, 'utf8') });
    } catch (e) { /* skip unreadable */ }
  }
  return out;
});

/* ---------------- IPC: autosave versions ---------------- */

ipcMain.handle('autosave:save', async (_e, root, file, content) => {
  const dir = path.join(root, '.autosave');
  await fsp.mkdir(dir, { recursive: true });
  const rel = path.relative(root, file).split(path.sep).join('__');
  const name = `${rel}.${tsStamp()}.bak`;
  await fsp.writeFile(path.join(dir, name), content, 'utf8');
  // prune: keep newest 30 versions per file
  const all = (await fsp.readdir(dir)).filter(n => n.startsWith(rel + '.')).sort();
  while (all.length > 30) {
    const oldest = all.shift();
    await fsp.rm(path.join(dir, oldest), { force: true });
  }
  return name;
});

ipcMain.handle('autosave:list', async (_e, root, file) => {
  const dir = path.join(root, '.autosave');
  if (!fs.existsSync(dir)) return [];
  const rel = path.relative(root, file).split(path.sep).join('__');
  const names = (await fsp.readdir(dir)).filter(n => n.startsWith(rel + '.')).sort().reverse();
  return names.map(n => ({ name: n, path: path.join(dir, n) }));
});

/* ---------------- IPC: export ---------------- */

ipcMain.handle('export:html', async (_e, html, defaultName) => {
  const r = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: [{ name: 'HTML', extensions: ['html'] }]
  });
  if (r.canceled || !r.filePath) return null;
  await fsp.writeFile(r.filePath, html, 'utf8');
  return r.filePath;
});

ipcMain.handle('export:pdf', async (_e, html, defaultName) => {
  const r = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (r.canceled || !r.filePath) return null;

  const tmp = path.join(app.getPath('temp'), `dita-studio-pdf-${Date.now()}.html`);
  await fsp.writeFile(tmp, html, 'utf8');

  const pdfWin = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await pdfWin.loadFile(tmp);
    const data = await pdfWin.webContents.printToPDF({
      printBackground: true,
      margins: { top: 0.6, bottom: 0.7, left: 0.6, right: 0.6 },
      pageSize: 'A4',
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;text-align:center;font-size:8px;color:#8b96a3;font-family:Segoe UI,sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
    });
    await fsp.writeFile(r.filePath, data);
  } finally {
    pdfWin.destroy();
    fsp.rm(tmp, { force: true }).catch(() => {});
  }
  return r.filePath;
});

ipcMain.handle('export:pdfFile', async (_e, html, destPath) => {
  const tmp = path.join(app.getPath('temp'), `dita-studio-sitepdf-${Date.now()}.html`);
  await fsp.writeFile(tmp, html, 'utf8');
  const pdfWin = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await pdfWin.loadFile(tmp);
    const data = await pdfWin.webContents.printToPDF({
      printBackground: true,
      margins: { top: 0.6, bottom: 0.7, left: 0.6, right: 0.6 },
      pageSize: 'A4',
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;text-align:center;font-size:8px;color:#8b96a3;font-family:Segoe UI,sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
    });
    await fsp.mkdir(path.dirname(destPath), { recursive: true });
    await fsp.writeFile(destPath, data);
  } finally {
    pdfWin.destroy();
    fsp.rm(tmp, { force: true }).catch(() => {});
  }
  return destPath;
});

ipcMain.handle('shell:showInFolder', async (_e, p) => { shell.showItemInFolder(p); return true; });

ipcMain.handle('shell:openExternal', async (_e, url) => {
  if (/^https?:\/\//i.test(url)) await shell.openExternal(url);
  return true;
});

/* bundled docs for the in-app Help viewer */
ipcMain.handle('app:readDoc', async (_e, kind) => {
  const file = kind === 'changelog' ? 'CHANGELOG.md' : 'README.md';
  try { return await fsp.readFile(path.join(__dirname, file), 'utf8'); }
  catch (e) { return '# Not available\nThis document was not bundled with the build.'; }
});

/* ---------------- IPC: AI assistant ---------------- */
/* One adapter for OpenAI-compatible endpoints (OpenAI, DeepSeek, Moonshot,
   OpenRouter, Ollama, LM Studio) and one for the Anthropic Messages API.
   Requests run in the main process, so browser CORS never applies. */
ipcMain.handle('ai:chat', async (_e, cfg) => {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 120000);
  try {
    let url, headers, body;
    if (cfg.style === 'anthropic') {
      url = cfg.baseUrl.replace(/\/$/, '') + '/v1/messages';
      headers = {
        'content-type': 'application/json',
        'x-api-key': cfg.apiKey || '',
        'anthropic-version': '2023-06-01'
      };
      body = {
        model: cfg.model,
        max_tokens: cfg.maxTokens || 2048,
        system: cfg.system || '',
        messages: [{ role: 'user', content: cfg.user }]
      };
    } else {
      url = cfg.baseUrl.replace(/\/$/, '') + '/chat/completions';
      headers = { 'content-type': 'application/json' };
      if (cfg.apiKey) headers.authorization = 'Bearer ' + cfg.apiKey;
      body = {
        model: cfg.model,
        max_tokens: cfg.maxTokens || 2048,
        messages: [
          ...(cfg.system ? [{ role: 'system', content: cfg.system }] : []),
          { role: 'user', content: cfg.user }
        ]
      };
    }
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: ctl.signal });
    const raw = await res.text();
    if (!res.ok) {
      let msg = raw.slice(0, 400);
      try { msg = (JSON.parse(raw).error || {}).message || msg; } catch (e2) { /* keep raw */ }
      return { error: `HTTP ${res.status}: ${msg}` };
    }
    const data = JSON.parse(raw);
    let text = '';
    if (cfg.style === 'anthropic') {
      text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    } else {
      text = ((data.choices || [])[0] || {}).message ? data.choices[0].message.content : '';
    }
    return { text: text || '' };
  } catch (err) {
    const hint = /abort/i.test(String(err)) ? 'Request timed out (120 s).' :
      /fetch failed|ECONNREFUSED/i.test(String(err)) ? 'Could not reach the endpoint — is the service running / is the URL right?' : '';
    return { error: (err.message || String(err)) + (hint ? ' — ' + hint : '') };
  } finally {
    clearTimeout(timer);
  }
});

/* ---------------- IPC: generic pickers ---------------- */

ipcMain.handle('dialog:pickFolder', async (_e, title) => {
  const r = await dialog.showOpenDialog(win, { title, properties: ['openDirectory'] });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
});

ipcMain.handle('dialog:pickFile', async (_e, title, filters) => {
  const r = await dialog.showOpenDialog(win, { title, properties: ['openFile'], filters: filters || [] });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
});

/* ---------------- IPC: DITA-OT ---------------- */

const { spawn } = require('child_process');
let otProc = null;

ipcMain.handle('ditaot:run', async (_e, otDir, input, transtype, outDir) => {
  if (otProc) return { code: -1, error: 'A DITA-OT build is already running.' };
  const bin = process.platform === 'win32'
    ? path.join(otDir, 'bin', 'dita.bat')
    : path.join(otDir, 'bin', 'dita');
  if (!fs.existsSync(bin)) {
    return { code: -1, error: 'DITA-OT launcher not found: ' + bin + '\nPoint the setting at the DITA-OT install folder (the one containing bin/).' };
  }
  return await new Promise(resolve => {
    const args = ['-i', input, '-f', transtype, '-o', outDir];
    win.webContents.send('ditaot:log', `> ${bin} ${args.join(' ')}\n\n`);
    otProc = spawn(bin, args, { cwd: otDir, shell: process.platform === 'win32' });
    const pipe = data => win.webContents.send('ditaot:log', data.toString());
    otProc.stdout.on('data', pipe);
    otProc.stderr.on('data', pipe);
    const timer = setTimeout(() => { try { otProc.kill(); } catch (e) {} }, 15 * 60 * 1000);
    otProc.on('close', code => {
      clearTimeout(timer);
      otProc = null;
      resolve({ code });
    });
    otProc.on('error', err => {
      clearTimeout(timer);
      otProc = null;
      resolve({ code: -1, error: err.message });
    });
  });
});

ipcMain.handle('ditaot:cancel', async () => {
  if (otProc) { try { otProc.kill(); } catch (e) {} }
  return true;
});
