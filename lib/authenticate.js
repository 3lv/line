const sync_mysql = require("sync-mysql");
const db_login = {
	host: "localhost",
	user: "line",
	password: "1234",
	database: "linedb",
};
const sync_con = new sync_mysql(db_login);
const authenticate = (login_data) => {/*{{{*/
	// check if data/accounts.json is ok
	const sql = `SELECT * FROM accounts
	WHERE \`username\` LIKE '${login_data.username}'`
	auth_data = sync_con.query(sql);
	if(auth_data.length == 0) {
		// incorrect username
		return { status: "incorrect" };
	}
	// get first match cuz unique anyways
	auth_data = auth_data[0];
	if(auth_data.password != login_data.password) {
		// incorrect password
		return { status: "incorrect" };
	}
	/*
	// Don't use auth_data.isActive (the one received from sql)
	// cuz it might be delayed
	if(auth_data.isActive == true) {
		return { status: "in use" };
	}
	*/
	const cazan = global.sessionStore.findSessionByUsername(auth_data.username);
	if(cazan && cazan.isActive == true) {
		return {status: "in use"};
	}
	return auth_data;
}/*}}}*/
module.exports = authenticate;
