var http = require ('http');
//var url = require ('url');


var requestTimeOut = 0; // 0 -> no timeout

var cookie = null;


function HttpRequest (opts, content, callback) {
	/*
		opts = {
			protocol: 'http',
			host: 'otto.de',
			port: 80,
			method: 'GET',
			path: '/inernal/status',
			headers: {
				'Content-Type': 'application/json'
			},
			auth: 'user:password'
		}
	*/
	var requestFinished = false;
	
	if (opts.url) {
		var url = opts.url, pos = 0;
		if ((pos = url.indexOf ('://')) > 0) {
			opts.protocol = url.substr (0, pos + 1);
			url = url.substr (pos + 3);
		}
		if ((pos = url.indexOf ('/')) > 0) {
			opts.hostname = url.substr (0, pos);
			opts.path = url.substr (pos);
		} else {
			opts.hostname = url;
		}
		opts.url = null;
	}
	if (!callback && typeof (content) === 'function') {
		callback = content;
		content = null;
	}
	
	var resp = null;
	
	if (requestTimeOut > 0) {
		setTimeout (function () {
			if (requestFinished) return;
			requestFinished = true;
			if (resp !== null) resp.destroy ();
			callback ({
				code: -1,
				error: 'Connection timed out (manual timeout of ' + requestTimeOut + 'ms)'
			})
		}, requestTimeOut);
	}
	
	function cb (response) {
		resp = response;
		try {
			var data = '';
			response.on ('data', function (chunk) {
				data += chunk;
			});
			response.on ('end', function () {
				if (requestFinished) return;
				requestFinished = true;
				if (response.headers['set-cookie']) {
					cookie = response.headers['set-cookie'][0];
					cookie = cookie.substr (0, cookie.indexOf (';'));
				}
				if (response.statusCode < 300) callback (null, data, response.headers);
				else callback ({
					code: response.statusCode,
					error: response.statusMessage,
					headers: response.headers
				});
			});
		} catch (e) {
			requestFinished = true;
			callback ({
				code: -1,
				error: e
			});
		}
	}
	
	/*
	if (cookie !== null) {
		if (!opts.headers) opts.headers = {};
		opts.headers.Cookie = cookie;
	}
	*/
	
	var req = http.request (opts, cb).on ('error', (err) => {
		if (requestFinished) return;
		requestFinished = true;
		callback ({
			code: -1,
			error: err
		});
	});
	if (typeof (content) === 'string') req.end (content);
	else req.end ();
}


Object.defineProperty (HttpRequest, 'timeout', {
	get: function ()  { return requestTimeOut;     },
	set: function (v) {        requestTimeOut = v; }
});

Object.defineProperty (HttpRequest, 'cookie', {
	get: function ()  { return cookie;     },
	set: function (v) {        cookie = v; }
});


module.exports = HttpRequest;