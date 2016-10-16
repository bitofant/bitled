var fs = require ('fs');
var htrequest = require ('./htrequest.js');
const EventEmitter = require('events');

function LEDHandler (strip) {
	var lastColor = JSON.parse (fs.readFileSync ('lastColor.txt', 'utf8'));
	strip.setPixel (lastColor);
		
		
	function setAll (arr) {
		animator.stop ();
		strip.setPixel (lastColor = arr);
		fs.writeFile ('lastColor.txt', JSON.stringify (arr), 'utf8', (err) => {
			if (err) console.log ('Unable to write lastColor.txt: ' + err);
		});
	}
	
	this.newsocket = function (socket) {
		console.log ('new socket connection!');
		
		socket.on ('set-all', (data) => {
			
			var r = 0, g = 0, b = 0;
			if (data && data.length && data.length >= 3) {
				r = data[0];
				g = data[1];
				b = data[2];
			}
			setAll ([r, g, b]);
		});
		
		socket.on ('set-one', (data) => {
			console.log ('set-one: [ ' + (data.join ? data.join (', ') : '') + ' ]');
			
			var i = 0, r = 0, g = 0, b = 0;
			if (data && data.length && data.length >= 4) {
				i = data[0],
				r = data[1];
				g = data[2];
				b = data[3];
			}
			animator.stop ();
			strip.setPixel ([i, r, g, b]);
			strip.show ();
			/*
			fs.writeFile ('lastColor.txt', '[' + r + ',' + g + ',' + b + ']', 'utf8', (err) => {
				if (err) console.log ('Unable to write lastColor.txt: ' + err);
			});
			*/
		});
		
		
		
		
		
		socket.on ('exanim', (anim) => {
			console.log ('starting animation: ' + anim);
			
			if (anim === 'farbwechsel') {
				var ocol = [0, 0, 0], dstcol = [0,0,0], t = 2;
				animator.start (50, function (elapsed) {
					t += elapsed;
					var pct = t / 1000;
					if (pct >= 1) {
						t = 0;
						pct = 1;
						strip.setPixel (dstcol);
						ocol = dstcol;
						dstcol = [Math.random () * 255, Math.random () * 255, Math.random () * 255];
					} else {
						strip.setPixel ([
							ocol[0] + pct * (dstcol[0] - ocol[0]) | 0,
							ocol[1] + pct * (dstcol[1] - ocol[1]) | 0,
							ocol[2] + pct * (dstcol[2] - ocol[2]) | 0
						]);
					}
				});
				
			} else if (anim === 'rennlicht') {
				var max = 390, breite = 3, pos = 0, rmax = max - breite, inc = 1;
				strip.setPixel ([0, 0, 0]);
				animator.start (25, function (elapsed) {
					pos += inc;
					if (inc === 1) {
						strip.setPixel ([pos - 1, 0, 0, 0]);
						strip.setPixel ([pos + breite, 255 ,255, 255]);
					} else {
						strip.setPixel ([pos - 1, 255, 255, 255]);
						strip.setPixel ([pos + breite, 0, 0, 0]);
					}
					if (pos >= rmax) {
						inc = -1;
					} else if (pos <= 1) {
						inc = 1;
					}
					strip.show ();
				});
				
			} else if (anim === 'regenbogen') {
			}
		});
		
	};
	
	this.off = function () {
		var cols = [], dimLeft = 0;
		for (var i = 0; i < 3; i++) {
			cols.push (lastColor[i] / 255);
			if (lastColor[i] > dimLeft) dimLeft = lastColor[i];
		}
		function dimDown () {
			if (--dimLeft < 0) return;
			var nc = [dimLeft * cols[0], dimLeft * cols[1], dimLeft * cols[2]];
			strip.setPixel (nc);
			setTimeout (dimDown, 30);
		}
		strip.setPixel ([ 255, 0, 0 ]);
		setTimeout (function () {
			strip.setPixel (lastColor);
			setTimeout (function () {
				strip.setPixel ([ 255, 0, 0 ]);
				setTimeout (function () {
					strip.setPixel (lastColor);
					setTimeout (dimDown, 1000);
				}, 200);
			}, 600);
		}, 200);
	};
	
	
	
	
	var timedEvents = new EventEmitter (), lastTime = '-1:00';
	setInterval (() => {
		var t = currentTime ();
		if (lastTime === t) return;
		timedEvents.emit (lastTime = t);
	}, 5000);
	
	
	function currentTime (asNumber) {
		var d = new Date ();
		var h = d.getHours (), m = d.getMinutes ();
		h += 2;
		if (h >= 24) h -= 24;
		if (asNumber) return h * 100 + m;
		return h + ':' + (m < 10 ? '0' : '') + m;
	}
	
	
	
	function lightsOn () {
		var destCol = [80, 20, 0], start = Date.now (), dura = 20 * 60 * 1000;
		function step () {
			var elapsed = (Date.now () - start) / dura;
			if (elapsed > 1) elapsed = 1;
			else setTimeout (step, 1500);
			setAll ([ elapsed * destCol[0] | 0, elapsed * destCol[1] | 0, elapsed * destCol[2] | 0 ]);
		}
		step ();
	}
	
	function lightsOnFast () {
		var destCol = [80, 20, 0], start = Date.now (), dura = 20 * 1 * 1000;
		function step () {
			var elapsed = (Date.now () - start) / dura;
			if (elapsed > 1) elapsed = 1;
			else setTimeout (step, 300);
			setAll ([ elapsed * destCol[0] | 0, elapsed * destCol[1] | 0, elapsed * destCol[2] | 0 ]);
		}
		step ();
	}
	//timedEvents.on ('18:45', lightsOn);
	
	function getSundown () {
		htrequest ('http://www.sonnenuntergang-zeit.de/sonnenuntergang:hamburg:heute.html', (err, content) => {
			if (err) return console.error (err);
			var pos = content.indexOf ('<h2><strong>Sonnenuntergang</strong> in <strong>Hamburg</strong> heute:</h2>');
			pos = content.indexOf ('<p>', pos) + 3;
			content = content.substr (pos);
			content = content.substr (0, content.indexOf ('</p>')).trim ();
			content = content.substr (0, 5).trim ();
			var sundown = addTime (content, '-1:00');
			console.log ('lights on: ' + sundown);
			if (timeToInt (sundown) - timeToInt (currentTime ()) > 0) {
				console.log ('It is already past ' + sundown + ', turn the lights on NOW!');
				lightsOnFast ();
			} else {
				timedEvents.once (sundown, lightsOn);
			}
		});
	}
	//getSundown ();
	timedEvents.on ('13:00', getSundown);
	if (currentTime (true) > 1300) getSundown ();
	
	function addTime (t1, t2) {
		return intToTime (timeToInt (t1) + timeToInt (t2));
	}
	
	function timeToInt (t) {
		var n = 1;
		if (t.charAt (0) === '-') {
			n = -1;
			t = t.substr (1);
		}
		var ts = t.split (':');
		return n * (parseInt (ts[0]) * 60 + parseInt (ts[1]));
	}
	
	function intToTime (t) {
		var t1 = t / 60 | 0, t2 = t - (t1 * 60);
		while (t1 >= 24) t1 -= 24;
		while (t1 < 0) t1 += 24;
		return t1 + ':' + (t2 < 10 ? '0' : '') + t2;
	}
	
	
	function warmUp () {
		// warmup to get currentTime() optimized by V8!
		var start = Date.now (), i = 0, n = 0;
		while (i++ < 1000) {
			while (n++ < 500) {
				var t = currentTime ();
			}
			if (Date.now () - start > 400) break;
			n = 0;
		}
	}
	setTimeout (warmUp, 3000);
	setTimeout (warmUp, 4500);
	setTimeout (warmUp, 6000);
	setTimeout (warmUp, 7500);
	setTimeout (warmUp, 9000);
}


var animator = new (function () {
	var timer = -1, renderer = null, lastStep = 0;
	this.start = function (interv, fn) {
		if (!interv) interv = 50;
		if (timer !== -1) clearInterval (timer);
		renderer = fn;
		lastStep = 0;
		timer = setInterval (step, interv);
	};
	this.stop = function () {
		if (timer >= 0) {
			clearInterval (timer);
			timer = -1;
		}
	};
	function step () {
		if (timer === -1) return;
		var now = Date.now (), elapsed = now - lastStep;
		renderer (lastStep === 0 ? 0 : elapsed);
		lastStep = now;
	}
}) ();





module.exports = function (strip) { return new LEDHandler (strip); };