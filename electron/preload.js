// Bezpečný most mezi stránkou a hlavním procesem (jen funkce pro AI).
const { contextBridge, ipcRenderer } = require('electron');

let seq = 0;
contextBridge.exposeInMainWorld('maturitaAI', {
  status: () => ipcRenderer.invoke('ai:status'),
  setKey: (k) => ipcRenderer.invoke('ai:setKey', k),
  abort: () => ipcRenderer.send('ai:abort', '*'),
  ask: (payload, onDelta) => {
    const id = 'q' + (++seq) + '-' + Date.now();
    const listener = (e, m) => { if (m.id === id && typeof onDelta === 'function') onDelta(m.text); };
    ipcRenderer.on('ai:delta', listener);
    return ipcRenderer.invoke('ai:ask', { id, system: payload.system, messages: payload.messages })
      .then((r) => {
        ipcRenderer.removeListener('ai:delta', listener);
        if (r && r.ok) return r.text;
        throw { code: (r && r.code) || 'upstream_error', message: (r && r.message) || '', text: r && r.text };
      });
  },
});
