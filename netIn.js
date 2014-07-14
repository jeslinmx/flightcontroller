module.exports = function() {
	
	var queue = []
	var connectedClients = {};
	var currentClient = null;
	var activeTimeout = null;
	var outputValues = [0.0,0.0,0.0];
	var outputHandler = function(){};
	var preprocessor;
	var logger;
	
	function init(portNumber, out, prepFunc, log) {
		outputHandler = out;
		preprocessor = prepFunc || function(data) {return data;};
		logger = log || console;

		// set up static file server
		var express = require("express");
		var app = express();
		app.use("/", express.static(__dirname + "/static"));
		var server = app.listen(portNumber);
		
		// set up for Primus
		var Primus = require('primus');
		var primus = new Primus(server);
		primus.on('connection', function(socket) {
			// unconnected -> connected -> waiting -> active -> timeup; disconnected

			if (!connectedClients[socket.address.ip] || currentClient != socket.address.ip) {
				// completely new client or returning client who isn't active.
				if (!connectedClients[socket.address.ip] || connectedClients[socket.address.ip].status != "waiting") {
					// if not known to be queued, enqueue.
					queue.push(socket.address.ip);
				}
				connectedClients[socket.address.ip] = {
					"socket": socket,
					"status": "waiting"
				};
				socket.write({statusUpdate: "waiting", queueLength: queue.length});

				logger.log("NETIN: new client connected and enqueued - ", socket.address);
			}
			else {
				// clear the timeout
				clearTimeout(activeTimeout);
				// reconnecting client. just renew the socket.
				logger.log("NETIN: client reconnected with status ", connectedClients[socket.address.ip].status, ", reassigning status to active - ", socket.address);
				connectedClients[socket.address.ip] = {
					"socket": socket,
					"status": "active"
				};
				socket.write({statusUpdate: connectedClients[socket.address.ip].status});
			}

			// set up event listeners for our client
			socket.on('data', function(data) {
				if ((currentClient == socket.address.ip)) {
					outputValues = data;
					outputHandler.receiveCallback(preprocessor(data));
					socket.write(data); // ping calculation
				}
				else {
					// some feedback to client maybe?
				}
			});
			socket.on('end', function() {
				// the ip address can't be accessed the normal way after the client is disconnected
				connectedClients[socket.request.client._peername.address].status = "reconnecting";
				logger.log("NETIN: client broke connection - ", socket.request.client._peername.address);

				// now, the timeout for active clients
				if (currentClient == socket.request.client._peername.address) {
					activeTimeout = setTimeout(nextClient, 10000);
					logger.log("NETIN: client was active; timeout set for 10000ms");
				}
			});

			// kickstart
			if (!currentClient) {
				nextClient();
			}
		})
		return this;
	}
	
	function nextClient() {
		// clear the timeout
		if (activeTimeout) clearTimeout(activeTimeout);
		// end session of current client
		if (currentClient && connectedClients[currentClient].status == "active") {
			connectedClients[currentClient].socket.write({statusUpdate: "timeup"});
			connectedClients[currentClient].status = "timeup";
			connectedClients[currentClient].socket.end();
		}

		// if queue is empty, there is no available client, but the loop is never entered
		currentClient = null;
		// bump up to next in queue, check if is still connected, else try again till queue is empty
		for (var i = 0; i < queue.length; i++) {
			currentClient = queue[i];

			if (connectedClients[currentClient].status == "waiting") {
				queue.splice(i, 1);
				break;
			}

			// this will be value of currentClient if the break clause never activates, and hence there's no available client
			currentClient = null;
		}
		// inform our client
		if (currentClient) {
			connectedClients[currentClient].status = "active";
			connectedClients[currentClient].socket.write({statusUpdate: "active"});

			logger.log("NETIN: active client - ", connectedClients[currentClient].socket.address);
		}
		else {
			logger.log("NETIN: no available clients were found. Waiting.");
		}
		return;
	}
	
	return {
		init: init,
		nextClient: nextClient,
		queue: queue,
		connectedClients: function() { 
			var temp = {};
			for (var i in connectedClients) {
				temp[i] = connectedClients[i].status;
			}
			return temp;
		},
		currentClient: function() { return currentClient },
		outputValues: function() { return outputValues }
	}
}()