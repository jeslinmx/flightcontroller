module.exports = (function () {
	var readline = require('readline');
	var prettyjson = require('prettyjson');
	var rl;
	var target;

	function init (t) {
		target = t;
		rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			completer: function(line) {
				var answer = Object.keys(t).filter(function(c) { return c.indexOf(line) == 0; });
				return [ answer.length? answer: Object.keys(t), line];
			}
		});
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
			log("closing");
			process.exit(0);
		})
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