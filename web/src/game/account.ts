const SESSION_KEY = 'pawfect.session.v1';
const VAULT_KEY = 'pawfect.vault.v1';

interface VaultRecord {
  salt: string;
  verifier: string;
  blob: string;
  iv: string;
  updatedAt: number;
}

interface VaultFile {
  version: 1;
  accounts: Record<string, VaultRecord>;
}

export interface Session {
  username: string;
}

function loadVault(): VaultFile {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return { version: 1, accounts: {} };
    const parsed = JSON.parse(raw) as VaultFile;
    if (parsed?.version !== 1) return { version: 1, accounts: {} };
    return { version: 1, accounts: parsed.accounts || {} };
  } catch {
    return { version: 1, accounts: {} };
  }
}

function saveVault(vault: VaultFile): void {
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}

function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function deriveBits(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 120000, hash: 'SHA-256' },
    key,
    256,
  );
  return new Uint8Array(bits);
}

async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const bits = await deriveBits(password, salt);
  return crypto.subtle.importKey('raw', bits.buffer as ArrayBuffer, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function normalizeUsername(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_').slice(0, 20);
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.username) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getSessionUsername(): string | null {
  return getSession()?.username ?? null;
}

export function setSessionPassword(password: string): void {
  sessionStorage.setItem('pawfect.pass.mem', password);
}

export function getSessionPassword(): string | null {
  return sessionStorage.getItem('pawfect.pass.mem');
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem('pawfect.pass.mem');
}

export function listUsernames(): string[] {
  return Object.keys(loadVault().accounts).sort();
}

export async function createAccount(
  username: string,
  password: string,
  profile: object,
  runJson: string | null,
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const user = normalizeUsername(username);
  if (user.length < 3) return { ok: false, error: 'Username needs at least 3 characters.' };
  if (password.length < 4) return { ok: false, error: 'Password needs at least 4 characters.' };
  const vault = loadVault();
  if (vault.accounts[user]) return { ok: false, error: 'That username is already on this device.' };

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveBits(password, salt);
  const verifier = bytesToB64(bits);
  const payload = JSON.stringify({ profile, runJson, savedAt: Date.now() });
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    new TextEncoder().encode(payload),
  );

  vault.accounts[user] = {
    salt: bytesToB64(salt),
    verifier,
    blob: bytesToB64(new Uint8Array(cipher)),
    iv: bytesToB64(iv),
    updatedAt: Date.now(),
  };
  saveVault(vault);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user } satisfies Session));
  setSessionPassword(password);
  return { ok: true, username: user };
}

export async function loginAccount(
  username: string,
  password: string,
): Promise<{ ok: true; profile: unknown; runJson: string | null } | { ok: false; error: string }> {
  const user = normalizeUsername(username);
  const rec = loadVault().accounts[user];
  if (!rec) return { ok: false, error: 'No account with that username on this device.' };
  const salt = b64ToBytes(rec.salt);
  const bits = await deriveBits(password, salt);
  if (bytesToB64(bits) !== rec.verifier) return { ok: false, error: 'Wrong password. There is no reset.' };

  try {
    const key = await deriveAesKey(password, salt);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64ToBytes(rec.iv).buffer as ArrayBuffer },
      key,
      b64ToBytes(rec.blob).buffer as ArrayBuffer,
    );
    const parsed = JSON.parse(new TextDecoder().decode(plain)) as {
      profile: unknown;
      runJson: string | null;
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user } satisfies Session));
    setSessionPassword(password);
    return { ok: true, profile: parsed.profile, runJson: parsed.runJson ?? null };
  } catch {
    return { ok: false, error: 'Could not open that save. Wrong password.' };
  }
}

/** Check the password and remember it for this tab so backups stay current. Does not reload the save. */
export async function rememberPassword(
  username: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = normalizeUsername(username);
  const rec = loadVault().accounts[user];
  if (!rec) return { ok: false, error: 'No account with that username on this device.' };
  const bits = await deriveBits(password, b64ToBytes(rec.salt));
  if (bytesToB64(bits) !== rec.verifier) return { ok: false, error: 'Wrong password. There is no reset.' };
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user } satisfies Session));
  setSessionPassword(password);
  return { ok: true };
}

export async function persistAccount(profile: object, runJson: string | null, password: string): Promise<boolean> {
  const session = getSession();
  if (!session) return false;
  const vault = loadVault();
  const rec = vault.accounts[session.username];
  if (!rec) return false;
  const salt = b64ToBytes(rec.salt);
  const bits = await deriveBits(password, salt);
  if (bytesToB64(bits) !== rec.verifier) return false;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);
  const payload = JSON.stringify({ profile, runJson, savedAt: Date.now() });
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    new TextEncoder().encode(payload),
  );
  rec.blob = bytesToB64(new Uint8Array(cipher));
  rec.iv = bytesToB64(iv);
  rec.updatedAt = Date.now();
  vault.accounts[session.username] = rec;
  saveVault(vault);
  return true;
}

/** Encrypted backup string to paste on another phone. Needs the same password to open. */
export function exportRestoreCode(): string | null {
  const session = getSession();
  if (!session) return null;
  const rec = loadVault().accounts[session.username];
  if (!rec) return null;
  const pack = { v: 1 as const, username: session.username, rec };
  return `PFS1.${bytesToB64(new TextEncoder().encode(JSON.stringify(pack)))}`;
}

export async function importRestoreCode(
  code: string,
  password: string,
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const trimmed = code.trim();
  if (!trimmed.startsWith('PFS1.')) return { ok: false, error: 'That is not a Pawfect restore code.' };
  try {
    const pack = JSON.parse(new TextDecoder().decode(b64ToBytes(trimmed.slice(5)))) as {
      v: number;
      username: string;
      rec: VaultRecord;
    };
    if (pack.v !== 1 || !pack.username || !pack.rec) return { ok: false, error: 'Restore code is damaged.' };
    const salt = b64ToBytes(pack.rec.salt);
    const bits = await deriveBits(password, salt);
    if (bytesToB64(bits) !== pack.rec.verifier) return { ok: false, error: 'Wrong password for that code.' };
    const vault = loadVault();
    vault.accounts[pack.username] = pack.rec;
    saveVault(vault);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: pack.username } satisfies Session));
    setSessionPassword(password);
    return { ok: true, username: pack.username };
  } catch {
    return { ok: false, error: 'Could not read that restore code.' };
  }
}

