// Checks the commits about to go to GitHub (rules in scripts/lib/push-check.mjs).
//   npm run check-push          → the commits on HEAD that origin doesn't have yet
//   .githooks/pre-push          → runs this with --hook; git passes the refs on stdin
// Exit 1 blocks the push. Findings name the commit, file and line, never the matched secret.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import {
  addedLines, checkFile, checkIdentity, checkText, contactFrom, HOSTS_EXEMPT, passwordFrom,
} from './lib/push-check.mjs';

const ZERO = /^0+$/;
const git = (...args) => execFileSync('git', ['-c', 'core.quotePath=false', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });

const hook = process.argv[2] === '--hook';
const remote = (hook ? process.argv[3] : null) || 'origin';

// Which commits: from git's pre-push input, or HEAD when run by hand.
let tips = ['HEAD'];
if (hook) {
  const input = readFileSync(0, 'utf8').trim();
  tips = input ? input.split('\n').map((l) => l.split(' ')[1]).filter((sha) => sha && !ZERO.test(sha)) : [];
}
const commits = [...new Set(tips.flatMap((tip) => git('rev-list', '--reverse', tip, '--not', `--remotes=${remote}`).split('\n').filter(Boolean)))];

// Exact strings that must never be pushed.
const secrets = [];
const loginFile = process.env.SQ_LOGIN_FILE || path.join(homedir(), 'sunsetsequence-preview-login.txt');
if (existsSync(loginFile)) secrets.push({ label: 'the preview password', value: passwordFrom(readFileSync(loginFile, 'utf8')) });
else console.log(`check-push: no login file (${loginFile}), password check skipped`);
if (existsSync('src/site.ts')) secrets.push({ label: 'the contact address written in full', value: contactFrom(readFileSync('src/site.ts', 'utf8')) });

const findings = [];
for (const sha of commits) {
  const [short, authorEmail, committerEmail, message] = git('log', '-1', '--format=%h%x00%ae%x00%ce%x00%B', sha).split('\0');
  const commit = { short, authorEmail, committerEmail };
  findings.push(...checkIdentity(commit));
  findings.push(...checkText(message, `${short} (commit message)`, secrets));

  const diff = git('diff-tree', '-p', '--unified=0', '--no-color', '--no-ext-diff', '--root', '-m', '--first-parent', '--no-commit-id', sha);
  for (const a of addedLines(diff)) {
    findings.push(...checkText(a.text, `${short} ${a.file}:${a.line}`, secrets, { hosts: !HOSTS_EXEMPT.includes(a.file) }));
  }

  const files = git('diff-tree', '-r', '--root', '-m', '--first-parent', '--no-commit-id', '--diff-filter=AMCR', sha).split('\n').filter(Boolean);
  for (const row of files) {
    const [meta, path] = row.split('\t');
    const blob = meta.split(' ')[3];
    findings.push(...checkFile(path, Number(git('cat-file', '-s', blob).trim()), short));
  }
}

const unique = [...new Set(findings)];
if (unique.length) {
  console.error(`check-push: ${unique.length} problem(s) in ${commits.length} commit(s), push blocked:`);
  for (const f of unique) console.error(`  ${f}`);
  console.error('Fix the commits (or extend the allowlist in scripts/lib/push-check.mjs on purpose), then push again.');
  process.exit(1);
}
console.log(`check-push: ${commits.length} commit(s) checked, nothing found.`);
