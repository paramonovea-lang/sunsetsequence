// Rules for what may be pushed to the public GitHub repository (scripts/check-push.mjs runs them
// from the pre-push hook). Pure functions: they get text, never read git or files themselves.
// A finding names the place and the rule, never the matched secret.

export const NOREPLY = /@users\.noreply\.github\.com$/i;

/** Files whose links are third-party metadata, not hosts the project chose. */
export const HOSTS_EXEMPT = ['package-lock.json'];

// Hosts the repository may name. A new one is added here on purpose (CLAUDE.md: the repo must
// never name the owner's other servers or domains).
export const ALLOWED_HOSTS = [
  'sunsetsequence.com', 'strudel.cc', 'strudel.b-cdn.net', 'tidalcycles.org',
  'github.com', 'github.io', 'githubusercontent.com', 'codeberg.org',
  'creativecommons.org', 'gnu.org', 'fsf.org', 'openfontlicense.org', 'sil.org',
  'googleapis.com', 'gstatic.com', 'w3.org', 'schema.org', 'audacityteam.org',
  'cloudsmith.io', 'npmjs.org', 'hoster.kz', 'claude.ai', 'example.com', 'example.org',
  'localhost', '127.0.0.1',
];

const ALLOWED_EMAILS = [NOREPLY, /@example\.(com|org)$/i, /^noreply@anthropic\.com$/i];

const SECRETS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, 'a GitHub token'],
  [/\bsk-[A-Za-z0-9_-]{20,}/, 'an API key (sk-…)'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'an AWS access key'],
  [/\bxox[abpr]-[A-Za-z0-9-]{10,}/, 'a Slack token'],
];

const BLOCKED_FILES = [
  [/\.(wav|mp3|flac|aiff?|ogg|m4a)$/i, 'an audio file (release audio stays out of the repo)'],
  [/\.bundle$/i, 'a git bundle (old history stays local)'],
  [/(^|\/)\.env(\.|$)/i, 'an .env file'],
  [/\.(pem|key|p12|pfx)$/i, 'a key or certificate file'],
  [/(^|\/)id_(rsa|ed25519|ecdsa|dsa)(\.pub)?$/i, 'an SSH key file'],
];

export const MAX_FILE_BYTES = 2 * 1024 * 1024;

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const URL_HOST = /\b(?:https?|wss?|ftp):\/\/([A-Za-z0-9.-]+)/g;

export function hostAllowed(host) {
  const h = host.toLowerCase().replace(/\.$/, '');
  return ALLOWED_HOSTS.some((a) => h === a || h.endsWith(`.${a}`));
}

/** Author and committer must use the GitHub noreply address. */
export function checkIdentity(commit) {
  const out = [];
  for (const [role, email] of [['author', commit.authorEmail], ['committer', commit.committerEmail]]) {
    if (!NOREPLY.test(email ?? '')) out.push(`${commit.short}: ${role} email is not the GitHub noreply address`);
  }
  return out;
}

/**
 * Checks one piece of text (an added line or a commit message).
 * `secrets` are exact strings that must never appear (the preview password, the contact address).
 * `hosts: false` skips the host rule (package-lock.json lists npm packages' own funding links).
 */
export function checkText(text, where, secrets = [], { hosts = true } = {}) {
  const out = [];
  for (const [re, what] of SECRETS) if (re.test(text)) out.push(`${where}: ${what}`);
  for (const s of secrets) if (s.value && text.includes(s.value)) out.push(`${where}: ${s.label}`);
  for (const m of text.matchAll(EMAIL)) {
    if (!ALLOWED_EMAILS.some((re) => re.test(m[0]))) out.push(`${where}: an email address`);
  }
  for (const m of hosts ? text.matchAll(URL_HOST) : []) {
    if (!hostAllowed(m[1])) out.push(`${where}: host "${m[1]}" is not on the allowlist (scripts/lib/push-check.mjs)`);
  }
  return [...new Set(out)];
}

/** Checks a file added or changed by a commit. */
export function checkFile(path, bytes, short) {
  const out = [];
  for (const [re, what] of BLOCKED_FILES) if (re.test(path)) out.push(`${short} ${path}: ${what}`);
  if (bytes > MAX_FILE_BYTES) out.push(`${short} ${path}: larger than 2 MB`);
  return out;
}

/**
 * Added lines from `git show --unified=0 --format=` output, as { file, line, text }.
 * Only lines starting with "+" count; the line number is the one in the new file.
 */
export function addedLines(diff) {
  const out = [];
  let file = null;
  let line = 0;
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++ ')) { file = raw.slice(4).replace(/^b\//, ''); continue; }
    if (raw.startsWith('--- ')) continue;
    const hunk = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) { line = Number(hunk[1]); continue; }
    if (raw.startsWith('+') && file && file !== '/dev/null') { out.push({ file, line, text: raw.slice(1) }); line++; }
  }
  return out;
}

/** The preview password from the login file text ("Password: …" line), or null. */
export function passwordFrom(loginText) {
  return loginText.match(/^Password:\s*(.+)$/m)?.[1]?.trim() || null;
}

/** The contact address, rebuilt from SITE.contact in src/site.ts (never written in full anywhere). */
export function contactFrom(siteSource) {
  const m = siteSource.match(/contact:\s*\{\s*user:\s*'([^']+)',\s*domain:\s*'([^']+)'/);
  return m ? `${m[1]}@${m[2]}` : null;
}
