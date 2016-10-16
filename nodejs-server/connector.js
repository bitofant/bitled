var serialport = require ('serialport');
var SerialPort = serialport;
var parsers = serialport.parsers;

var EventEmitter = require ('events').EventEmitter;
var util = require ('util');


function Connector (config) {
	var self = this;
	var isReady = false;
	var opts = {
		device: '/dev/ttyACM0',
		baudrate: 9600
	};
	if (typeof (config) === 'object') {
		for (var k in config) {
			if (typeof (opts[k]) === typeof (config[k])) {
				opts[k] = config[k];
			}
		}
	}

	var port = new SerialPort ('/dev/ttyACM0', {
		baudrate: opts.baudrate,
		parser: parsers.byteLength (1)
	});
	
	port.on ('open', () => {
		isReady = true;
		self.emit ('ready');
	});
	
	port.on ('data', (data) => {
		self.emit ('data', data);
	});
	
	this.write = function (toSend) {
		var buf = Buffer.alloc (toSend.length);
		for (var i = 0; i < buf.length; i++) {
			buf[i] = toSend[i];
		}
		console.log (buf);
		port.write (buf);
	}
	
}

util.inherits (Connector, EventEmitter);

module.exports = Connector;