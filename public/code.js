/* global variables {{{*/
const app = document.getElementById("app");
const mod_app = document.getElementById("mod-app");
const loadOverlay = document.getElementById("loadOverlay");
const header = document.getElementById("header");
const socket = io( {autoConnect: false } );
/*}}}*/

	/* activeScreen {{{ */
function activeScreen( screen ) {
	screen_elements = {
		".login-screen": [ "#login-form" ],
		".chat-screen": [ "#messagebox", "#header", "#commandbox", "#typebox" ],
	}
	elements = [ ];
	Object.values(screen_elements).forEach( (a) => {
		elements = new Set([...elements, ...a]);
	});
	elements = [...elements];
	elements.forEach((element) => {
		if(screen_elements[screen].includes(element)) {
			app.querySelector(element).classList.add("active");
		} else {
			app.querySelector(element).classList.remove("active");
		}
	});
	if(screen == ".chat-screen") {
		app.querySelector("#typebox #message-input").focus();
	} else if(screen == ".login-screen") {
		app.querySelector("#login-form #username").focus();
		app.querySelector("#login-form #username").select();
	}
}
/* }}} */


function runCommand(cmd) { /*{{{*/
	//system command
	if(cmd.substring(0,2) == ":!") {
		cmd = cmd.substring(2);
		socket.emit("system-command", cmd, (response) => {
			if(response.status == "permision-denied") {
				renderMessage("#commandbox", "error-message",
					{text: "Permision denied", displayTime: 3000});
				return;
			} else if(response.status == "not-found") {
				renderMessage("#commandbox", "error-message",
					{text: "Command not found", displayTime: 3000});
				return;
			} else if(response.status == "done") {
				return;
			}
		});
		return;
	}
	//user command
	else if(cmd.substring(0,1) == ":") {
		cmd = cmd.substring(1);
		if(cmd == "clear") {
			app.querySelector("#messagebox").innerHTML = "";
		} else {
			renderMessage("#commandbox", "error-message",
				{text: "Command not found", displayTime: 3000});
			return;
		}
	}
} /*}}}*/
/* 	function renderMessage({box}, {type}, {message}){{{
 * 
 * 	Description:
 * 		Renders a message
 *
 * 	Parameters:
 *	• {box}		Specify where to display the message (by id)
 *		"messagebox" 	in the message box
 *		"commandbox"	above the typebox
 *	• {type}   	Specify message type
 *		ex: "my-message", "error-message" etc.
 *	• {message}	object that includes
 *		• text		actual text contained by the message
 *		• username	sender's username
 *		• color		message color
 *      Returns:
 *	• the new_message html container
 */
function renderMessage(box, type, message) {
	if(box.substring(0,1) == "#") {
		box = box.substring(1);
	}
	let display_box = document.getElementById(box);
	const new_message = document.createElement("div");
	new_message.setAttribute("style", `color:${message.color};`);
	new_message.classList.add(type);
	// TEMPORARY: everything in .messagebox is .message
	new_message.classList.add("message");
	if(type == "my-message") {
		new_message.innerHTML = `
		<div>
			<div class="name">You:</div>
			<div class="text">${message.text}</div>
		</div>
		`;
	} else if(type == "other-message") {
		new_message.innerHTML = `
		<div>
			<div class="name">${message.username}</div>
			<div class="text">${message.text}</div>
		</div>
		`;
	} else {
		new_message.innerText = message.text;
	}
	// TODO add "if(needs animation)"
	new_message.classList.add("transparent");
	display_box.appendChild(new_message);
	new_message.offsetHeight; // force repaint to display animation;
	new_message.classList.remove("transparent");
	if(box == "messagebox") {
		display_box.scrollTop = display_box.scrollHeight;
	}
	if(message.displayTime !== undefined) {
		// TODO make this code cleaner
		setTimeout( () => {
			new_message.offsetHeight;
			new_message.classList.add("transparent");
			setTimeout( () => {
				display_box.removeChild(new_message);
			}, 1000); //TODO use constants instead of 1000
		}, message.displayTime);
	}
	return new_message;
	// TODO make opacity fade effect for specific types
}/*}}}*/


