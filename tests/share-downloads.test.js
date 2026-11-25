const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { planSharing, shareDownloads } = require('../updateSymLinks');

function fixture(t) {
  const parent = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(parent, 'masterduel-sharing-'));
  t.after(() => {
    assert.equal(path.dirname(root), parent);
    assert.match(path.basename(root), /^masterduel-sharing-/);
    assert.equal(fs.realpathSync(root), root);
    fs.rmSync(root, { recursive: true });
  });
  for (const name of ['master', 'other']) fs.mkdirSync(path.join(root, name, '0000'), { recursive: true });
  fs.writeFileSync(path.join(root, 'master', '0000', 'shared.bin'), 'downloaded game data');
  fs.writeFileSync(path.join(root, 'other', '0000', 'original.bin'), 'original account download');
  fs.writeFileSync(path.join(root, 'other', 'account.json'), 'account-specific settings');
  return root;
}

test('shares only downloads and keeps original data plus account metadata', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, 'not-an-account'));
  const plans = shareDownloads(root, 'master');
  assert.equal(plans.length, 1);
  assert.equal(fs.readFileSync(path.join(root, 'other', '0000', 'shared.bin'), 'utf8'), 'downloaded game data');
  assert.equal(fs.readFileSync(path.join(root, 'other', '0000.before-sharing', 'original.bin'), 'utf8'), 'original account download');
  assert.equal(fs.readFileSync(path.join(root, 'other', 'account.json'), 'utf8'), 'account-specific settings');
  assert.equal(fs.existsSync(path.join(root, 'not-an-account', '0000')), false);
  assert.deepEqual(shareDownloads(root, 'master'), []);
  assert.equal(fs.existsSync(path.join(root, 'other', '0000.before-sharing.2')), false);
});

test('a wrong existing link aborts preflight without touching another account', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, 'wrong'));
  fs.symlinkSync(path.join(root, 'other', '0000'), path.join(root, 'wrong', '0000'), 'junction');
  assert.throws(() => shareDownloads(root, 'master'), /points elsewhere/);
  assert.equal(fs.existsSync(path.join(root, 'other', '0000.before-sharing')), false);
  assert.equal(fs.readFileSync(path.join(root, 'other', '0000', 'original.bin'), 'utf8'), 'original account download');
});

test('a failed junction creation restores the original download directory', t => {
  const root = fixture(t);
  const createLink = fs.symlinkSync;
  fs.symlinkSync = () => { throw new Error('simulated junction creation failure'); };
  try { assert.throws(() => shareDownloads(root, 'master'), /junction creation failure/); }
  finally { fs.symlinkSync = createLink; }
  assert.equal(fs.readFileSync(path.join(root, 'other', '0000', 'original.bin'), 'utf8'), 'original account download');
  assert.equal(fs.existsSync(path.join(root, 'other', '0000.before-sharing')), false);
});

test('invalid master names and a missing download folder cannot mutate data', t => {
  const root = fixture(t);
  for (const name of ['..', '../other', 'other/0000', 'missing']) assert.throws(() => planSharing(root, name));
  fs.renameSync(path.join(root, 'master', '0000'), path.join(root, 'master', 'not-downloaded'));
  assert.throws(() => shareDownloads(root, 'master'), /existing 0000/);
  assert.equal(fs.existsSync(path.join(root, 'other', '0000.before-sharing')), false);
});
