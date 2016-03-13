"use strict"
var basicLine = require("./validation.js").afterParseLine;
var blankLine = require("./validation.js").blankLine;
var fs = require("fs");
var programDirectory = ( process.env.PROG_DIR ? process.env.PROG_DIR : "./" );

// Set up input and output to and from program.
var input = process.stdin;
var output = process.stdout;
output.write("TO, LOCATION\n");

// Get the pin table and file to run replacer on.
var pinTableStream = fs.createReadStream(programDirectory + "pin_table.json");
var fileContent = "";
var pinTable = "";
input.on('data', (chunk) => { fileContent += chunk; } );
input.on('end', () => { 
	pinTableStream.on('data', (chunk) => { pinTable += chunk; } );
	pinTableStream.on('end', () => { 
		pinTable = JSON.parse(pinTable);
		replace();
	} );
} );


function replace() {
	var lines = fileContent.trim().split('\n');
	//console.log( lines ); //DEBUG
	//console.log( basicLine ); //DEBUG
	//console.log(JSON.stringify(pinTable,null,3) ); //DEBUG
	for (var line of lines) {
		if (line.match(blankLine)) {
			output.write(line);
			continue;
		}
		var match = line.match( basicLine );
		var pinName;
		//console.log( match ); //DEBUG
		if (match) {
			var pinName = match[2].trim().toUpperCase();
			if (pinName === "LOCATION")
				continue;
			//console.log(pinName); //DEBUG
			output.write(line.replace(pinName, pinTable[pinName]) + '\n');
		}
	}
}
