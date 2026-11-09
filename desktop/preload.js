const { contextBridge, ipcRenderer } = require("electron");

// Sinaliza ao editor que ele roda no aplicativo (projetos locais ilimitados).
contextBridge.exposeInMainWorld("siteforgeDesktop", true);
contextBridge.exposeInMainWorld("siteforgeApp", {
  version: () => ipcRenderer.invoke("app-version"),
  checkForUpdates: () => ipcRenderer.invoke("check-updates")
});
