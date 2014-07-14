module.exports = function() {

	net = require('net');
	var connectedClients = [];
	var logger;

	function init(portNumber, sockpolPort, log) {

		logger = log || console;

		net.createServer(function (socket) {

			connectedClients.push(socket);
			logger.log("UNITYOUT: connection from ", socket.remoteAddress);

			socket.on("end", function(){
				connectedClients.splice(connectedClients.indexOf(socket), 1);
				socket.end();
				logger.log("UNITYOUT: connection closed by ", socket.remoteAddress);
			});
			socket.on("timeout", function(){
				connectedClients.splice(connectedClients.indexOf(socket), 1);
				socket.end();
				logger.log("UNITYOUT: connection to ", socket.remoteAddress, " timed out.");
			});

		}).listen(portNumber);

		initSockPolServer(sockpolPort);
	}

	function receiveCallback(data) {
		var string = data.join(" ");
		for (var i = connectedClients.length - 1; i >= 0; i--) {
			try {
				connectedClients[i].write(string + "\n");
			}
			catch (e) {
				logger.log("TCP ERROR: ", e);
			}
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

}()