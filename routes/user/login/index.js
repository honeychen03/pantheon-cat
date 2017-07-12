const wrap = require('../../lib/requestWrapper');
let loginConfig = {
	url : "/web/api/v3/auth/login"
}

function login(data) {
	return {
		token : data.token
	};
}

module.exports = wrap({
	get : loginConfig,
	handler : login,
	schema : require('./schema')
});
