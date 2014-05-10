module.exports = (function () {
	var readline = require('readline');
	var rl = readline.createInterface(process.stdin, process.stdout);
	var target;
	var prettyjson = require('prettyjson');
	rl.setPrompt("> ");
	rl.prompt();

	rl.on('line', function(line) {
		
		if (typeof(target[line]) == "function") {
			try {
				log(target[line]());
			}
			catch (e) {}
		}
		else {
			log(target[line]);
		}

		rl.prompt();
	}).on('close', function() {
		log("closing logger");
		process.exit(0);
	})

	function init (t) {
		target = t;
	}
	function log (message) {
		rl.pause();

		// convert to json before logging objects
		if (typeof(message) == "object") console.log(prettyjson.render(message));
		else console.log(message.toString());

		rl.prompt();
	}

	return {
		interface: rl,
		log: log,
		init: init
	}
})()