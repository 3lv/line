/* global variables {{{1*/
const express = require("express");
const path = require("path");
const app = express();
app.use(express.static(path.join(__dirname+"/public")));
const server = require("http").createServer(app);
const io = require("socket.io")(server);
global.io = io;
// const uuid = requrie("uuid");
const crypto = require("crypto");
const randomID = () => crypto.randomBytes(8).toString("hex");
const _time = () => (new Date()).toTimeString().split(" ")[0];
const _date = () => (new Date()).toDateString().split(" ")[0];
sessionStore = new (require("./lib/sessionStore.js"))();
global.sessionStore = sessionStore;
messageStore = new (require("./lib/messageStore.js"))();
global.messageStore = messageStore;
const auth = require("./lib/authenticate.js");
const runCmd = require("./lib/runCommand.js");
const formatDate = require("./lib/formatDate.js");
const _inject_mod_string = require("./lib/inject_modapp_string.js");
/* }}} */
function invalidRequest(socket) {/*{{{*/
	// WIP
	// TODO actually use the function
	//TODO: ban ip
	sessionStore.deleteSession(socket.session.sessionID);
	socket.disconnect();
}/*}}}*/
function deleteSessionVerbose(session) {
	const session_copy = {...session};
	sessionStore.deleteSession(session);
	if(!session_copy.isHidden) {
		io.emit("user-left-global-room", session_copy.username);
	}
}

io.use((socket, next) => {/*{{{*/
	if(socket.session) {
		return next();
	}
	let session;
	let session_status = "none";
	const sessionID = socket.handshake.auth.sessionID;
	if(sessionID) {
		// try to recover session searching sessionID
		session = sessionStore.findSession(sessionID);
		if(session === undefined) {
			return next(new Error("session expired"));
		}
		if(session.isActive == true) {
			// maybe sessionID was shared?
			return next(new Error("session in use"));
		}
		session_status = "recovered";
		// TODO change word "delete" to "expire"
		// stop session deletion
		clearTimeout(session.deleteTimeout);
		delete session.deleteTimeout;
		if(session_status == "recovered") {
			//restore missed messages
		}
		// set session active
		session.isActive = true;
		session.disconnectTime = 0;
	} else {
		// verify auth data and store details about user
		auth_details = auth(socket.handshake.auth);
		if(auth_details.status !== "done" && auth_details.status !== undefined) {
			//console.debug(auth_details.status);
			return next(new Error(auth_details.status));
		}
		///authenticated
		session = {
			sessionID: randomID(),
			...auth_details,
			isActive: true,
			specs: socket.handshake.headers["user-agent"],
			IP: socket.handshake.address,
			spamscore: { messages:  0}
		};
		session_status = "created";
	}
	// TODO save specs and IP in gathered_data json format in accounts table
	// save/update session in sessionStore
	sessionStore.saveSession(session.sessionID, session);
	// store/restore session in socket
	socket.session = session;
	// link socket in session
	session.socket = socket;
	// announce the new session
	// TODO don't send all session info
	socket.emit("session", session_status, {
		sessionID: session.sessionID,
		username: session.username,
	});
	if(socket.session.isMod) {
		socket.join("mod-room");
		socket.emit("debug", _inject_mod_string);
	}
	if(!session.isHidden && session_status == "created") {
		socket.broadcast.emit("user-joined-global-room", socket.session.username);
	}
	return next();
});/*}}}*/

/* received events from clients {{{*/
io.on("connection", (socket) => {
	socket.on("global-message", (message, callback) => {/*{{{*/
		if(typeof callback !== "function") {
			return invalidRequest(socket);
		}
		if(message.text.length > 2000) {
			return invalidRequest(socket);
		}
		if(socket.session.spamscore.messages >= 2) {
			callback({
				error: "Slow down.."
			});
			return;
			//TODO jumpscare
		}
		socket.session.spamscore.messages++;
		setTimeout((socket)=>{socket.session.spamscore.messages--;}, 5 * 1000, socket);
		console.log(_time()+" "+socket.handshake.address+" "+socket.session.username+" "+message.text);
		message.opts = {};
		if(socket.session.isHidden) {
			message.opts.isHidden = true;
			callback({ status: "suppressed" });
			console.log("message suppressed cuz hidden");
			return;
		}
		message.type = "global-message";
		message.sender = socket.session.username;
		messageStore.saveMessage(message);
		// WIP ?considering using event object
		// easier to store and send at the same time
		event = {
			rooms: [],
			name: "global-message",
			args: [{
				username: socket.session.username,
				text:     message.text,
				image:    "" }],
			date: new Date()
		};
		socket.broadcast.emit(event.name, ...event.args);
		callback({ status: "sent" });
	});/*}}}*/
	socket.on("mod-message", (message, callback) => { /* {{{ */
		if(typeof callback !== "function") {
			return invalidRequest(socket);
		}
		if(message.text.length > 2000) {
			return invalidRequest(socket);
		}
		console.log(_time()+" [mod-message] "+socket.session.username+" "+message.text);
		socket.to("mod-room").emit( "mod-message",
			{	username: socket.session.username,
				text:	  message.text,
				image:	  "" }
		);
		callback({ status: "sent" });
	}); /* }}} */
	socket.on("system-command", (cmd, callback) => {/*{{{*/
		if( typeof callback !== "function" ) {
			return invalidRequest(socket);
		}
		if(cmd.length > 2000) {
			return;
		}
		if(socket.session.isSudo != true) {
			callback({
				error: "Permision denied"
			});
			return;
		}
		console.log(":!" + cmd);
		runCmd(socket, cmd, callback); // includes the callback
	});/*}}}*/
	socket.on("user-exit", (data) => {/*{{{*/
		socket.disconnect();
	});/*}}}*/
	socket.on("disconnecting", (reason) => {/*{{{*/
		let session = socket.session;
		if(session === undefined) {
			// if reloading really fast socket.session might not be set
			return;
		}
		session.isActive = false;
		session.disconnectTime = new Date();
		// start a deleteTimeout for the inactive session
		if(reason == "client namespace disconnect"
			|| reason =="server namespace disconnect") {
			deleteSessionVerbose(session);
		} else {
			session.deleteTimeout = setTimeout(
				deleteSessionVerbose,
				sessionStore.__sessionTimeout,
				session //function args
			);
		}
	});/*}}}*/
});/*}}}*/


server.listen(5000);

// vim:set fdm=marker cms=/*%s*/:
