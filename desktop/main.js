const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// Porta fixa: adicione http://127.0.0.1:47831/editor nas URLs de redirecionamento do Supabase.
const PORT = 47831;
const REPO = "brenno-schnoor/siteforge";
const webRoot = app.isPackaged ? path.join(process.resourcesPath, "web") : path.join(__dirname, "..", "dist");

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".mp4": "video/mp4", ".woff2": "font/woff2" };

// Servidor local: o editor usa rotas como /editor, então qualquer rota sem arquivo volta para index.html.
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
      let file = path.join(webRoot, pathname);
      if (!file.startsWith(webRoot) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(webRoot, "index.html");
      res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

function compareVersions(a, b) {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
}

// Verifica a última release publicada no GitHub.
async function checkForUpdates() {
  const current = app.getVersion();
  const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { "User-Agent": "SiteForge-Desktop", Accept: "application/vnd.github+json" } });
  if (!response.ok) return { current, error: "Não foi possível verificar agora." };
  const release = await response.json();
  const latest = release.tag_name || "";
  return { current, latest, available: compareVersions(latest, current) > 0, url: release.html_url };
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    title: "SiteForge",
    backgroundColor: "#08090d",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true }
  });
  win.loadURL(`http://127.0.0.1:${PORT}/editor`);
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
}

function buildMenu() {
  const template = [
    { role: "fileMenu" },
    { role: "editMenu" },
    { role: "viewMenu" },
    {
      label: "Ajuda",
      submenu: [
        {
          label: "Verificar atualizações",
          click: async () => {
            try {
              const result = await checkForUpdates();
              if (result.error) return dialog.showMessageBox({ message: result.error });
              if (result.available) {
                const choice = await dialog.showMessageBox({ type: "info", message: `Nova versão disponível: ${result.latest}`, detail: `Você está usando a ${result.current}.`, buttons: ["Abrir página de download", "Depois"] });
                if (choice.response === 0) shell.openExternal(result.url);
              } else {
                dialog.showMessageBox({ message: "Você já está na versão mais recente.", detail: `Versão ${result.current}` });
              }
            } catch {
              dialog.showMessageBox({ message: "Sem conexão para verificar atualizações." });
            }
          }
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.handle("app-version", () => app.getVersion());
ipcMain.handle("check-updates", () => checkForUpdates());

app.whenReady().then(async () => {
  await startServer();
  buildMenu();
  await createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
