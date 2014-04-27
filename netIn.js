module.exports = function() {
  function Queue(){var a=[],b=0;this.getLength=function(){return a.length-b};this.isEmpty=function(){return 0==a.length};this.enqueue=function(b){a.push(b)};this.dequeue=function(){if(0!=a.length){var c=a[b];2*++b>=a.length&&(a=a.slice(b),b=0);return c}};this.peek=function(){return 0<a.length?a[b]:void 0}};
  
  var connectedClients = new Queue();
  var currentClient = null;
  var outputValues = [0.0,0.0,0.0];
  
  function init() {
    // set up static file server
    var express = require("express");
    var app = express();
    app.use("/", express.static(__dirname + "/static"));
    var server = app.listen(8888);
    
    // set up for sockets
    var io = require("socket.io");
    var sockets = io.listen(server, {log: false});
    var phoneIn = sockets.of('/phonein')
    .on('connection', function(socket) {
      connectedClients.enqueue(socket);
      socket.emit('enqueued', { queueLength: connectedClients.getLength() });
      if (!currentClient) {
        nextClient();
      }
    });
    var out = sockets.of('/out')
    .on('connection', function(socket) {
      console.log(socket);
    });
    return this;
  }
  
  function nextClient() {
    if (currentClient) {
      currentClient.emit('timeup', {});
      currentClient.removeAllListeners('beep').removeAllListeners('disconnect');
      currentClient.disconnect();
    }
    currentClient = connectedClients.dequeue();
    if (currentClient) {
      currentClient.emit('ready');
      currentClient.on('beep', function(a, b, g){
        var al = parseFloat(a), be = parseFloat(b), ga = parseFloat(g);
        outputValues = [isNaN(al)?0:al,isNaN(be)?0:be,isNaN(ga)?0:ga];
      }).on('disconnect', nextClient);
    }
    else {
      outputValues = [0,0,0];
    }
  }
  
  function get() {
    return outputValues;
  }
  
  return {
    init: init,
    get: get
  }
}()