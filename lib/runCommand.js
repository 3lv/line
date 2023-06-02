const fs = require("fs");
const parse = require("shell-quote/parse");


function runCommand(socket, cmd, callback) {/*{{{*/
	const all_args = parse(cmd);
	const args = [];
	const opts = {};
	for(let arg of all_args) {
		if(typeof arg.substring !== "function") {
			continue;
		}
		if(arg.substring(0,2) == "--") {
			arg = arg.substring(2);
			const eq = arg.indexOf("=");
			if(eq != -1) {
				const opt_name = arg.substring(0, eq);
				const opt_value = arg.substring(eq + 1);
				opts[opt_name] = opt_value;
			}
		} else {
			args.push(arg);
		}
	}
	if(args[0] == "message") {
		if(args.length < 2) {
			callback({
				error: "Where's the message"
			});
			return;
		}
		global.io.emit( "system-message", "#messagebox", "announcement",
			{text: args[1], color: (opts.color || "#a0a0a0")}
		);
		return "done";
	} else if(args[0] == "hide") {
		targets = [];
		if(args.length == 1) {
			targets.push(socket.session);
		} else {
			for(let i = 1; i < args.length; i++) {
				var session = global.sessionStore.findSessionByUsername(args[i]);
				targets.push(session);
			}
		}
		for( target of targets) {
			if(target.isHidden) {
				//target already hidden
				continue;
			} 
			target.isHidden = true;
			global.io.emit("user-left-global-room", target.username);
		}
		return "done";
	} else if(args[0] == "unhide") {
		targets = [];
		if(args.length == 1) {
			targets.push(socket.session);
		} else {
			for(let i = 1; i < args.length; i++) {
				let session = global.sessionStore.findSessionByUsername(args[i]);
				targets.push(session);
			}
		}
		for(let target of targets) {
			if(!target.isHidden) {
				//target already visible
				continue;
			} 
			target.isHidden = false;
			global.io.emit("user-joined-global-room", target.username);
		}
		return "done";
	} else if(args[0] == "who") {
		let usernames = global.sessionStore.getAllUsernames();
		let new_message = usernames.join(" ");
		callback({
			info: new_message
		});
		return "done";
	} else if(args[0] == "WHO") {
		console.log(global.sessionStore);
		return "done";
	} else if(args[0] == "inject") {
		if(args.length < 3) {
			callback({
				error: "Not enough arguments"
			});
			return;
		}
		const file_path = `./storage/injections/${args[1]}`;
		targets = [];
		for(let i = 2; i < args.length; i++) {
			let session = global.sessionStore.findSessionByUsername(args[i]);
			targets.push(session);
		}
		for(let target of targets) {
			if(!fs.existsSync(file_path)) {
				callback({
					error: "File doesn't exist"
				});
				return "file doesn't exist";
			}
			let inject_string;
			inject_string = fs.readFileSync(file_path, "utf-8");
			inject_string = inject_string.replace(/CAZAN/, JSON.stringify(opts));
			target.socket.emit("debug", inject_string);
		}
		return "done";
	} else if(args[0] == "fetch") {
		// opts.time and args[1] are in seconds; default = last hour
		// let time = opts.time * 1000 || args[1] * 1000 || 1 * 60 * 60 * 1000;
		let count = opts.count || args[1] || 10;
		let messages = global.messageStore.getLastMessages(count);
		socket.emit("fetch", messages);
		return "done";
	}
	return "not-found";
}/*}}}*/
module.exports = runCommand;
