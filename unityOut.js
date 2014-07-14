module.exports = function() {

	net = require('net');
	var connectedClients = [];
	var logger;

	function init(portNumber, sockpolPort, log) {

		logger = log || console;

		net.createServer(function (stream) {
			connectedClients.push(stream);
			logger.log("UNITYOUT: connection from ", stream.remoteAddress);
			stream.on("end", function(){
				logger.log("UNITYOUT: connection closed by ", stream.remoteAddress);
				connectedClients.splice(connectedClients.indexOf(stream), 1);
			});
			stream.on("timeout", function(){
				logger.log("UNITYOUT: connection to ", stream.remoteAddress, " timed out.");
				connectedClients.splice(connectedClients.indexOf(stream), 1);
			});
		}).listen(portNumber);

		initSockPolServer(sockpolPort);
	}

	function receiveCallback(data) {
		for (var i = connectedClients.length - 1; i >= 0; i--) {
			connectedClients[i].write(JSON.stringify(data) + "\n");
		};
	}

	function initSockPolServer(portNum) {
		var host = 'localhost',
			port = portNum,
			poli = '<?xml version="1.0"?><cross-domain-policy><allow-access-from domain="*" to-ports="1-65536"/></cross-domain-policy>'
		 
		var fsps = require('net').createServer(function (stream) {
			stream.setEncoding('utf8');
			stream.setTimeout(3000); // 3s
			stream.on('connect', function () {});
			stream.on('data', function (data) {
				if (data == '<policy-file-request/>\0') {
					stream.end(poli + '\0');
				} else {
					stream.end();
				}
			});
			stream.on('end', function () {
				stream.end();
			});
			stream.on('timeout', function () {
				stream.end();
			});
		}).listen(port, host);
	}

	return {
		init: init,
		receiveCallback: receiveCallback
	}

	// var connectedClients = [];
	// function init() {
	// 	// set up static file server
	// 	var express = require("express");
	// 	var app = express();
	// 	app.use("/", express.static(__dirname + "/static1"));
	// 	var server = app.listen(8080);
		
	// 	// set up for Primus
	// 	var Primus = require('primus');
	// 	var primus = new Primus(server);

	// 	primus.on('connection', function onconnect(socket) {
	// 		connectedClients.push(socket);
	// 	});
	// 	return this;
	// }
	// function receiveCallback(data) {
	// 	for (var i = connectedClients.length - 1; i >= 0; i--) {
	// 		connectedClients[i].write(data);
	// 	};
	// }
	// return {
	// 	init: init,
	// 	receiveCallback: receiveCallback
	// };
}()