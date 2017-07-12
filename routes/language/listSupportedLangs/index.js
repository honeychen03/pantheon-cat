const wrap = require('../../lib/requestWrapper');
let urlConfig = {
	url : "/web/api/v2/language/listSupportedLangs"
}

function listSupportedLangs(data) {
	console.info(data);
	return data;
}

module.exports = wrap({
	get : urlConfig,
	handler : listSupportedLangs,
	schema : require('./schema')
});
