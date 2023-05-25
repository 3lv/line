const fs = require("fs");
function parseJSONfile( file ) {
	let filetext = fs.readFileSync(file, "utf-8");
	try {
		let obj = JSON.parse(filetext);
		return obj;
	} catch(err) {
		throw "not JSON format";
	}
}
module.exports = parseJSONfile;
