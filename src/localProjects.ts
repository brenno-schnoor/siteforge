// Projetos locais: ficam no próprio dispositivo (IndexedDB), sem ir para o banco de dados.
// Não há limite de quantidade. Se o IndexedDB não estiver disponível, as funções falham em silêncio
// e o editor continua funcionando apenas com a sessão atual.

export type LocalProjectRecord = {
  id: string;
  name: string;
  updatedAt: string;
  payload: unknown;
};

const DB_NAME = "siteforge-local";
const STORE = "projects";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        tx.oncomplete = () => { db.close(); resolve(request.result); };
        tx.onerror = () => { db.close(); reject(tx.error); };
        tx.onabort = () => { db.close(); reject(tx.error); };
      }),
  );
}

export function newLocalProjectId() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function listLocalProjects(): Promise<LocalProjectRecord[]> {
  try {
    const rows = await run<LocalProjectRecord[]>("readonly", (store) => store.getAll());
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export async function getLocalProject(id: string): Promise<LocalProjectRecord | null> {
  try {
    const row = await run<LocalProjectRecord | undefined>("readonly", (store) => store.get(id));
    return row ?? null;
  } catch {
    return null;
  }
}

export async function putLocalProject(record: LocalProjectRecord): Promise<boolean> {
  try {
    await run("readwrite", (store) => store.put(record));
    return true;
  } catch {
    return false;
  }
}

export async function deleteLocalProject(id: string): Promise<boolean> {
  try {
    await run("readwrite", (store) => store.delete(id));
    return true;
  } catch {
    return false;
  }
}
