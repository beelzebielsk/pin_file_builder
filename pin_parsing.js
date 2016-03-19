"use strict"

// ****************************************
// PREAMBLE
// ****************************************

var fs = require('fs');
var stream = require('stream');

// Has common regular expressions that are useful for
// validating synatx.
var validation = require("./formats.js").validation;

var explicitSpecifierFormats = 
	require("./formats.js").explicitSpecifierFormats;

var implicitSpecifierFormats =
	require("./formats.js").implicitSpecifierFormats;
	
// This is an associative array of functions, each of
// which take a single argument: an explicit index specifier.
// For a specifier of 'name', the function
//		explicitResolutionTable[name]
// Will turn an explicit index specifier of the format 'name' into a 
// simple explicit specifier.
var explicitResolutionTable = require("./formats.js").explicitResolution;

// This is an associative array of functions, each of
// which take a single argument: an implicit index specifier.
// For a specifier of 'name', the function
//		implicitResolutionTable[name]
// Will turn an implicit index specifier of the format 'name' into an 
// explicit specifier.
var implicitResolutionTable = require("./formats.js").implicitResolution;

// ****************************************
// INPUT/OUTPUT
// ****************************************

// Get arguments: input file, output file:
//	-- If no arguments, then use std_in for input and std_out for output 
//  -- If one argument, then use argument as file name for std_out for output.
//	-- if two arugments, then use first arg as input file name and second arg as output file name.
var inputFile;
var outputFile;
var input = process.stdin;
var output = process.stdout;
if (process.argv[3]){
	outputFile = process.argv[3];
	output = fs.createWriteStream(outputFile);
}
if (process.argv[2]){
	inputFile = process.argv[2];
	input = fs.createReadStream(inputFile);
}
	
// Gather all text from input into one string. Will be split by newlines.
var fileContent = "";
input.on('data', (chunk) => { fileContent += chunk; } )
input.on('end', () => { processFile(fileContent); } );

// ****************************************
// PARSING
// ****************************************

function processFile(fileContents){
	// Line number is maintained for use in
	// error reporting.
	var lineNumber = 1;
	// Create an array of lines to parse.
	var lines = fileContents.trim().split('\n');
	// Handling header: If header is present
	// in pinfile, ignore it. Print header
	// to output file.
	if (lines[0].match( validation.header ) )
		lines = lines.slice(1);
	output.write("To, Location\n");

	for (var line of lines){
		try {
			processLine(line);
		} catch (e) {
			if (e instanceof SyntaxError) { 
				console.log( "Error at Line Number: " + lineNumber ); 
				console.log( e.message );
				process.exit(1);
			}
		}
		lineNumber++;
	}
};

function processLine(line){
	// Match line to one of valid line possibilities. So far
	// thes are:
	//	- A line with index specifiers
	//	- A basic line
	//	- A blank line.
	var lineMatch = line.match( validation.lineExpression );
	if (!lineMatch){
		if (line.match( validation.basicLine ) )
			output.write(line + "\n");
		else if (line.match( validation.blankLine ) )
			output.write(line + "\n");
		else
			throw new SyntaxError("Cannot parse line.\n" + line + "\n");
	}
	// Store the names and specifiers that were matched
	// from the line.
	var name0    = lineMatch[1].trim();
	var specStr0 = lineMatch[2].trim();
	var name1    = lineMatch[3].trim();
	var specStr1 = lineMatch[4].trim();
	var spec0;
	var spec1;

	// Try to determine the specifier types.
	// If they don't match anything, then the program
	// exits and reports the specifier string that couldn't
	// be recognized.
	try {
		spec0 = determineSpecifier(specStr0);
	} catch (e) {
		if (e instanceof SyntaxError) {
			e.message += "Culprit: " + specStr0;
		}
		throw e;
	}
	try {
		spec1 = determineSpecifier(specStr1);
	} catch (e) {
		if (e instanceof SyntaxError) {
			e.message += "Culprit:" + specStr1;
		}
		throw e;
	}

	// If both specifiers are explicit, then exit program.
	if (spec0.type === 'i' && spec1.type === 'i'){
		let error = new SyntaxError;
		error.message += "Cannot have two implicit specifiers!\n";
		error.message += "Culprits: '" + spec0 + "' '" + spec1 + "'";
		throw error;
	}
	// If first specifier is implicit, then second is explicit.
	if (spec0.type === 'i')
		resolveImplicitSpecifier(spec0, spec1);
	// If second specifier is implicit, then first is explicit.
	else if ( spec1.type === 'i' )
		resolveImplicitSpecifier(spec1, spec0);

	// Now, both specifiers are necessarily explicit.
	if (spec0.length != spec1.length) {
		let error = new SyntaxError;
		error.message += 
			"Cannot have two specifiers with different index lengths.\n";
		error.message += "Culprits: " + specStr0 + " " + specStr1;
		throw error;
	}
	printResult(name0,spec0,name1,spec1,output);
}

// arguments are strings that should match one specifier format.
function determineSpecifier(specifierString){
	// Keeps track of if a format has been matched yet.
	var matched = false;
	var specifier = {};

	// Check specifierString agaisnt explicit formats.
	for( let format in explicitSpecifierFormats ){
		var matchResult = specifierString.match(
				explicitSpecifierFormats[format] 
				);
		if (matchResult) {
			matched = true;
			for (var i = 1; i < matchResult.length; i++) {
				matchResult[i] = matchResult[i].trim();
			}
			specifier.text = specifierString;
			specifier.type = 'e';
			specifier.name = format;
			specifier.match = matchResult;
			resolveExplicitSpecifier(specifier);
			specifier.length = specifier.content.length;
			break;
		}
	}

	// If it wasn't explicit, match it against implicit formats.
	// match any explicit formats.
	if (!matched) {
		for ( let format in implicitSpecifierFormats ) {
			var matchResult = specifierString.match(
					implicitSpecifierFormats[format] 
					);
			//console.log(format); //DEBUG
			//console.log( implicitSpecifierFormats[format].source ); //DEBUG
			if (matchResult) {
				matched = true;
				for (var i = 1; i < matchResult.length; i++) {
					matchResult[i] = matchResult[i].trim();
				}
				specifier.text = specifierString;
				specifier.type = 'i';
				specifier.name = format;
				specifier.match = matchResult;
				break;
			}
		}
	}

	// If didn't match any formats, throw an error.
	if (!matched){
		throw new SyntaxError("Specifier matched no known formats.\n");
	}
	return specifier;
}

// specifier is a specifier object.
function resolveExplicitSpecifier(specifier){
	return explicitResolutionTable[specifier.name](specifier);
}

// specifiers are specifier objects.
function resolveImplicitSpecifier(implicitSpec, explicitSpec){
	return implicitResolutionTable[implicitSpec.name](implicitSpec, explicitSpec);
}

function printResult(name0, spec0, name1, spec1, output){
	for ( var i = 0; i < spec0.content.length; i++) {
		var outputStr = name0 + '[' + spec0.content[i] + '], '
			+ name1 + '[' + spec1.content[i] + ']\n' ;
		output.write(outputStr);
	}
}
