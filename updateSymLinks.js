require('dotenv').config();
const accounts = require('./accounts.js');
const { 
	SANDBOX_LOCALDATA_PATH, 
	MASTER_DIR_NAME
} = process.env;
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

symlinkAllDirs();