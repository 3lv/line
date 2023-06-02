function padTo2Digits(num) {
	return num.toString().padStart(2, '0');
}
function formatDate(date) {
	return (
		[
			date.getFullYear(),
			padTo2Digits(date.getMonth() + 1),
			padTo2Digits(date.getDate()),
		].join('-') +
		' ' +
		[
			padTo2Digits(date.getHours()),
			padTo2Digits(date.getMinutes()),
			padTo2Digits(date.getSeconds()),
		].join(':')
	);
}
function formatUTCDate(date) {
	return (
		[
			date.getUTCFullYear(),
			padTo2Digits(date.getUTCMonth() + 1),
			padTo2Digits(date.getUTCDate()),
		].join('-') +
		' ' +
		[
			padTo2Digits(date.getUTCHours()),
			padTo2Digits(date.getUTCMinutes()),
			padTo2Digits(date.getUTCSeconds()),
		].join(':')
	);
}
const export_obj = {formatDate: formatDate, formatUTCDate: formatUTCDate};
module.exports = export_obj;
