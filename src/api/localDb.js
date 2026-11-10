/**
 * LemonNote local database.
 *
 * Everything the app saves lives in this browser/webview's IndexedDB on your own
 * computer. No account, no server, nothing leaves the machine.
 *
 * The shape is deliberately small and stable (db.entities.Note.filter(...),
 * db.auth.me(), ...) so every page talks to ONE seam. When the Rust (Tauri)
 * engine is ready, only this file changes: each function below becomes a call
 * to a Rust command and the rest of the app does not notice.
 */

const DB_NAME = "notecraft";
const DB_VERSION = 5;
const FILE_STORE = "_files";
const USER_KEY = "notecraft:user";

// Tables (one per kind of thing the app saves) and their default field values.
const DEFAULTS = {
  Note: { 
    format: "markdown", 
    folder: "", 
    favourite: false,
    is_encrypted: false,
    encrypted_body: null,
    encryption_version: 1,
    title_encrypted: false
  },
  Canvas: {},
  DataTable: {},
  CodeFile: {},
  InkPage: {},
  InkChunk: {},
  Flashcard: {},
  Template: {},
};

/* ---------- IndexedDB plumbing ---------- */

let dbPromise = null;
let dbVersionAtOpen = null;
let dbInstance = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        [...Object.keys(DEFAULTS), FILE_STORE].forEach((name) => {
          if (!database.objectStoreNames.contains(name)) {
            database.createObjectStore(name, { keyPath: "id" });
          }
        });
      };
      request.onsuccess = () => {
        dbInstance = request.result;
        dbVersionAtOpen = request.result.version;
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

/**
 * Forces a new database connection (for testing migrations).
 * Clears the cached promise and cache.
 */
export function reopenDb() {
  closeDb();
  clearDbCache();
  return openDb();
}

/**
 * Opens the database connection. Exported for use by other modules.
 */
export async function getDb() {
  return openDb();
}

/**
 * Close the database connection if open.
 */
export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Clears the in-memory cache. Call this after a database upgrade
 * or when you know the underlying data has changed externally.
 */
export function clearDbCache() {
  cache.clear();
  dbVersionAtOpen = null;
  dbPromise = null;
}

/**
 * Returns the IndexedDB version the app opened with.
 * Useful for diagnostics or migration logic.
 */
export function getOpenedDbVersion() {
  return dbVersionAtOpen;
}

const wrap = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

// Each table is read from disk once, then served from memory; every write is
// saved to disk before its promise resolves.
const cache = new Map();

function table(name) {
  if (!DEFAULTS[name]) throw new Error(`Unknown table: ${name}`);
  if (!cache.has(name)) {
    cache.set(
      name,
      (async () => {
        const database = await openDb();
        const rows = await wrap(database.transaction(name).objectStore(name).getAll());
        return new Map(rows.map((row) => [row.id, row]));
      })()
    );
  }
  return cache.get(name);
}

async function persist(name, puts = [], removes = []) {
  const database = await openDb();
  await new Promise((resolve, reject) => {
    const tx = database.transaction(name, "readwrite");
    const store = tx.objectStore(name);
    puts.forEach((row) => store.put(row));
    removes.forEach((id) => store.delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

const clone = (value) => (value === undefined ? value : structuredClone(value));

function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

/* ---------- query language (the small subset the app uses) ---------- */

const same = (value, wanted) =>
  Array.isArray(value) && !Array.isArray(wanted) ? value.includes(wanted) : value === wanted;

function matchCondition(value, condition) {
  const isOperators =
    condition !== null &&
    typeof condition === "object" &&
    !Array.isArray(condition) &&
    Object.keys(condition).some((key) => key.startsWith("$"));
  if (!isOperators) return same(value, condition);

  return Object.entries(condition).every(([op, arg]) => {
    switch (op) {
      case "$eq":
        return same(value, arg);
      case "$ne":
        return !same(value, arg); // a missing field counts as "not equal"
      case "$lt":
        return value != null && value < arg;
      case "$lte":
        return value != null && value <= arg;
      case "$gt":
        return value != null && value > arg;
      case "$gte":
        return value != null && value >= arg;
      case "$in":
        return arg.some((item) => same(value, item));
      case "$nin":
        return !arg.some((item) => same(value, item));
      case "$exists":
        return (value !== undefined && value !== null) === Boolean(arg);
      case "$regex":
        return typeof value === "string" && new RegExp(arg, condition.$options || "").test(value);
      case "$options":
        return true; // consumed together with $regex
      default:
        throw new Error(`Unsupported query operator: ${op}`);
    }
  });
}

function matches(row, query) {
  return Object.entries(query || {}).every(([key, condition]) => {
    if (key === "$or") return condition.some((part) => matches(row, part));
    if (key === "$and") return condition.every((part) => matches(row, part));
    return matchCondition(row[key], condition);
  });
}

function compareBy(sort) {
  if (!sort) return () => 0;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return (a, b) => {
    const x = a[field];
    const y = b[field];
    if (x == null && y == null) return 0;
    if (x == null) return 1; // empty values always sort last
    if (y == null) return -1;
    if (x === y) return 0;
    return (x < y ? -1 : 1) * (desc ? -1 : 1);
  };
}

/* ---------- tables ---------- */

function applyDefaults(name, row) {
  const defaults = DEFAULTS[name];
  if (!defaults) return row;
  const result = { ...row };
  for (const [key, value] of Object.entries(defaults)) {
    if (result[key] === undefined) {
      result[key] = value;
    }
  }
  return result;
}

function entity(name) {
  const find = async (query = {}, options = {}) => {
    const rows = [...(await table(name)).values()].filter((row) => matches(row, query));
    rows.sort(compareBy(options.sort));
    const start = Number(options.cursor) || 0;
    const limit = options.limit ?? 1000;
    const items = rows.slice(start, start + limit).map((row) => applyDefaults(name, row));
    const more = start + limit < rows.length;
    return { items: clone(items), has_more: more, next_cursor: more ? String(start + limit) : null };
  };

  const build = (data) => {
    const now = new Date().toISOString();
    return { ...DEFAULTS[name], ...clone(data), id: data?.id || newId(), created_date: now, updated_date: now };
  };

  const patchRow = (rows, id, patch) => {
    const row = rows.get(id);
    if (!row) throw new Error(`${name} ${id} was not found`);
    const next = { ...row, ...clone(patch), id, updated_date: new Date().toISOString() };
    rows.set(id, next);
    return next;
  };

  return {
    list: (options) => find({}, options),
    filter: find,

    async get(id) {
      const row = (await table(name)).get(id);
      if (!row) throw new Error(`${name} ${id} was not found`);
      return clone(applyDefaults(name, row));
    },

    async create(data) {
      const rows = await table(name);
      const row = build(data);
      rows.set(row.id, row);
      await persist(name, [row]);
      return clone(row);
    },

    async bulkCreate(list) {
      const rows = await table(name);
      const created = (list || []).map(build);
      created.forEach((row) => rows.set(row.id, row));
      await persist(name, created);
      return clone(created);
    },

    async update(id, patch) {
      const rows = await table(name);
      const next = patchRow(rows, id, patch);
      await persist(name, [next]);
      return clone(next);
    },

    async bulkUpdate(list) {
      const rows = await table(name);
      const updated = (list || []).map(({ id, ...patch }) => patchRow(rows, id, patch));
      await persist(name, updated);
      return clone(updated);
    },

    async delete(id) {
      const rows = await table(name);
      rows.delete(id);
      await persist(name, [], [id]);
      return { success: true };
    },

    async deleteMany(query) {
      const rows = await table(name);
      const ids = [...rows.values()].filter((row) => matches(row, query)).map((row) => row.id);
      ids.forEach((id) => rows.delete(id));
      await persist(name, [], ids);
      return { deleted: ids.length };
    },
  };
}

/* ---------- the local "user" (one person, one device) ---------- */

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

const auth = {
  async me() {
    return { id: "local", full_name: "", email: "", role: "admin", ...readUser() };
  },
  async updateMe(patch) {
    const next = { ...readUser(), ...patch };
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked: the flag simply is not remembered */
    }
    return auth.me();
  },
};

/* ---------- files (pictures and audio) ---------- */

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * Store a file in the _files store.
 * @param {File} file - The file to store
 * @returns {Promise<{ id: string, name: string, type: string, size: number, ref: string }>}
 */
export async function putFile(file) {
  if (!file || !(file instanceof Blob)) {
    throw new Error("Expected a File or Blob");
  }
  const id = newId();
  const database = await openDb();
  await new Promise((resolve, reject) => {
    const tx = database.transaction(FILE_STORE, "readwrite");
    tx.objectStore(FILE_STORE).put({
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      blob: file,
      created_date: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return { id, name: file.name, type: file.type, size: file.size, ref: `local:${id}` };
}

/**
 * Get a file from the _files store by ID.
 * @param {string} id - The file ID
 * @returns {Promise<{ id: string, name: string, type: string, size: number, blob: Blob, created_date: string } | null>}
 */
export async function getFile(id) {
  const database = await openDb();
  const row = await wrap(
    database.transaction(FILE_STORE, "readonly").objectStore(FILE_STORE).get(id)
  );
  return row || null;
}

/**
 * Delete a file from the _files store by ID.
 * @param {string} id - The file ID
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteFile(id) {
  const database = await openDb();
  await new Promise((resolve, reject) => {
    const tx = database.transaction(FILE_STORE, "readwrite");
    tx.objectStore(FILE_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return { success: true };
}

/**
 * Create an object URL for a file.
 * @param {string} id - The file ID
 * @returns {Promise<string>} - Object URL
 */
export async function createFileObjectUrl(id) {
  const row = await getFile(id);
  if (!row) throw new Error("File not found");
  return URL.createObjectURL(row.blob);
}

const Core = {
  // A picture inside a note: stored as text inside the note so it needs no server.
  async UploadPublicFile({ file }) {
    return { file_url: await readAsDataUrl(file) };
  },

  // Recordings and drawings: kept as a file in the local database.
  async UploadPrivateFile({ file }) {
    const result = await putFile(file);
    return { file_uri: result.ref };
  },

  async CreateFileSignedUrl({ file_uri }) {
    const id = String(file_uri || "").replace(/^local:/, "");
    return { signed_url: await createFileObjectUrl(id) };
  },
};

/* ---------- files entity (uses _files store) ---------- */

function createFilesEntity() {
  const find = async (query = {}, options = {}) => {
    const database = await openDb();
    const rows = await new Promise((resolve, reject) => {
      const tx = database.transaction(FILE_STORE, "readonly");
      const request = tx.objectStore(FILE_STORE).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const filtered = rows.filter((row) => matches(row, query));
    filtered.sort(compareBy(options.sort));
    const start = Number(options.cursor) || 0;
    const limit = options.limit ?? 1000;
    const items = filtered.slice(start, start + limit);
    const more = start + limit < filtered.length;
    return { items: clone(items), has_more: more, next_cursor: more ? String(start + limit) : null };
  };

  const build = (data) => {
    const now = new Date().toISOString();
    return { ...clone(data), id: data?.id || newId(), created_date: now, updated_date: now };
  };

  const patchRow = (rows, id, patch) => {
    const row = rows.get(id);
    if (!row) throw new Error(`Files ${id} was not found`);
    const next = { ...row, ...clone(patch), id, updated_date: new Date().toISOString() };
    rows.set(id, next);
    return next;
  };

  // We need a cache for the files entity too
  let filesCachePromise = null;
  async function getFilesCache() {
    if (!filesCachePromise) {
      filesCachePromise = (async () => {
        const database = await openDb();
        const rows = await new Promise((resolve, reject) => {
          const tx = database.transaction(FILE_STORE, "readonly");
          const request = tx.objectStore(FILE_STORE).getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        return new Map(rows.map((row) => [row.id, row]));
      })();
    }
    return filesCachePromise;
  }

  return {
    list: (options) => find({}, options),
    filter: find,

    async get(id) {
      const rows = await getFilesCache();
      const row = rows.get(id);
      if (!row) throw new Error(`Files ${id} was not found`);
      return clone(row);
    },

    async create(data) {
      const rows = await getFilesCache();
      const row = build(data);
      rows.set(row.id, row);
      await persist(FILE_STORE, [row]);
      return clone(row);
    },

    async bulkCreate(list) {
      const rows = await getFilesCache();
      const created = (list || []).map(build);
      created.forEach((row) => rows.set(row.id, row));
      await persist(FILE_STORE, created);
      return clone(created);
    },

    async update(id, patch) {
      const rows = await getFilesCache();
      const next = patchRow(rows, id, patch);
      await persist(FILE_STORE, [next]);
      return clone(next);
    },

    async bulkUpdate(list) {
      const rows = await getFilesCache();
      const updated = (list || []).map(({ id, ...patch }) => patchRow(rows, id, patch));
      await persist(FILE_STORE, updated);
      return clone(updated);
    },

    async delete(id) {
      const rows = await getFilesCache();
      rows.delete(id);
      await persist(FILE_STORE, [], [id]);
      return { success: true };
    },

    async deleteMany(query) {
      const rows = await getFilesCache();
      const ids = [...rows.values()].filter((row) => matches(row, query)).map((row) => row.id);
      ids.forEach((id) => rows.delete(id));
      await persist(FILE_STORE, [], ids);
      return { deleted: ids.length };
    },
  };
}

const FilesEntity = createFilesEntity();

/* ---------- online-only features ---------- */

const functions = {
  // The AI assistant and handwriting recognition used an online service.
  async invoke(name) {
    throw new Error(`"${name}" needs an online AI service, which this version does not include.`);
  },
};

const baseEntities = Object.fromEntries(Object.keys(DEFAULTS).map((name) => [name, entity(name)]));

export const db = {
  entities: {
    ...baseEntities,
    Files: FilesEntity,
  },
  auth,
  integrations: { Core },
  functions,
  // File helpers
  putFile,
  getFile,
  deleteFile,
  createFileObjectUrl,
};
