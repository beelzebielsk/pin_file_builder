// EDITED FOR DISPLAYING A MERGE.

"use strict"
// This function takes arguments which describe
// information about the potential input and output files
// Then returns an object (or array) which contains the
// input and output file themselves.
// Input:
//	- Object with the following properties:
//		- input : boolean
//		- output : boolean
//		- inputFileName argument number
//		- outputFileName argument number
// TODO: Add error handling for incorrect paths.
function getInputOutput( isInput, isOutput, inputFileNameArgPosition, outputFileNameArgPosition){
	var fs = require('fs');
	var inputFile;
	var outputFile;
	var input = process.stdin;
	var output = process.stdout;
	if (isOutput && process.argv[inputFileNameArgPosition]) {
		inputFile = process.argv[inputFileNameArgPosition];
		input = fs.createReadStream(inputFile);
	}
	if (isInput && process.argv[outputFileNameArgPosition]) {
		outputFile = process.argv[outputFileNameArgPosition];
		output = fs.createWriteStream(outputFile);
	}
	return [input, output];
}

module.exports = getInputOutput;
