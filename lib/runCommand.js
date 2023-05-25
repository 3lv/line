function runCommand(socket, cmd) {/*{{{*/
	// TODO better args parsing
	cmd = cmd.trim();
	const args = cmd.split(" ");
	//separete first word
	cmd = cmd.substring(args[0].length + 1);
	cmd.trim();
	if(args[0] == "message") {
		let color = "#a0a0a0";
		let text = "";
		for(let i = 1; i < args.length; i++) {
			if(args[i].substring(0,2) == "\\#") {
				color = args[1].substring(1);
			} else {
				text = text + args[i];
			}
		}
		io.emit( "system-message", "#messagebox", "announcement",
			{text: text, color: color}
		);
		return "done";
	} else if(args[0] == "hide") {
		targets = [];
		if(args.length == 1) {
			targets.push(socket.session);
		} else {
			for(let i = 1; i < args.length; i++) {
				var session = sessionStore.findSessionByUsername(args[i]);
				targets.push(session);
			}
		}
		for( target of targets) {
			if(target.hidden) {
				//target already hidden
				continue;
			} 
			target.hidden = true;
			io.emit( "system-message", "#messagebox", "announcement",
				{ text: `${target.username} left the chat` }
			);
		}
		return "done";
	} else if(args[0] == "unhide") {
		targets = [];
		if(args.length == 1) {
			targets.push(socket.session);
		} else {
			for(let i = 1; i < args.length; i++) {
				let session = sessionStore.findSessionByUsername(args[i]);
				targets.push(session);
			}
		}
		for( target of targets) {
			if(!target.hidden) {
				//target already visible
				continue;
			} 
			target.hidden = false;
			io.emit( "system-message", "#messagebox", "announcement",
				{ text: `${target.username} joined the chat` }
			);
		}
		return "done";
	} else if(args[0] == "who") {
		let usernames = sessionStore.getAllUsernames();
		let new_message = usernames.join(" ");
		socket.emit( "system-message", "#commandbox", "info-message",
			{text: new_message, color: "#00ff00", displayTime: 5000}
		);
		return "done"
	}
	return "not-found";
}/*}}}*/
module.exports = runCommand;
