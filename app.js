function buildLaunchCommand(config, accounts, name) {
  if (!Object.prototype.hasOwnProperty.call(accounts, name)) {
    throw new Error('Choose an account key from accounts.js, for example: node app.js "blue eyes"');
  }
  const { username, password } = accounts[name];
  if (typeof username !== 'string' || !username.length ||
      typeof password !== 'string' || !password.length) {
    throw new Error('The selected account needs a username and password in accounts.js.');
  }
  for (const key of ['SANDBOX_APPLICATION_PATH', 'STEAM_APPLICATION_PATH']) {
    if (typeof config[key] !== 'string' || !config[key].trim()) throw new Error(`Set ${key} in .env.`);
  }
  return {
    file: config.SANDBOX_APPLICATION_PATH,
    args: [config.STEAM_APPLICATION_PATH, '-login', username, password, '-applaunch', '1449850']
  };
}

function findProcessID(image = 'steam.exe', user = 'ANONYMOUS LOGIN') {
  const shell = require('shelljs');
  const output = shell.exec(`tasklist /v /fi "IMAGENAME eq ${image}" | findstr "${user}"`).stdout;
  return output.replace(/\s+/g, ' ').split(' ')[1];
}

function killProcessID(processID) {
  if (/^\d+$/.test(String(processID))) require('shelljs').exec(`TASKKILL /f /PID ${processID}`);
}

function closeProcesses() {
  try {
    killProcessID(findProcessID('steam.exe'));
    killProcessID(findProcessID('masterduel.exe'));
  } catch (error) {
    console.log('Unable to close existing sandboxed Steam or Master Duel processes.');
  }
}

function main() {
  require('dotenv').config();
  const command = buildLaunchCommand(process.env, require('./accounts.js'), process.argv[2]);
  const fs = require('node:fs');
  for (const file of [command.file, command.args[0]]) {
    if (!fs.statSync(file).isFile()) throw new Error('Configure existing Sandboxie Start.exe and Steam.exe paths in .env.');
  }
  // Resolve the account and executable paths before stopping a running game.
  closeProcesses();
  const result = require('node:child_process').spawnSync(command.file, command.args,
    { stdio: 'inherit', shell: false, windowsHide: true });
  if (result.error) throw new Error(result.error.message);
  process.exitCode = result.status === null ? 1 : result.status;
}

if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { buildLaunchCommand };
