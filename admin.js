module.exports = (function () {
	var readline = require('readline');
	var prettyjson = require('prettyjson');
	var rl;
	var target;
	var options = {
		input: process.stdin,
		output: process.stdout,
		completer: function(line) {
			var answer = Object.keys(t).filter(function(c) { return c.indexOf(line) == 0; });
			return [ answer.length? answer: Object.keys(t), line];
		}
	}

	function init (t) {
		target = t;
		rl = readline.createInterface(options);
		rl.setPrompt("> ");
		rl.prompt();

		rl.on('line', function(line) {
			
			if (typeof(target[line]) == "function") {
				try {
					log(target[line]());
				}
				catch (e) {
					log("Error in executing ", line, " : ",e);
				}
			}
			else {
				log(target[line]);
			}

			rl.prompt();
		}).on('close', function() {

			log("closing");
			process.exit(0);
			
		})
	}
	function log() {
		rl.pause();

		var output = "";
		for (var i = 0; i < arguments.length; i++) {
			if (typeof(arguments[i]) == "object") {
				if (output != "") output += ": (object follows next line)\n"; //push json output to next line for the sake of pretty
				output += prettyjson.render(arguments[i]) + "\n";
			}
			else if (typeof(arguments[i]) != "undefined") output += arguments[i].toString();
		};
		console.log(output);

		rl.prompt();
	}

	return {
		interface: rl,
		log: log,
		init: init
	}
})()