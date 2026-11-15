const { contextBridge, ipcRenderer } = require("electron");

// Sinaliza ao editor que ele roda no aplicativo (projetos locais ilimitados).
contextBridge.exposeInMainWorld("siteforgeDesktop", true);
contextBridge.exposeInMainWorld("siteforgeApp", {
  version: () => ipcRenderer.invoke("app-version"),
  checkForUpdates: () => ipcRenderer.invoke("check-updates"),
  // Informa ao processo principal se há alterações não salvas (ele pergunta antes de fechar).
  setDirty: (dirty) => ipcRenderer.send("app-dirty", Boolean(dirty)),
  // O editor registra o callback que mostra o diálogo "salvar antes de fechar?".
  onCloseRequest: (callback) => {
    ipcRenderer.on("app-close-request", () => callback());
  },
  // Chamado depois que o usuário escolhe salvar ou descartar.
  confirmClose: () => ipcRenderer.send("app-close-confirm")
});