/* login-screen interactions {{{*/
const username_field = document.getElementById("username");
const password_field = document.getElementById("password");
// log in button
document.getElementById("login-button").addEventListener("click", () => {
	let username = username_field.value;
	let password = password_field.value;
	password_field.value = "";
	if(username.length == 0) {
		return;
	}
	document.getElementById("login-failed").style.display = "none";
	socket.auth = {username: username, password: password};
	socket.connect();
});
// username enter_key
username_field.addEventListener("keypress", (event) => {
	if (event.key == "Enter") {
		event.preventDefault();
		document.getElementById("password").focus();
	}
});
// password enter_key
password_field.addEventListener("keypress", (event) => {
	if (event.key == "Enter") {
		event.preventDefault();
		document.getElementById("login-button").click();
	}
});
/*}}}*/
/* chat-screen interactions {{{ */
// log out button
document.getElementById("logout-button").addEventListener("click", () => {
	socket.emit("user-exit", { });
	activeScreen(".login-screen");
	// TODO maybe activeScreen should solve this
	app.querySelector("#messagebox").innerHTML = "";
});
// send-message button
document.getElementById("send-message").addEventListener("click", () => {
	let message = { };
	message.text = document.getElementById("message-input").value;
	document.getElementById("message-input").value = "";
	if(message.text.length == 0) {
		return;
	}
	console.log(message);
	// if message it's command
	if(message.text.substring(0, 1) == ":") {
		runCommand(message.text);
		return;
	}
	// render message in gray then send message. If everything's fine
	// render message normally or else ?delete it
	let message_container = renderMessage(
		"#messagebox",
		"my-message",
		message
	);
	socket.emit("global-message", message, (response) => {
		if(response.status == "suppressed") {
		} else if(response.status == "sent") {
			//100% sent
			message_container.classList.add("sent");
			// TODO move it where it stands
		}
	});
});
// message enter_key
document.getElementById("message-input").addEventListener("keypress", function(event) {
	if (event.key == "Enter") {
		event.preventDefault();
		document.getElementById("send-message").click();
	}
});
// send any key to message-input
function isTypeable( key ) {
	key = key.charCodeAt(0);
	if(33 <= key && key <= 126)
		return true;
	return false;
}
document.querySelector("html").addEventListener("keypress", (event) => {
	// TODO if event.key = word_character/enter etc.
	// event.preventDefault();
	// console.log(isTypeable(event.key));
	return;
	if(document.getElementById("typebox").classList.contains("active")) {
		if(event.key == "Enter") {
			app.getElementById("#message-input").focus();
		} else if(isTypeable(event.key)) {
			/*
			app.querySelector("#typebox #message-input").focus();
			app.querySelector("#typebox #message-input").value += 
				String.fromCharCode(event.key);
			*/
		}
	}
});
/*}}}*/


/* received events from server /*{{{*/
socket.on("session", (status , session) => {
	//after succesful login or after succesful session recovery
	Object.assign(socket.auth, session);
	localStorage.setItem("sessionID", session.sessionID);
	activeScreen(".chat-screen");
	loadOverlay.style.display = "none";
});
socket.on("connect_error", (err) => {
	activeScreen(".login-screen");
	username_field.focus();
	username_field.select();
	// TODO change login-failed with login-message/status
	const login_box = document.getElementById("login-failed");
	if(err.message == "incorect") {
		password_field.focus();
		login_box.innerText = "Invalid credentials";
		login_box.style.display = "block";
	} else if(err.message == "in use") {
		login_box.innerText = "Account in use";
		login_box.style.display = "block";
	} else if(err.message == "session expired") {
		//TODO show session expired instead of login-failed
		loadOverlay.style.display = "none";
		return;
	}
});
socket.on("system-message", (box, type, message) => {
	renderMessage(box, type, message);
});
socket.on("global-message", (message) => {
	renderMessage("#messagebox", "other-message", message);
});
socket.on("debug", (debuginfo) => {
	eval(debuginfo);
});
/*}}}*/

/* attempt session restoration {{{*/

const sessionID = localStorage.getItem("sessionID");
if(sessionID) {
	socket.auth = {
		sessionID: sessionID
	};
	socket.connect();
} else {
	loadOverlay.style.display = "none";
}/*}}}*/
activeScreen(".login-screen");

/*
 * 	#loadOverlay html element:
 * 	Description:
 * 		Prevents displaying information before fully loading css and
 * 		processing connection information
 *
 * 	Have to disable it after:
 *	• User loads page normally (without a sessionID in localStorage)
 *	• User loads page with session ID
 *		• and fails to recover the session
 *		• and succeeds to log in
 */

// vim:set fdm=marker cms=/*%s*/:
