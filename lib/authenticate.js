const parseJSONfile = require("./parseJSONfile.js");
const authenticate = (data) => {/*{{{*/
	// check if data/accounts.json is ok
	try {
		parseJSONfile("storage/accounts.json");
	} catch(err) {
		console.error("storage/accounts.json:", err);
		//TODO show that database isn't working
		return { status: "incorect" };
	}
	let auth_data = { };
	let accounts = parseJSONfile("storage/accounts.json");
	if(!accounts[data.username]) {
		// incorect username
		return { status: "incorect" };
	}
	if(accounts[data.username].password != data.password) {
		// incorect password
		return { status: "incorect" };
	}
	Object.assign(auth_data, accounts[data.username]);
	if(!auth_data.username) {
		// if no special username, use the default one
		auth_data.username = data.username;
	}
	// TODO change the fact that username is stored in sessionStore
	// instead of the real accountname
	if(sessionStore.getAllUsernames().includes(data.username)) {
		return { status: "in use" };
	}
	return auth_data;
}/*}}}*/
module.exports = authenticate;
