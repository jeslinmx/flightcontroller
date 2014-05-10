var outputHandler = require('./unityOut.js');
var input = require('./netIn.js');
var controller = require('./admin.js');
outputHandler.init();
controller.init(input);
input.init(outputHandler, null, controller);