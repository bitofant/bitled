var strip = require ('./ledstrip.js') ({
		pin: 6,
		count: 390,
		device: '/dev/ttyACM0',
		baudrate: 9600,
		verbose: false
});


var express = require ('express'),
    app = express (),
    fs = require ('fs');

app.listen (8081);



function quickHTML (title, text) {
	if (!text) {text = title;title = 'Debug';}
	return '<!DOCTYPE html>\r\n<html><head><title>' + title + '</title></head><body>' + text + '</body></html>';
}


app.use (express.static ('httpdocs'));
app.get ('/api/:fnname/:fnargs/', (req, res) => {
	if (strip.invoke (req.params.fnname, req.params.fnargs)) {
		res.send ('+OK');
	} else {
		res.sendStatus (500);
		res.send ('-ERR');
	}
});

app.listen (8080, () => {
	console.log ('Server running...');
});


/*
setInterval (function () {
	console.log ('setting pixels:');
	strip.setPixel ([ 255, 255, 255 ]);
	strip.show ();
	console.log ('done!\n\n');
}, 5000);
*/
