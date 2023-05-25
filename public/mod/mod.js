document.getElementById("mod-send-message").addEventListener("click", () => {
	let message = { };
	message.text = document.getElementById("mod-message-input").value;
	document.getElementById("mod-message-input").value = "";
	if(message.text.length == 0) {
		return;
	}
	// if message it's command
	if(message.text.substring(0, 1) == ":") {
		//TODO for now commands don't work in mod-app
		//runCommand(message.text);
		return;
	}
	// render message in gray then send message. If everything's fine
	// render message normally or else ?delete it
	let message_container = renderMessage(
		"#mod-messagebox",
		"my-message",
		message
	);
	console.log(message_container);
	socket.emit("mod-message", message, (response) => {
		if(response.status == "suppressed") {
		} else if(response.status == "sent") {
			//100% sent
			message_container.classList.add("sent");
			// TODO move it where it stands
		}
	});
});
// message enter_key
document.getElementById("mod-message-input").addEventListener("keypress", function(event) {
	if (event.key == "Enter") {
		event.preventDefault();
		document.getElementById("mod-send-message").click();
	}
});
socket.on("mod-message", (message, callback) => {
	console.log("received mod message");
	renderMessage("#mod-messagebox", "other-message", message);
});
