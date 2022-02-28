require('dotenv').config();
const accounts = require('./accounts.js');
const { 
	SANDBOX_LOCALDATA_PATH, 
	MASTER_DIR_NAME,
	SANDBOX_APPLICATION_PATH,
	STEAM_APPLICATION_PATH
} = process.env;
const ACCOUNT_SLUG = process.argv[2];
const shell = require('shelljs');
const fs = require('fs-extra');


function symlinkAllDirs() {
	let dirs = fs.readdirSync(SANDBOX_LOCALDATA_PATH);
	dirs = dirs.filter((value, index) => value != MASTER_DIR_NAME);
	for(const dir of dirs ) {
		fs.emptyDirSync(`${SANDBOX_LOCALDATA_PATH}/${dir}`);
		const symLinkCommand = `mklink /D "${SANDBOX_LOCALDATA_PATH}/${dir}/0000" "${SANDBOX_LOCALDATA_PATH}/${MASTER_DIR_NAME}/0000"`
		shell.exec(symLinkCommand);
	}
}


function launchAccount(name) {
	const { username, password } = accounts[name];
	const launchCommand = `"${SANDBOX_APPLICATION_PATH}" "${STEAM_APPLICATION_PATH}" -login ${username} ${password} -applaunch 1449850`
	shell.exec(launchCommand)
}

function findProcessIDs(string = 'steam.exe') {
	let apps =  shell.exec(`tasklist | findstr /B ${string}`).stdout;
	apps = apps.split('\r\n');

	const processIDs = [];

	for(let app of apps) {
		// skip empty strings
		if(app === '') {
			continue;
		}
		// trim it
		app = app.replace(/\s+/g, ' ').split(' ');

		if(app[1] && !isNaN( parseInt(app[1]) ) ) {
			processIDs.push( parseInt(app[1]) );
		}
	}

	return { maxProcessID: Math.max(...processIDs), processIDs };
}

function killProcessID(processID) {
	shell.exec(`TASKKILL /f /PID ${processID}`);
}



function closeProcesses() {
	const { maxProcessID: maxSteamProcessID, processIDs: steamProcessIDs } = findProcessIDs('steam.exe');
	const { maxProcessID: maxMasterDuelProcessID, processIDs: masterDuelProcessIDs } = findProcessIDs('masterduel.exe');

	if(steamProcessIDs.length > 1) {
		killProcessID(maxSteamProcessID);	
	}

	if(masterDuelProcessIDs.length > 1) {
		killProcessID(maxMasterDuelProcessID);	
	}
}


closeProcesses();
launchAccount(ACCOUNT_SLUG);