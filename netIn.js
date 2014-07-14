module.exports = function() {
	
	var queue = [];
	var connectedClients = {};
	var currentClient = null;
	var activeTimeout = null;
	var outputValues = [0.0,0.0,0.0];
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
		primus.on('connection', connectionCallback);

		logger.log("NETIN: Static webserver and Primus up and running on port ", portNumber);
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

		// there is no currentClient if queue is empty
		currentClient = null;
		// bump up to next in queue, check if is still connected, else try again till queue is empty
		for (var i = 0; i < queue.length; i++) {
			currentClient = queue[i];
			if (connectedClients[currentClient].status == "waiting") {
				queue.splice(i, 1);
				break;
			}

			// this will be value of currentClient if the break clause never activates because there is no available client
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

	}

	function connectionCallback(socket) {
		// unconnected -> connected -> waiting -> active -> timeup; disconnected

		if (!connectedClients[socket.address.ip] || currentClient != socket.address.ip) { // completely new client or returning client who isn't active.
			
			// if not known to be queued, enqueue.
			if (!connectedClients[socket.address.ip] || connectedClients[socket.address.ip].status != "waiting") {
				queue.push(socket.address.ip);
			}

			connectedClients[socket.address.ip] = {
				"socket": socket,
				"status": "waiting"
			};
			socket.write({statusUpdate: "waiting", queueLength: queue.length});

			logger.log("NETIN: client connected and enqueued - ", socket.address);

		}
		else { //was active client

			// clear the timeout
			clearTimeout(activeTimeout);

			// just renew the socket.
			connectedClients[socket.address.ip] = {
				"socket": socket,
				"status": "active"
			};
			socket.write({statusUpdate: connectedClients[socket.address.ip].status});
			logger.log("NETIN: client reconnected with status ", connectedClients[socket.address.ip].status, ", reassigning status to active - ", socket.address);

		}

		// set up event listeners for our client
		socket.on('data', dataCallback);
		socket.on('end', endCallback);

		// kickstart
		if (!currentClient) {
			nextClient();
		}
	}

	function dataCallback (data) {

		if ((currentClient == this.address.ip)) {
			outputValues = data;
			outputHandler.receiveCallback(preprocessor(data));
			// this.write(data); // ping calculation
		}
		else {
			// some feedback to client maybe?
		}

	}

	function endCallback() {

		// the ip address can't be accessed the normal way after the client is disconnected, so a deeply hidden alternative is .request.client._peername.address
		connectedClients[this.request.client._peername.address].status = "reconnecting";
		logger.log("NETIN: client broke connection - ", this.request.client._peername.address);

		// now, the timeout for active clients
		if (currentClient == this.request.client._peername.address) {
			activeTimeout = setTimeout(nextClient, 10000);
			logger.log("NETIN: client was active; timeout set for 10000ms");
		}
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