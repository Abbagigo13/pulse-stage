
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Preserve the original SmartSpectra SDK bridge.
require('@smartspectra/node-sdk/preload');

// Expose only the PulseStage operations needed by the renderer.
// Qwen credentials remain inside the Electron main process.
contextBridge.exposeInMainWorld('pulsestage', {
    getApiKey: () => ipcRenderer.invoke('pulsestage:get-api-key'),

    analyzeSession: (sessionData) =>
        ipcRenderer.invoke('pulsestage:analyze-session', sessionData)
});

console.log('[PulseStage] Preload bridges initialized');
