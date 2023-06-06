/* global variables {{{*/
let __username = "";
class Message_hist {
	constructor() {
		this.hist = [];
		this.__begin = 0;
		this.__end = 0;
		this.__current = 0;
		this.MAXHIST = 10;
		this.__current_message = "";
	}
	size() {
		return this.__end - this.__begin;
	}
	push(elem) {
		this.hist[this.__end++] = elem;
		this.__current = this.__end;
		this.__current_message = "";
		if(this.size() > this.MAXHIST) {
			this.pop();
		}
	}
	pop() {
		delete this.hist[this.__begin++];
	}
	before() {
		if(this.__current == this.__end) {
			this.__current_message = document.getElementById("message-input").value;
		}
		if(this.size() == 0) {
			return this.__current_message;
		}
		if(this.__current == this.__begin) {
			return this.hist[this.__current];
		}
		return this.hist[--this.__current];
	}
	after() {
		if(this.__current == this.__end - 1) {
			++this.__current;
			return this.__current_message;
		}
		if(this.__current == this.__end) {
			return this.__current_message;
		}
		return this.hist[++this.__current];
	}
	current() {
		if(this.__current == this.__end) {
			return this.__current_message;
		}
		return this.hist[this.__current];
	}
}
const __message_hist = new Message_hist();
const app = document.getElementById("app");
const mod_app = document.getElementById("mod-app");
const loadOverlay = document.getElementById("loadOverlay");
const header = document.getElementById("header");
const socket = io( {autoConnect: false } );
function ta_autogrow(element) {
	// WIP
	element.style.height = "5px";
	element.style.height = element.scrollHeight + "px";
}
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
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
		let elem = app.querySelector(element);
		if(screen_elements[screen].includes(element)) {
			elem.classList.add("active");
		} else {
			elem.classList.remove("active");
		}
	});
	if(screen == ".chat-screen") {
		elem = document.getElementById("message-input");
		setTimeout((elem) => {
			const end = elem.value.length;
			elem.setSelectionRange(end, end);
			elem.focus();
		}, 100, elem);
	} else if(screen == ".login-screen") {
		elem = document.getElementById("username");
		setTimeout((elem) => {
			const end = elem.value.length;
			elem.setSelectionRange(end, end);
			elem.focus();
		}, 100, elem);
	}
}
/* }}} */
function runCommand(cmd) { /*{{{*/
	//cmd contains :! or : at the begining
	//system command
	if(cmd.substring(0,2) == ":!") {
		cmd = cmd.substring(2);
		socket.emit("system-command", cmd, (response) => {
			if(response.error) {
				renderMessage("#commandbox", "error-message",
					{text: response.error, displayTime: 3 * 1000});
				return;
			}
			if(response.info) {
				renderMessage("#commandbox", "info-message",
					{text: response.info, displayTime: 5 * 1000});
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
				{text: "Command not found", displayTime: 3 * 1000});
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
	let new_message;
	if(type == "my-message") {
		new_message = document.createElement("div");
		let name_elem = document.createElement("div");
		name_elem.classList.add("name");
		name_elem.innerText = "You:"
		new_message.appendChild(name_elem);
		let text_elem = document.createElement("div");
		text_elem.classList.add("text");
		let span = document.createElement("span");
		span.innerText = message.text;
		text_elem.appendChild(span);
		new_message.appendChild(text_elem);
	} else if(type == "other-message") {
		new_message = document.createElement("div");
		let name_elem = document.createElement("div");
		name_elem.classList.add("name");
		name_elem.innerText = message.username;
		new_message.appendChild(name_elem);
		let text_elem = document.createElement("div");
		text_elem.classList.add("text");
		let span = document.createElement("span");
		span.innerText = message.text;
		text_elem.appendChild(span);
		new_message.appendChild(text_elem);
	} else {
		new_message = document.createElement("div");
		new_message.innerText = message.text;
	}
	new_message.setAttribute("style", `color:${message.color};`);
	new_message.classList.add(type);
	if(message.status) {
		new_message.classList.add(message.status);
	}
	// TEMPORARY: everything in .messagebox is .message
	if(box == "messagebox") {
		new_message.classList.add("message");
	}
	if(!message.lazy) {
		new_message.classList.add("transparent");
	}
	display_box.appendChild(new_message);
	const span = new_message.querySelector(".text span");
	if(span) {
		const text = new_message.querySelector(".text");
		// shrink the message as much as possible without changing line organisation
		// scrollWidth
		const shrunkenWidth = (span.offsetWidth + 1) + "px";
		text.style.width = `min(100%, ${shrunkenWidth})`;
	}
	if(!message.lazy) {
		new_message.offsetHeight; // force repaint to display animation;
		new_message.classList.remove("transparent");
	}
	if(box == "messagebox") {
		display_box.scrollTop = display_box.scrollHeight;
		// TODO remove messages while too many messages
		/*
		if(display_box.children.length > 5) {
			unrenderMessage(display_box.firstChild, 0);
		}
		*/
	}
	if(message.displayTime !== undefined) {
		unrenderMessage(new_message, message.displayTime);
	}
	return new_message;
	// TODO make opacity fade effect for specific types
}/*}}}*/
function unrenderMessage(elem, delay) { /* {{{ */
	delay ||= 0;
	if(elem === undefined) {
		return;
	}
	setTimeout( (elem) => {
		elem.offsetHeight;
		elem.classList.add("transparent");
		setTimeout( (elem) => {
			elem.remove();
		}, 500, elem);
		// TODO use elem.style["transition-duration"] instead of 500
	}, delay, elem);
} /* }}} */

/* login-screen interactions {{{*/
const username_field = document.getElementById("username");
const password_field = document.getElementById("password");
// log in button
document.getElementById("login-button").addEventListener("click", () => {
	let username = username_field.value;
	username = username.trimStart().trimEnd();
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
	username_field.focus();
	// TODO maybe activeScreen should solve this
	app.querySelector("#messagebox").innerHTML = "";
});
// send-message button
document.getElementById("send-message").addEventListener("click", () => {
	let message = { };
	message.text = document.getElementById("message-input").value;
	__message_hist.push(message.text);
	document.getElementById("message-input").value = "";
	if(message.text.length == 0) {
		return;
	}
	if(message.text.length > 2000) {
		renderMessage("#commandbox", "error-message",
			{text: "Message too long", displayTime: 3 * 1000});
		return;
	}
	// if message it's command
	if(message.text.substring(0, 1) == ":") {
		runCommand(message.text);
		return;
	}
	// render message in gray then send message. If everything's fine
	// render message normally or else ?delete it
	message.status = "pending";
	let message_container = renderMessage(
		"#messagebox",
		"my-message",
		message
	);
	socket.emit("global-message", message, (response) => {
		if(response.error) {
			renderMessage("commandbox", "error-message",
				{text: response.error, displayTime: 3 * 1000});
			unrenderMessage(message_container, 1 * 1000);
		}
		if(response.status == "sent") {
			//100% sent
			message_container.classList.remove("pending");
			// TODO move it where it stands
		}
	});
});
// message-input keyboard shortcuts
document.getElementById("message-input").addEventListener("keydown", function(event) {
	// send message with Enter
	if(event.key == "Enter" && event.shiftKey == false) {
		event.preventDefault();
		document.getElementById("send-message").click();
		return;
	}
	// previous message with <C-P> or arrow_up
	if((event.ctrlKey && event.key == "p")
		|| event.key == "ArrowUp") {
		event.preventDefault();
		let _el = document.getElementById("message-input");
		_el.value = __message_hist.before();
		_el.selectionStart = _el.selectionEnd = _el.value.length;
		return;
	}
	if((event.ctrlKey && event.key == "n")
		|| event.key == "ArrowDown") {
		event.preventDefault();
		let _el = document.getElementById("message-input");
		_el.value = __message_hist.after();
		_el.selectionStart = _el.selectionEnd = _el.value.length;
		return;
	}
});
// WIP send any key to message-input
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
	const message_input = document.getElementById("message-input");
	if(document.getElementById("typebox").classList.contains("active")) {
		if(event.key == "Enter") { // TODO and shift key is not held down
			// if message_input already active
			if(document.activeElement === message_input) {
				return;
			}
			event.preventDefault();
			message_input.focus();
			return;
		} else if(isTypeable(event.key)) {
			/*
			app.querySelector("#typebox #message-input").focus();
			app.querySelector("#typebox #message-input").value += 
				String.fromCharCode(event.key);
			*/
			return;
		}
	}
});
/*}}}*/


/* received events from server /*{{{*/
socket.on("session", (status , session) => {
	//after succesful login or after succesful session recovery
	__username = session.username;
	Object.assign(socket.auth, session);
	localStorage.setItem("sessionID", session.sessionID);
	activeScreen(".chat-screen");
	loadOverlay.style.display = "none";
});
socket.on("connect_error", (err) => {
	//console.log(err);
	// TODO add a delay so it doesn't flash on short disconnections (holding F5)
	activeScreen(".login-screen");
	password_field.focus();
	//password_field.select();
	// TODO change login-failed with login-message/status
	const login_box = document.getElementById("login-failed");
	if(err.message == "incorrect") {
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
socket.on("command-output", (type, message) => {
	message.displayTime ||= 3000;
	renderMessage("#commandbox", type, message);
});
socket.on("global-message", (message) => {
	if(message.username == __username) {
		renderMessage("#messagebox", "my-message", message);
	}
	console.log(message);
	renderMessage("#messagebox", "other-message", message);
});
socket.on("user-joined-global-room", (username) => {
	renderMessage("#messagebox", "announcement", {text: `${username} joined the chat`});
});
socket.on("user-left-global-room", (username) => {
	renderMessage("#messagebox", "announcement", {text: `${username} left the chat`});
});
socket.on("debug", (debuginfo) => {
	eval(debuginfo);
});
socket.on("fetch", (messages) => {
	// TODO update the existing messages, don't delete all of them
	app.querySelector("#messagebox").innerHTML = "";
	if(messages.length > 200) {
		// I would not render all of those if i were you(tested and crashed)
		// TODO implement lazyload function that solves the above problem
		messages = messages.slice(-200);
	}
	for(let message of messages) {
		message.lazy = true;
		if(message.username == __username) {
			renderMessage("#messagebox", "my-message", message);
		} else {
			renderMessage("#messagebox", "other-message", message);
		}
	}

});
/*}}}*/

/* attempt session restoration {{{*/

const sessionID = localStorage.getItem("sessionID");
if(sessionID) {
	socket.auth = {
		sessionID: sessionID
	};
	sleep(5000);
	socket.connect();
} else {
	activeScreen(".login-screen");
	loadOverlay.style.display = "none";
}/*}}}*/

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
