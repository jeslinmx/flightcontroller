var outputHandler = require('./unityOut.js');
var input = require('./netIn.js');
var controller = require('./admin.js');
var argv = require("minimist")(process.argv.slice(2));
var outputPort = argv.o || 3000, sockpolPort = argv.s || 4000, inputPort = argv.i || 8080;
outputHandler.init(outputPort, sockpolPort, controller);
controller.init(input);
input.init(inputPort, outputHandler, null, controller);
