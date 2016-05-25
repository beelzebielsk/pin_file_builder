//////////////////////////////////////////////////
// Preamble : {{{
//////////////////////////////////////////////////

"use strict"
var basicLine = require("./formats.js").validation.afterParseLine;
var blankLine = require("./formats.js").validation.blankLine;
var pinTable = require("./pin_table.json");
var fs = require("fs");

//////////////////////////////////////////////////
// }}}
//////////////////////////////////////////////////

//////////////////////////////////////////////////
// Fetching Input : {{{
//////////////////////////////////////////////////

// Get arguments: input file, output file:
//	-- If no arguments, then use std_in for input and std_out for output 
//  -- If one argument, then use argument as file name for std_out for output.
//	-- if two arugments, then use first arg as input file name and second arg as output file name.
var getInputOutput = require('./getInputOutput.js');
var input;
var output;
[input, output] = getInputOutput(true, true, 2, 3);

//////////////////////////////////////////////////
// }}}
//////////////////////////////////////////////////

//////////////////////////////////////////////////
// Setting up the Output : {{{
//////////////////////////////////////////////////

// Set up input and output to and from program.
// TODO: Give option to take input from and write input to
// specified files.
output.write("TO, LOCATION\n");

// Get the and file to run replacer on.
var fileContent = "";
input.on('data', (chunk) => { fileContent += chunk; } );
input.on('end', () => { 
		try{ 
			replace(fileContent);
		} catch (e) { 
			console.error(e.message); 
			if (e instanceof SyntaxError) {
				process.exit(1);
			} else {
				process.exit(2)
			}
		} 
	} );

//////////////////////////////////////////////////
// }}}
//////////////////////////////////////////////////

function replace(fileContent) {
	var lines = fileContent.trim().split('\n');
	var lineNumber = 1;
	//console.log( lines ); //DEBUG
	//console.log( basicLine ); //DEBUG
	for (var line of lines) {
		if (line.match(blankLine)) {
			output.write(line);
			lineNumber++;
			continue;
		}
		var match = line.match( basicLine );
		var pinName;
		//console.log( match ); //DEBUG
		if (match) {
			var pinName = match[2].trim().toUpperCase();
			if (pinName === "LOCATION") {
				lineNumber++;
				continue;
			}
			//console.log(pinName); //DEBUG
			//The below line won't work because 'pinName' doesn't
			//match the original thing if the original thing wasn't
			//uppercase.
			//output.write(line.replace(pinName, pinTable[pinName]) + '\n');
			
			if (!pinTable[pinName]) {
				throw new SyntaxError("Error(" + lineNumber
						+ "). No pin associated with name '" + pinName + "'.");
			}
			output.write(line.replace(match[2], pinTable[pinName]) + '\n');
		}
		lineNumber++;
	}
}
