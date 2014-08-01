module.exports = function() {

	net = require('net');
	var connectedClients = [];
	var logger;

	function init(portNumber, sockpolPort, log) {

		logger = log || console;

		net.createServer(function (socket) {

			var address = socket.remoteAddress; //thank you, closures.

			connectedClients.push(socket);
			logger.log("UNITYOUT: connection from ", address);

			socket.on("end", function(){
				removeClient(socket);
				logger.log("UNITYOUT: connection closed by ", address);
			});
			socket.on("timeout", function(){
				removeClient(socket);
				logger.log("UNITYOUT: connection to ", address, " timed out.");
			});
			socket.on("error", function(e) {
				removeClient(socket);
				logger.log("UNITYOUT: error from TCP. probably ECONNRESET, so removing client ", address," now.");
			})

		}).listen(portNumber);

		initSockPolServer(sockpolPort);
	}

	function receiveCallback(data) {
		var string = data.join(" ");
		for (var i = connectedClients.length - 1; i >= 0; i--) {
			connectedClients[i].write(string + "\n");
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
				//if (data == '<policy-file-request/>\0') {
					stream.end(poli);
				//} else {
				//	stream.end();
				//}
			});
			stream.on('end', function () {
				stream.end();
			});
			stream.on('timeout', function () {
				stream.end();
			});
		}).listen(port);
	}

	function removeClient(socket) {
		connectedClients.splice(connectedClients.indexOf(socket), 1);
		socket.end();
	}

	return {
		init: init,
		receiveCallback: receiveCallback
	}

}()
