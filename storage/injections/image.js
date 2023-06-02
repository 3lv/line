(function() {
	const opts = CAZAN || {};
	let body = document.getElementsByTagName("body")[0];
	let image = document.createElement("img");
	image.src = opts.src || "https://scontent.fotp3-4.fna.fbcdn.net/v/t39.30808-6/348473442_792106938857923_3851193257073854089_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=730e14&_nc_ohc=S6hOBQKOSYEAX9Qi6Uh&_nc_ht=scontent.fotp3-4.fna&oh=00_AfA1V_A_XdC0RuiDCHHZkVjPYNWjj0Djqi6xUffzSniLsA&oe=647BEC33";
	image.style.position = "absolute";
	image.style.top = "0px";
	image.style.left = "0px";
	image.style.width = "100%";
	image.style.heigth = "100%";
	image.style["z-index"] = opts["z-index"] || "-1";
	body.appendChild(image);
})();
// vim:set ft=javascript:
