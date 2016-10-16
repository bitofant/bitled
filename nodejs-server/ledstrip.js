var Connector = require ('./connector.js');


var commands = {
	'COMMAND_SET_BRIGHTNESS': 0,
	'COMMAND_SET_BRIGHTNESS_ARGC': 1,
	// [ brightness ]
	
	'COMMAND_SET_HS': 1,
	'COMMAND_SET_HS_ARGC': 2,
	// [ hue, saturation ]
	
	'COMMAND_SET_HSV': 2,
	'COMMAND_SET_HSV_ARGC': 3,
	// [ hue, saturation, brightness ]
	
	'COMMAND_BLINK_HS': 3,
	'COMMAND_BLINK_HS_ARGC': 4,
	// [ hue, saturation, blinkCount, blinkRate ]
	
	'COMMAND_BLINK_HSV': 4,
	'COMMAND_BLINK_HSV_ARGC': 5,
	// [ hue, saturation, brightness, blinkCount, blinkRate ]
	
	'COMMAND_BLINK_BRIGHTNESS': 5,
	'COMMAND_BLINK_BRIGHTNESS_ARGC': 3
	// [ brightness, blinkCount, blinkRate ]
}


function LEDStrip (config) {
	var self = this;
	var opts = {
		pin: 6,
		count: 390,
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
	
	var connector = new Connector ({
		device: opts.device,
		baudrate: opts.baudrate
	});
	
	
	function generateHandler (fnName) {
		var fnid = commands['COMMAND_' + fnName],
		    fnac = commands['COMMAND_' + fnName + '_ARGC'];
		return (function () {
			var args = arguments;
			if (args.length === 0 && isArray (args[0])) args = args[0];
			if (args.length !== fnac) {
				console.error ('Wrong parameter count: ' + fnac + ' expected, got ' + args.length);
				return;
			}
			var buf = [fnid];
			for (var i = 0; i < fnac; i++) buf.push (args[i]);
			connector.write (buf);
		});
	}
	
	function isArray (a) {
		return typeof (a) === 'object' && typeof (a.length) === 'number';
	}
	
	
	this.setBrightness = generateHandler ('SET_BRIGHTNESS');
	this.setBrightness = generateHandler ('SET_HS');
	this.setBrightness = generateHandler ('SET_HSV');
	this.setBrightness = generateHandler ('BLINK_HS');
	this.setBrightness = generateHandler ('BLINK_HSV');
	this.setBrightness = generateHandler ('BLINK_BRIGHTNESS');
	
	this.invoke = function (fnName, strArgs) {
		fnName = fnName.toUpperCase ().split ('-').join ('_');
		var args = strArgs.split ('-');
		var fnid = commands['COMMAND_' + fnName],
		    fnac = commands['COMMAND_' + fnName + '_ARGC'];
		if (typeof (fnid) !== 'function') {
			console.error ('Command "' + fnName + '" not found...');
			return false;
		}
		if (args.length !== fnac) {
			console.error ('Wrong parameter count: ' + fnac + ' expected, got ' + args.length);
			return false;
		}
		var buf = [fnid];
		for (var i = 0; i < fnac; i++) buf.push (args[i]);
		connector.write (buf);
	};
	
}

module.exports = function (config) { return new LEDStrip (config); };