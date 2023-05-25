/* global variables {{{1*/
const express = require("express");
const path = require("path");
const app = express();
app.use(express.static(path.join(__dirname+"/public")));
const server = require("http").createServer(app);
const io = require("socket.io")(server);
// const uuid = requrie("uuid");
const crypto = require("crypto");
const randomID = () => crypto.randomBytes(8).toString("hex");
const _time = () => (new Date()).toTimeString().split(" ")[0];
const _date = () => (new Date()).toDateString().split(" ")[0];
sessionStore = new (require("./lib/sessionStore.js"))();
const auth = require("./lib/authenticate.js");
const runCmd = require("./lib/runCommand.js");
const _inject_mod_string = require("./lib/inject_modapp_string.js");
/* }}} */

function invalidRequest(socket) {/*{{{*/
	// WIP
	// TODO actually use the function
	//TODO: ban ip
	sessionStore.deleteSession(socket.session.sessionID);
	socket.disconnect();
}/*}}}*/


io.use((socket, next) => {/*{{{*/
	if(socket.session) {
		return next();
	}
	const sessionID = socket.handshake.auth.sessionID;
	if(sessionID) {
		// try to recover session searching sessionID
		session = sessionStore.findSession(sessionID);
		if(session) {
			if(session.status == "active") {
				// maybe sessionID was shared?
				return next(new Error("session in use"));
			}
			// TODO change word "delete" to "expire"
			// stop session deletion
			clearTimeout(session.deleteTimeout);
			delete session.deleteTimeout;
			// set session active
			session.status = "active";
			// restore session in socket
			socket.session = session;
			// announce client session it's restored
			socket.emit("session", "recovered", {
				sessionID: session.sessionID,
				username: session.username,
			});
			if(socket.session.mod == true) {
				socket.join("mod-room");
				socket.emit("debug", _inject_mod_string);
			}
			return next();
		} else {
			// sessionID is not a valid session
			// (fake sessionID or expired)
			return next(new Error("session expired"));
		}
	} else {
		// verify auth data and store details about user
		auth_details = auth(socket.handshake.auth);
		if(auth_details.status !== "done" && auth_details.status !== undefined) {
			return next(new Error(auth_details.status));
		}
		///authenticated
		// create new session and store it
		let session = { };
		session.sessionID = randomID();
		session.status = "active";
		Object.assign(session, auth_details);
		sessionStore.saveSession(session.sessionID, session);

		// store session in socket
		socket.session = session;

		// announce the new session
		// TODO don't send all session info
		socket.emit("session", "new_session", {
			sessionID: session.sessionID,
			username: session.username,
		});
		if(socket.session.mod == true) {
			socket.join("mod-room");
			socket.emit("debug", _inject_mod_string);
		}
		if(!session.hidden) {
			socket.broadcast.emit( "system-message", "#messagebox", "announcement",
				{ text: `${socket.session.username} joined the chat` }
			);
		}
		return next();
	}
	return next();
});/*}}}*/

/* received events from clients {{{*/
io.on("connection", (socket) => {
	socket.on("global-message", (message, callback) => {/*{{{*/
		if( typeof callback !== "function" ) {
			// TODO use invalidRequest function
			return socket.disconnect();
		}
		console.log(_time()+" "+socket.handshake.address+" "+socket.session.username+" "+message.text);
		if( socket.session.hidden == true ) {
			callback({ status: "suppressed" });
			console.log("message suppressed cuz hidden");
			return;
		}
		socket.broadcast.emit( "global-message",
			{ 	username: socket.session.username,
				text:     message.text,
				image:    "" }
		);
		callback({ status: "sent" });
	});/*}}}*/
	socket.on("mod-message", (message, callback) => { /* {{{ */
		console.log("sending mod message");
		if(typeof callback !== "function") {
			return socket.disconnect();
		}
		socket.to("mod-room").emit( "mod-message",
			{	username: socket.session.username,
				text:	  message.text,
				image:	  "" }
		);
		callback({ status: "sent" });
	}); /* }}} */
	socket.on("system-command", (cmd, callback) => {/*{{{*/
		if( typeof callback !== "function" ) {
			return socket.disconnect();
		}
		if(socket.session.sudo != true) {
			callback({
				status: "permision-denied"
			});
			return;
		}
		console.log(":!" + cmd);
		let s = runCmd(socket, cmd);
		callback({
			status: s
		});
	});/*}}}*/
	socket.on("user-exit", (data) => {/*{{{*/
		socket.disconnect();
	});/*}}}*/
	socket.on("disconnecting", (reason) => {/*{{{*/
		let session = socket.session;
		if(session == undefined) {
			return;
		}
		session.status = "nonactive";
		Object.assign(socket, session);
		// start a deleteTimeout for the inactive session
		if(reason == "client namespace disconnect" || reason =="server namespace disconnect") {
			sessionStore.deleteSession(session);
				if(!socket.hidden) {
					socket.broadcast.emit( "system-message", "#messagebox", "announcement",
						{ text: `${socket.username} left the chat` }
					);
				}
		} else {
			session.deleteTimeout = setTimeout( () => {
				if(session == undefined) {
					return;
				}
				sessionStore.deleteSession(session);
				if(!socket.hidden) {
					socket.broadcast.emit( "system-message", "#messagebox", "announcement",
						{ text: `${socket.username} left the chat` }
					);
				}
			}, sessionStore.__sessionTimeout);
		}
	});/*}}}*/
});/*}}}*/


server.listen(5000);

// vim:set fdm=marker cms=/*%s*/:
