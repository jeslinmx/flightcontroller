var outputHandler = require('./unityOut.js');
var input = require('./netIn.js');
var controller = require('./admin.js');
outputHandler.init(8080, 8081, controller);
controller.init(input);
input.init(8888, outputHandler, null, controller);