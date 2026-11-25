const test = require('node:test');
const assert = require('node:assert/strict');
const { buildLaunchCommand } = require('../app');

const config = { SANDBOX_APPLICATION_PATH: 'C:/Program Files/Sandboxie/Start.exe',
                 STEAM_APPLICATION_PATH: 'C:/Program Files (x86)/Steam/Steam.exe' };

test('passes account credentials literally as individual native arguments', () => {
  const accounts = { 'blue eyes': { username: 'player', password: 'a & b " c % d' } };
  const command = buildLaunchCommand(config, accounts, 'blue eyes');
  assert.equal(command.file, config.SANDBOX_APPLICATION_PATH);
  assert.deepEqual(command.args, [config.STEAM_APPLICATION_PATH, '-login', 'player',
    'a & b " c % d', '-applaunch', '1449850']);
});

test('rejects an unknown account or incomplete configuration before launch', () => {
  const accounts = { 'blue eyes': { username: 'player', password: 'example' } };
  assert.throws(() => buildLaunchCommand(config, accounts, 'wrong key'), /Choose an account key/);
  assert.throws(() => buildLaunchCommand({}, accounts, 'blue eyes'), /SANDBOX_APPLICATION_PATH/);
  assert.throws(() => buildLaunchCommand(config, { empty: {} }, 'empty'), /username and password/);
});
