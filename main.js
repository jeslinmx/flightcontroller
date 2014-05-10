var outputHandler = require('./unityOut.js');
var input = require('./netIn.js');
var logger = require('./logger.js');
outputHandler.init();
logger.init(input);
input.init(outputHandler, null, logger);