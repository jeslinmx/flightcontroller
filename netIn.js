module.exports = function() {
	function Queue(){var a=[],b=0;this.getLength=function(){return a.length-b};this.isEmpty=function(){return 0==a.length};this.enqueue=function(b){a.push(b)};this.dequeue=function(){if(0!=a.length){var c=a[b];2*++b>=a.length&&(a=a.slice(b),b=0);return c}};this.peek=function(){return 0<a.length?a[b]:void 0}};
	
	var queue = new Queue();
	var connectedClients = {};
	var currentClient = null;
	var outputValues = [0.0,0.0,0.0];
	var outputHandler = function(){};
	var preprocessor;
	var logger;
	
	function init(out, prepFunc, log) {
		outputHandler = out;
		preprocessor = prepFunc || function(data) {return data;};
		logger = log || console;

		// set up static file server
		var express = require("express");
		var app = express();
		app.use("/", express.static(__dirname + "/static"));
		var server = app.listen(8888);
		
		// set up for Primus
		var Primus = require('primus');
		var primus = new Primus(server);
		primus.on('connection', function(socket) {
			// unconnected -> connected -> waiting -> active -> timeup; disconnected

			if (!connectedClients[socket.address.ip] || connectedClients[socket.address.ip].status == "timeup" || connectedClients[socket.address.ip].status == "missed") {
				// completely new client, returning client, or dequeued while disconnected. enqueue
				connectedClients[socket.address.ip] = {
					"socket": socket,
					"status": "waiting"
				};
				queue.enqueue(socket.address.ip);
				socket.write({statusUpdate: "waiting", queueLength: queue.getLength()});

				logger.log("NETIN: new client connected and enqueued - " + JSON.stringify(socket.address));
			}
			else {
				// reconnecting client. just renew the socket.
				connectedClients[socket.address.ip].socket = socket;
				socket.write({statusUpdate: connectedClients[socket.address.ip].status});

				logger.log("NETIN: client reconnected with status " + connectedClients[socket.address.ip].status + " - " + JSON.stringify(socket.address));
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
				// socket apparently can't be deleted safely anyway
				//connectedClients[socket.address.ip].socket = null;
				// leave status as is so we know where client is in the process
				//connectedClients[socket.address.ip].status = null;
				logger.log("NETIN: client disconnected - " + JSON.stringify(socket.address));
			});

			// kickstart
			if (!currentClient) {
				nextClient();
			}
		})
		return this;
	}
	
	function nextClient() {
		// end session of current client
		if (currentClient) {
			connectedClients[currentClient].socket.write({statusUpdate: "timeup"});
			connectedClients[currentClient].status = "timeup";
			connectedClients[currentClient].socket.end();
		}
		// bump up to next in queue, check if is still connected, else try again till queue is empty
		while (currentClient = queue.dequeue()) {
			if (connectedClients[currentClient].status == "waiting") break;
			else connectedClients[currentClient].status = "missed";
		}
		// inform our client
		if (currentClient) {
			connectedClients[currentClient].status = "active";
			connectedClients[currentClient].socket.write({statusUpdate: "active"});

			logger.log("NETIN: active client - " + JSON.stringify(connectedClients[currentClient].socket.address));
		}
		return;
	}
	
	return {
		init: init,
		nextClient: nextClient,
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