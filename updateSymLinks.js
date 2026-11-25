const fs = require('node:fs');
const path = require('node:path');

function exists(file) {
  try { return fs.lstatSync(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function samePath(left, right) {
  return process.platform === 'win32'
    ? left.toLowerCase() === right.toLowerCase() : left === right;
}

function accountDirectory(root, name) {
  if (!name || name === '.' || name === '..' || /[\\/]/.test(name) || path.isAbsolute(name)) {
    throw new Error('MASTER_DIR_NAME must name one existing account folder inside LocalData.');
  }
  const directory = path.join(root, name);
  const info = exists(directory);
  if (!info || !info.isDirectory() || info.isSymbolicLink() ||
      !samePath(path.dirname(fs.realpathSync(directory)), root)) {
    throw new Error(`Account folder is missing or is a link: ${name}`);
  }
  return directory;
}

function planSharing(localData, masterName) {
  if (!localData) throw new Error('Set SANDBOX_LOCALDATA_PATH to the existing LocalData folder.');
  const root = fs.realpathSync(localData);
  const master = accountDirectory(root, masterName);
  const source = path.join(master, '0000');
  const sourceInfo = exists(source);
  if (!sourceInfo || !sourceInfo.isDirectory() || sourceInfo.isSymbolicLink() ||
      !samePath(fs.realpathSync(source), source)) {
    throw new Error('The master account needs an ordinary, existing 0000 download folder.');
  }
  const plans = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (samePath(entry.name, masterName) || !entry.isDirectory() || entry.isSymbolicLink()) continue;
    const directory = accountDirectory(root, entry.name);
    const target = path.join(directory, '0000');
    const info = exists(target);
    // Only existing account download entries participate. Other LocalData
    // directories are not assumed to be accounts.
    if (!info) continue;
    if (info.isSymbolicLink()) {
      if (!samePath(fs.realpathSync(target), source)) {
        throw new Error(`The 0000 link for ${entry.name} points elsewhere; no folders were changed.`);
      }
      continue;
    }
    if (!info.isDirectory()) throw new Error(`The 0000 path for ${entry.name} is not a folder.`);
    let backup = target + '.before-sharing';
    for (let suffix = 2; exists(backup); suffix++) backup = target + `.before-sharing.${suffix}`;
    plans.push({ account: entry.name, source, target, backup });
  }
  return plans;
}

function shareDownloads(localData, masterName) {
  // Preflight all accounts before changing any of them. Sibling account
  // metadata stays intact, and existing downloads remain in a backup folder.
  const plans = planSharing(localData, masterName);
  for (const plan of plans) {
    fs.renameSync(plan.target, plan.backup);
    try {
      fs.symlinkSync(plan.source, plan.target, 'junction');
    } catch (error) {
      if (!exists(plan.target)) fs.renameSync(plan.backup, plan.target);
      throw error;
    }
  }
  return plans;
}

if (require.main === module) {
  require('dotenv').config();
  try {
    const plans = shareDownloads(process.env.SANDBOX_LOCALDATA_PATH, process.env.MASTER_DIR_NAME);
    for (const plan of plans) {
      console.log(`Shared downloads for ${plan.account}`);
      console.log(`Original downloads retained at ${plan.backup}`);
    }
    if (!plans.length) console.log('No account download folders need updating.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { planSharing, shareDownloads };
