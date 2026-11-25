# Master Duel account manager

Windows command-line helpers for switching between accounts in an existing
Sandboxie Steam setup and sharing one account's downloaded game data.
There is no graphical installer or standalone release.

## Set up

1. Use an existing Sandboxie installation and Steam installation. Launch each
   account once in the same sandbox so its Master Duel `LocalData` account folder
   and `0000` download folder exist. Finish the downloads on one account.
2. In this project directory, run `npm ci`.
3. Copy `accounts.sample.js` to `accounts.js`. Replace the example usernames
   and passwords. The keys such as `"blue eyes"` are the names passed to the
   switch command.
4. Copy `.env.example` to `.env` and replace all example paths. Set
   `SANDBOX_APPLICATION_PATH` to Sandboxie's `Start.exe` and
   `STEAM_APPLICATION_PATH` to the Steam executable it should launch.
5. Set `SANDBOX_LOCALDATA_PATH` to that sandbox's Master Duel `LocalData`
   directory. It should contain the individual account folders. Set
   `MASTER_DIR_NAME` to the existing child folder for the account whose `0000`
   directory already contains the downloaded game data.

The launcher uses Sandboxie's default sandbox. The LocalData path must refer
to that same sandbox. See the [Sandboxie Start command-line documentation](https://sandboxie-plus.com/sandboxie/startcommandline/)
for how its default launch works.

## Share the downloads

Close Master Duel and sandboxed Steam, then run:

```text
node updateSymLinks.js
```

The helper replaces each other account's existing `0000` directory with a
Windows directory junction to the master account's downloads. Its original
directory is retained as `0000.before-sharing`, with a numbered suffix if that
backup name already exists. Sibling account files are preserved. Accounts
without a `0000` entry are skipped. Re-running keeps correct links intact.
If creating a junction fails, the original directory is restored.

## Switch accounts

```text
node app.js "blue eyes"
```

Use a key from your `accounts.js`. This restarts sandboxed Steam and Master
Duel with that account's login parameters; complete any Steam sign-in prompts.
The switch command does not configure download links, so run the sharing
helper separately after adding another account.

If another download is requested, check that the new account's `0000` junction
points to the populated master download folder and that `.env` refers to the
sandbox being launched.

## Development checks

`npm test` exercises directory sharing, retained data, failed-link rollback,
invalid paths, and literal launch arguments in temporary fixtures. It does not
start Steam, Sandboxie or Master Duel.
