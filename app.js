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

function findProcessID(string = 'steam.exe', user = 'ANONYMOUS LOGIN') {
	let app =  shell.exec(`tasklist /v /fi "IMAGENAME eq ${string}" | findstr "${user}"`).stdout;
	app = app.replace(/\s+/g, ' ').split(' ');
	return app[1];
}

function killProcessID(processID) {
	shell.exec(`TASKKILL /f /PID ${processID}`);
}



function closeProcesses() {
	try {
		const steamProcessID = findProcessID('steam.exe');
		const masterDuelProcessID = findProcessID('masterduel.exe');
		killProcessID(steamProcessID);
		killProcessID(masterDuelProcessID);		
	} catch(error) {
		console.log("Unable to kill existing Processes. Perhaps they weren't running?");
	}

}

function main() {
	closeProcesses();
	launchAccount(ACCOUNT_SLUG);
}


closeProcesses();
launchAccount(ACCOUNT_SLUG);