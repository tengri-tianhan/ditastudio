const { contextBridge, ipcRenderer } = require('electron');
const { marked } = require('marked');
const path = require('path');

marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });

contextBridge.exposeInMainWorld('api', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  refreshTree: root => ipcRenderer.invoke('fs:refreshTree', root),
  readFile: f => ipcRenderer.invoke('fs:readFile', f),
  writeFile: (f, c) => ipcRenderer.invoke('fs:writeFile', f, c),
  exists: f => ipcRenderer.invoke('fs:exists', f),
  createFile: (f, c) => ipcRenderer.invoke('fs:createFile', f, c),
  createFolder: d => ipcRenderer.invoke('fs:createFolder', d),
  copyFile: (a, b) => ipcRenderer.invoke('fs:copyFile', a, b),
  renamePath: (a, b) => ipcRenderer.invoke('fs:rename', a, b),
  deletePath: p => ipcRenderer.invoke('fs:delete', p),
  collectAuthoringFiles: root => ipcRenderer.invoke('fs:collectAuthoringFiles', root),

  autosaveSave: (root, file, content) => ipcRenderer.invoke('autosave:save', root, file, content),
  autosaveList: (root, file) => ipcRenderer.invoke('autosave:list', root, file),

  exportHTML: (html, name) => ipcRenderer.invoke('export:html', html, name),
  exportPDF: (html, name) => ipcRenderer.invoke('export:pdf', html, name),
  exportPDFFile: (html, dest) => ipcRenderer.invoke('export:pdfFile', html, dest),
  showInFolder: p => ipcRenderer.invoke('shell:showInFolder', p),
  openExternal: u => ipcRenderer.invoke('shell:openExternal', u),
  readDoc: k => ipcRenderer.invoke('app:readDoc', k),
  aiChat: cfg => ipcRenderer.invoke('ai:chat', cfg),
  openExternal: u => ipcRenderer.invoke('shell:openExternal', u),
  aiComplete: spec => ipcRenderer.invoke('ai:complete', spec),

  pickFolder: title => ipcRenderer.invoke('dialog:pickFolder', title),
  pickFile: (title, filters) => ipcRenderer.invoke('dialog:pickFile', title, filters),
  ditaotRun: (otDir, input, transtype, outDir) => ipcRenderer.invoke('ditaot:run', otDir, input, transtype, outDir),
  ditaotCancel: () => ipcRenderer.invoke('ditaot:cancel'),
  onDitaotLog: cb => ipcRenderer.on('ditaot:log', (_e, chunk) => cb(chunk)),
  getReadme: () => ipcRenderer.invoke('app:readme'),
  aiChat: cfg => ipcRenderer.invoke('ai:chat', cfg),
  aiOllamaModels: base => ipcRenderer.invoke('ai:ollamaModels', base),

  renderMarkdown: src => marked.parse(src),

  path: {
    dirname: p => path.dirname(p),
    basename: (p, ext) => path.basename(p, ext),
    extname: p => path.extname(p),
    join: (...a) => path.join(...a),
    resolve: (...a) => path.resolve(...a),
    relative: (a, b) => path.relative(a, b),
    sep: path.sep
  }
});
