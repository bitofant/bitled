var api = new (function () {
	
	function invoke (cmd, args, callback) {
		var cmd = cmd.toLowerCase ().split ('_').join ('-');
		$.ajax ({
			url: '/api/' + cmd + '/' + args.join ('-'),
			success: () => {
				callback ();
			},
			error: (xhr, textStatus, err) => {
				callback (err);
			}
		});
	}
	
	this.setBrightness = (brightness) => {
		invoke ('SET_BRIGHTNESS', [ brightness ]);
	};
	
	this.setHueSaturation = (hue, saturation) => {
		invoke ('SET_HS', [ hue, saturation ]);
	};
	
	this.setHueSatVal = (hue, sat, val) => {
		invoke ('SET_HSV', [ hue, sat, val ]);
	};
	
	this.blinkHS = (hue, sat, blinkCount, blinkDelay) => {
		invoke ('BLINK_HS', [ hue, sat, blinkCount, blinkDelay ]);
	};
	
	this.blinkHSV = (hue, sat, val, blinkCount, blinkDelay) => {
		invoke ('BLINK_HSV', [ hue, sat, val, blinkCount, blinkDelay ]);
	};
	
	this.blinkBrightness = (brightness, blinkCount, blinkDelay) => {
		invoke ('BLINK_BRIGHTNESS', [ brightness, blinkCount, blinkDelay ]);
	};
	
}) ();





var setall = new (function () {
	
	var oldv = [0, 0, 0], newv;
	var slider = {
		r: null,
		g: null,
		b: null
	};
	
	setTimeout (function () {
		slider.r = $('#setall-r');
		slider.g = $('#setall-g');
		slider.b = $('#setall-b');
		slider.r.on ('change', changed);
		slider.g.on ('change', changed);
		slider.b.on ('change', changed);
	}, 100);
	
	
	var timer = -1;
	function changed () {
		newv = [ parseInt (slider.r.val()), parseInt (slider.g.val()), parseInt (slider.b.val()) ];
		if (timer >= 0) return;
		timer = setTimeout (applyCol, 100);
	}
	
	function applyCol () {
		timer = -1;
		if (oldv.join ('.') === newv.join ('.')) return;
		oldv = newv;
		console.log ('set-all', newv);
		api.setHueSatVal (newv[0], newv[1], newv[2]);
	}
	
}) ();



