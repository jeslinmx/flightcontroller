module.exports = function() {
	function Queue(){var a=[],b=0;this.getLength=function(){return a.length-b};this.isEmpty=function(){return 0==a.length};this.enqueue=function(b){a.push(b)};this.dequeue=function(){if(0!=a.length){var c=a[b];2*++b>=a.length&&(a=a.slice(b),b=0);return c}};this.peek=function(){return 0<a.length?a[b]:void 0}};
	
	var queue = new Queue();
	var connectedClients = {};
	var currentClient = null;
	var outputValues = [0.0,0.0,0.0];
	var outputHandler = function(){};
	var preprocessor = function(data) {return data;}
	
	function init(out, prepFunc) {
		outputHandler = out;
		if (prepFunc) preprocessor = prepFunc;

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

			// enqueue our client
			if (!connectedClients[socket.address.ip] || !connectedClients[socket.address.ip].socket) {
				connectedClients[socket.address.ip] = {
					"socket": socket,
					"status": "enqueued"
				};
				queue.enqueue(socket.address.ip);
				socket.write({statusUpdate: "enqueued"});
			}

			// set up event listeners for our client
			socket.on('data', function(data) {
				if ((currentClient == socket.address.ip)) {
					outputHandler.receiveCallback(preprocessor(data));
				}
				else {
					// some feedback to client maybe?
				}
			});
			socket.on('end', function() {
				if (socket.address.ip == currentClient) nextClient();
				connectedClients[socket.address.ip].socket = null;
				connectedClients[socket.address.ip].status = "disconnected";
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
			connectedClients[currentClient].socket.end();
		}
		// bump up to next in queue, check if is still connected, else try again till queue is empty
		while (currentClient = queue.dequeue()) {
			if (connectedClients[currentClient].status == "enqueued") break;
		}
		// inform our client
		if (currentClient) {
			connectedClients[currentClient].status = "active";
			connectedClients[currentClient].socket.write({statusUpdate: "ready"});
		}
		return;
	}
	
	return {
		init: init,
		nextClient: nextClient
	}
}()