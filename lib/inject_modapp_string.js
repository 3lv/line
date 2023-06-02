/*
<link rel="stylesheet" type="text/css" href="mod.css">
<script type="text/javascript" src="mod.js"></script>
<div id="mod-app">
	<div id="mod-header" class="active">
		<div class="logo">
			<div class="text">mod chat</div>
		</div>
	</div>
	<div id="mod-messagebox" class="active"></div>
	<div id="mod-commandbox" class="active"></div>
	<div id="mod-typebox" class="active">
		<input id="mod-message-input">
		<button id="mod-send-message">Send</button>
	</div>
</div>
*/
const inject_string = `
(function() {
	const modapp = document.getElementById("mod-app");
	if(modapp) {
		document.getElementById("mod-messagebox").classList.add("active");
		document.getElementById("mod-commandbox").classList.add("active");
		document.getElementById("mod-typebox").classList.add("active");
		return;
	}
	let head = document.getElementsByTagName("head")[0];
	let body = document.getElementsByTagName("body")[0];
	let link = document.createElement("link");
	link.id = "mod-css";
	link.rel = "stylesheet";
	link.type = "text/css";
	link.href = "mod/mod.css";
	head.appendChild(link);
	let app = document.createElement("div");
	app.id = "mod-app";
	app.innerHTML = \`
		<div id="mod-header" class="active">
			<div class="logo">
				<div class="logo-text">mod chat</div>
			</div>
		</div>
		<div id="mod-messagebox" class="active"></div>
		<div id="mod-commandbox" class="active"></div>
		<div id="mod-typebox" class="active">
			<input id="mod-message-input">
			<button id="mod-send-message">Send</button>
		</div>
	\`
	body.appendChild(app);
	let script = document.createElement("script");
	script.id = "mod-script";
	script.type = "text/javascript";
	script.src = "mod/mod.js";
	body.appendChild(script);
})();
`
module.exports = inject_string;
