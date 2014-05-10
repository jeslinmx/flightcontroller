module.exports = function() {
	var connectedClients = [];
	function init() {
		// set up static file server
		var express = require("express");
		var app = express();
		app.use("/", express.static(__dirname + "/static1"));
		var server = app.listen(8080);
		
		// set up for Primus
		var Primus = require('primus');
		var primus = new Primus(server);

		primus.on('connection', function onconnect(socket) {
			connectedClients.push(socket);
		});
		return this;
	}
	function receiveCallback(data) {
		for (var i = connectedClients.length - 1; i >= 0; i--) {
			connectedClients[i].write(data);
		};
	}
	return {
		init: init,
		receiveCallback: receiveCallback
	};
}()