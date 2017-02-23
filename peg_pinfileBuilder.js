var fs = require('fs');
var parser = require('./peg_parsing.js');

var getInputOutput = require('./getInputOutput.js');
var input, output;
[input, output] = getInputOutput(true, true, 2, 3);

var inputContent = "";
input.on('data', (chunk) => { inputContent += chunk; } )
input.on('end', () => { 
	try {
		output.write( "TO, LOCATION\n" );
		output.write( parser.parse(inputContent.trim()) );
	} catch (e) {
		if (e.location) { // Catch error from parser.
			console.error("Line:", e.location.start.line + ',', "Column:", e.location.start.column, '|', e.message);
			console.error("Offending content:", e.found);
			process.exit(1);
		} else {
			console.error(e.stack);
			process.exit(2);
		}
	}
	output.write('\n');
} );

