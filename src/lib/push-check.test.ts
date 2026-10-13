// The pre-push rules (scripts/lib/push-check.mjs). Fake secrets are built from pieces so this
// file itself passes the check when it is pushed.
import { describe, expect, it } from 'vitest';
import {
  addedLines, checkFile, checkIdentity, checkText, contactFrom, hostAllowed, passwordFrom,
} from '../../scripts/lib/push-check.mjs';

const at = '@';
const noreply = `1+someone${at}users.noreply.github.com`;

describe('checkIdentity', () => {
  it('accepts the GitHub noreply address', () => {
    expect(checkIdentity({ short: 'abc', authorEmail: noreply, committerEmail: noreply })).toEqual([]);
  });
  it('blocks any other address for author or committer', () => {
    const out = checkIdentity({ short: 'abc', authorEmail: `me${at}mail.test`, committerEmail: noreply });
    expect(out).toEqual(['abc: author email is not the GitHub noreply address']);
  });
});

describe('checkText', () => {
  it('passes ordinary code and allowed links', () => {
    expect(checkText(`fetch('https://strudel.b-cdn.net/piano.json') // ${noreply}`, 'f:1')).toEqual([]);
  });
  it('finds tokens and keys without echoing them', () => {
    const token = 'gh' + 'p_' + 'a1'.repeat(18);
    const key = '-----BEGIN ' + 'OPENSSH PRIVATE KEY-----';
    const out = checkText(`${token} ${key}`, 'f:2');
    expect(out).toEqual(['f:2: a private key', 'f:2: a GitHub token']);
    expect(out.join()).not.toContain(token);
  });
  it('finds email addresses other than noreply and example ones', () => {
    expect(checkText(`write to me${at}mail.test`, 'f:3')).toEqual(['f:3: an email address']);
    expect(checkText(`a${at}example.com, noreply${at}anthropic.com`, 'f:3')).toEqual([]);
  });
  it('finds exact secrets such as the preview password', () => {
    const out = checkText('the pass is hunter2-xyz', 'f:4', [{ label: 'the preview password', value: 'hunter2-xyz' }]);
    expect(out).toEqual(['f:4: the preview password']);
  });
  it('blocks hosts that are not on the allowlist', () => {
    expect(checkText('see ' + 'https://' + 'my-other-server.test/x', 'f:5')).toEqual([
      'f:5: host "my-other-server.test" is not on the allowlist (scripts/lib/push-check.mjs)',
    ]);
    expect(checkText('fund ' + 'https://' + 'opencollective.example.net', 'package-lock.json:9', [], { hosts: false })).toEqual([]);
    expect(hostAllowed('www.github.com')).toBe(true);
    expect(hostAllowed('notgithub.com')).toBe(false);
  });
});

describe('checkFile', () => {
  it('blocks audio, bundles, env and key files, and big files', () => {
    expect(checkFile('media/audio/sq-001.wav', 10, 'abc')).toHaveLength(1);
    expect(checkFile('../history.bundle', 10, 'abc')).toHaveLength(1);
    expect(checkFile('.env', 10, 'abc')).toHaveLength(1);
    expect(checkFile('keys/id_ed25519', 10, 'abc')).toHaveLength(1);
    expect(checkFile('public/og-default.png', 3 * 1024 * 1024, 'abc')).toEqual(['abc public/og-default.png: larger than 2 MB']);
    expect(checkFile('src/site.ts', 2000, 'abc')).toEqual([]);
  });
});

describe('helpers', () => {
  it('reads added lines with their new line numbers', () => {
    const diff = ['--- a/x.ts', '+++ b/x.ts', '@@ -3,0 +4,2 @@', '+one', '+two', '@@ -9 +11 @@', '-old', '+new'].join('\n');
    expect(addedLines(diff)).toEqual([
      { file: 'x.ts', line: 4, text: 'one' },
      { file: 'x.ts', line: 5, text: 'two' },
      { file: 'x.ts', line: 11, text: 'new' },
    ]);
  });
  it('reads the password line and rebuilds the contact address', () => {
    expect(passwordFrom('Username: preview\nPassword:  s3cret \n')).toBe('s3cret');
    expect(passwordFrom('nothing here')).toBeNull();
    expect(contactFrom("contact: { user: 'me', domain: 'mail.test' },")).toBe(`me${at}mail.test`);
  });
});
