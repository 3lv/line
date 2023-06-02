const mysql = require("mysql");
const sync_mysql = require("sync-mysql");
const formatUTCDate = require("./formatDate.js").formatUTCDate;
const q_create_db = "CREATE DATABASE linedb";
const db_login = {
	host: "localhost",
	user: "line",
	password: "1234",
	database: "linedb",
}
// escapes ' and \
function escapeMessage(message) {
	// NOT WORKING PROPERLY
	let e_message = message.toString().replace(/\\/g, "\\\\");
	e_message = e_message.replace(/'/g, "\\'");
	return e_message;
}
class MessageStore {
	constructor() {
		this.con = mysql.createConnection(db_login);
		this.sync_con = new sync_mysql(db_login);
		this.con.connect( (err) => {
			if(err) {
				console.error(err);
			}
		});
		this.message = "cazan";
	}
	findMessage() {
	}
	saveMessage(message) {
		if(message.type == "global-message") {
			const sql = `INSERT INTO global_messages (username, text)
			VALUES (?, ?)`;
			this.con.query(sql, [message.sender, message.text], (err, result) => {
				if (err) throw err;
				console.error(result.insertId);
			});
		}
	}
	deleteMessage() {
	}
	getLastMessages(count) {
		const sql = `
		SELECT * FROM (
			SELECT * 
			FROM global_messages
			ORDER BY id DESC LIMIT ${count})Var1
		ORDER BY id ASC`;
		const messages = this.sync_con.query(sql);
		return messages;
	}
	getMessages(time) {
		// from the last "time" ms
		const right_date = ((new Date()).getTime()) / 1000; //has to be in seconds
		const left_date = ((new Date()).getTime() - time) / 1000;
		const sql = `SELECT * 
		FROM global_messages WHERE  \`created_at\` 
		BETWEEN FROM_UNIXTIME(${left_date}) AND FROM_UNIXTIME(${right_date})`;
		/*
		this.con.query(sql, (err, result) => {
			if(err) throw err;
			console.log(result);
			return result;
		});
		*/
		const messages = this.sync_con.query(sql);
		return messages;
	}
}
module.exports = MessageStore;
