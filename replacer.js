"use strict"
var basicLine = require("./validation.js").afterParseLine;
var blankLine = require("./validation.js").blankLine;
var pinTable = require("./pin_table.json");
var fs = require("fs");

// Set up input and output to and from program.
// TODO: Give option to take input from and write input to
// specified files.
var input = process.stdin;
var output = process.stdout;
output.write("TO, LOCATION\n");

// Get the and file to run replacer on.
var fileContent = "";
input.on('data', (chunk) => { fileContent += chunk; } );
input.on('end', () => replace() );


function replace() {
	var lines = fileContent.trim().split('\n');
	//console.log( lines ); //DEBUG
	//console.log( basicLine ); //DEBUG
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
			//The below line won't work because 'pinName' doesn't
			//match the original thing if the original thing wasn't
			//uppercase.
			//output.write(line.replace(pinName, pinTable[pinName]) + '\n');
			output.write(line.replace(match[2], pinTable[pinName]) + '\n');
		}
	}
}
