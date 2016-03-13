"use strict"
// Get arguments: input file, output file:
//	-- If no arguments, then use std_in for input and std_out for output
//	-- If one argument, then use argument as file name for std_out for output.
//	-- if two arugments, then use first arg as input file name and second arg as output file name.

var fs = require('fs');
var stream = require('stream');

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
	
var fileContent = "";
input.on('data', (chunk) => { fileContent += chunk; } )
input.on('end', () => { processFile
var validation = {};

validation.lineExpression = RegExp("(\\w+)\\[([^\\]]+)\\]\\s*,\\s*(\\w+)\\[([^\\]]+)\\]");
validation.number = "\\d+";
validation.numberCap = "(" + validation.number + ")";
validation.explicitSpecifierFormats = {
	// number ["," number]*
	simpleExplicit : 
		RegExp("^" + validation.number + "(?:," + validation.number + ")*$"),
	// number ".." number
	simpleRange : 
		RegExp("^" + validation.numberCap + "\\.\\." + validation.numberCap + "$"),
	// number ":" number ".." number
	stepToEnd :
		RegExp("^" + validation.numberCap + ":" + validation.numberCap + "\\.\\." + validation.numberCap + "$"),
	// number ":" number ":" number
	stepRange :
		RegExp("^" + validation.numberCap + ":" + validation.numberCap + ":" + validation.numberCap + "$"),
};
validation.implicitSpecifierFormats = {
	// ".."
	rangeReuse :
		RegExp("^\\.\\.$"),
	// number ".."
	offsetRangeReuse :
		RegExp("^" + validation.numberCap + "\\.\\.$"),
	// number "..#"
	lengthForward : 
		RegExp("^" + validation.numberCap + "\\.\\.#$"),
	// "#.." number
	lengthBackward :
		RegExp("^#\\.\\." + validation.numberCap + "$"),
	// number ":" number ":#"
	stepRangeLengthReuse : 
		RegExp("^" + validation.numberCap + ":" + validation.numberCap + ":#$"),
};

// This is an associative array of functions, each of
// which take a single argument: an explicit index specifier.
// For a specifier of 'name', the function
//		explicitResolutionTable[name]
// Will turn an explicit index specifier of the format 'name' into a 
// simple explicit specifier.

var explicitResolutionTable = {
	simpleExplicit:
		function (specifier){
			specifier.content = specifier.match[0].trim().split(",").map( cur => +cur );
		},
	simpleRange : 
		function (specifier){
			specifier.content = [];
			for (var i = +(specifier.match[1]);
						i <= +(specifier.match[2]);
						i++){
				specifier.content.push(i);
			}
		},
	stepToEnd :
		function (specifier){
			specifier.content = [];
			for (var i = +specifier.match[1];
						i <= +specifier.match[3];
						i += +specifier.match[2]) {
					specifier.content.push(i);
			}
		},
	stepRange :
		function (specifier){
			var start = +specifier.match[1];
			specifier.content = [start];
			var multiplier = +specifier.match[2];
			var length = +specifier.match[3];
			for (var i = 1; i <= length; i++){
				specifier.content.push( start + multiplier*i );
			}
		},
};

// This is an associative array of functions, each of
// which take a single argument: an implicit index specifier.
// For a specifier of 'name', the function
//		implicitResolutionTable[name]
// Will turn an implicit index specifier of the format 'name' into an 
// explicit specifier.

var implicitResolutionTable = {
	rangeReuse :
		function (implicitSpec, explicitSpec){
			implicitSpec.content = explicitSpec.content;
			implicitSpec.length = implicitSpec.content.length;
		},
	offsetRangeReuse :
		function (implicitSpec, explicitSpec){
			let offset = +implicitSpec.match[1];
			implicitSpec.content = 
				explicitSpec.content.map( cur => cur + offset );
			implicitSpec.length = implicitSpec.content.length;

		},
	lengthForward : 
		function (implicitSpec, explicitSpec){
			let length = explicitSpec.length;
			implicitSpec.content = [];
			let start = +implicitSpec.match[1];
			for (var i = 0; i < length; i++) {
				implicitSpec.content.push(start + i);
			}
			implicitSpec.length = implicitSpec.content.length;
		},
	lengthBackward :
		function (implicitSpec, explicitSpec){
			let length = explicitSpec.length;
			implicitSpec.content = [];
			let end = +implicitSpec.match[1];
			for (var i = 0; i < length; i++) {
				implicitSpec.content.push(end - i);
			}
			implicitSpec.length = implicitSpec.content.length;
		},
	stepRangeLengthReuse : 
		function (implicitSpec, explicitSpec){
			var start  = +implicitSpec.match[1];
			var step   = +implicitSpec.match[2];
			var length = +implicitSpec.match[3];
			implicitSpec.content = [start];
			for (var i = start + step; i < length; i += step) {
				implicitSpec.content.push(i);
			}
			implicitSpec.length = implicitSpec.content.length;
		},
};

function test() {
	var testLines = [
		"Array[..]   , SW[0..5]",
		"Array[0..5] , SW[0..5]",
		"array[2..]  , SW[1..6]",
		"array[3..8] , SW[1..6]",
		"array[5..#], SW[1..6]",
		"array[5..10], SW[1..6]",
		"array[5..#], SW[0:2..10]",
		"array[5..10], SW[0:2..10]",
		"array[5..#], SW[2,3,5,7,11]",
		"array[5..9], SW[2,3,5,7,11]",
		"array[#..8], SW[1..6]",
		"array[3..8], SW[1..6]",
		"array[#..8], SW[0:2..10]",
		"array[3..8], SW[0:2..10]",
		"array[#..8], SW[2,3,5,7,11]",
		"array[4..8], SW[2,3,5,7,11]",
		"array[0:2:#]     , SW[0..5]",
		"array[0:2:4]     , SW[0..5]",
		"array[0,2,4,6,8] , SW[0..5]",
		"array[1:2:#]   , SW[0:3..10]",
		"array[1:2:3]   , SW[0:3..10]",
		"array[1,3,5,7] , SW[0:3..10]",
		"array[4:3:#]           , SW[2,3,5,7,11,13]",
		"array[4:3:5]           , SW[2,3,5,7,11,13]",
		"array[4,7,10,13,16,19] , SW[2,3,5,7,11,13]",
	]

	for ( var testString of testLines) {
		var testMatch = testString.match(validation.lineExpression);
		console.log( "Initial Match:" );
		console.log( testMatch );
		var name0 = testMatch[1];
		var specStr0 = testMatch[2];
		var name1 = testMatch[3];
		var specStr1 = testMatch[4];
		try {
			var spec0 = determineSpecifier(specStr0);
		} catch (e) {
			console.log("Culprit:", specStr0);
			console.error(e);
			console.error(e.stack);
			process.exit(1);
		}
		try {
			var spec1 = determineSpecifier(specStr1);
		} catch (e) {
			console.log("Culprit:", specStr1);
			console.error(e);
			console.error(e.stack);
			process.exit(1);
		}
		console.log( "Specifier 0:" );
			console.log( spec0 );
		console.log( "Specifier 1:" );
			console.log( spec1 );

		if (spec0.type === 'i' && spec1.type === 'i'){
			console.error("Cannot have two implicit specifiers!");
			console.error("Culprits: '" + spec0 + "' '" + spec1 + "'");
			process.exit(1);
		}
		if (spec0.type === 'i')
			resolveImplicitSpecifier(spec0, spec1);
		else if ( spec1.type === 'i' )
			resolveImplicitSpecifier(spec1, spec0);
			
		console.log("After full resolution:");

		console.log( "Specifier 0:" );
			console.log( spec0 );
		console.log( "Specifier 1:" );
			console.log( spec1 );
	}
}

function testProcess(){
	var lineNumber = 1;
	for (line of testLines) {
	}
}
// TODO: Complete
function processFile(input, output){
	var lineNumber = 1;
	// Fetch line from input file.
	// Try Process line.
	//	If process line throws an error, append line number to error message.
	//	If no error thrown, receive object with following properties:
	//		name[0], name[1], specifier[0], specifier[1].
	//	Pass this to a printing function.
};

// TODO: Complete
function processLine(line){
	//	- Run lineExpression against line.
	//		- Possible Errors at this point:
	//			- Line does not match expression.
	//	- Determine type and name of each specifier.
	//		- Possible Errors at this Point:
	//			- A specifier matches no known format.
	//				- Is thrown by determineSpecifier().
	//			-	Both specifiers are implicit.
	//			- Both specifiers are explicit and have different lengths.
	//	- Resolve implicit specifier if it exists.
	//	- Resolve explicit specifiers.
	//	- Pass names and resolved specifiers to a printing function.
	var lineMatch = line.match( validation.lineExpression );
	if (!lineMatch){
		//TODO: Throw error
	}
	var specStr0 = lineMatch[1].trim();
	var name0       = lineMatch[2].trim();
	var specStr1 = lineMatch[3].trim();
	var name1       = lineMatch[4].trim();
	var spec0;
	var spec1;

	try {
		spec0 = determineSpecifier(specStr0);
	} catch (e) {
		console.log("Culprit:", specStr0);
		console.error(e);
		console.error(e.stack);
		process.exit(1);
	}
	try {
		spec1 = determineSpecifier(specStr1);
	} catch (e) {
		console.log("Culprit:", specStr1);
		console.error(e);
		console.error(e.stack);
		process.exit(1);
	}

	if (spec0.type === 'i' && spec1.type === 'i'){
		console.error("Cannot have two implicit specifiers!");
		console.error("Culprits: '" + spec0 + "' '" + spec1 + "'");
		process.exit(1);
	}
	if (spec0.type === 'i')
		resolveImplicitSpecifier(spec0, spec1);
	else if ( spec1.type === 'i' )
		resolveImplicitSpecifier(spec1, spec0);
}

// arguments are strings that should match one specifier format.
function determineSpecifier(specifierString){
	// Keeps track of if a format has been matched yet.
	var matched = false;
	var specifier = {};

	// Check specifierString agaisnt explicit formats.
	for( let format in validation.explicitSpecifierFormats ){
		var matchResult = specifierString.match(
				validation.explicitSpecifierFormats[format] 
				);
		//console.log( format ); //DEBUG
		//console.log( validation.explicitSpecifierFormats[format].source ); //DEBUG
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
		for ( let format in validation.implicitSpecifierFormats ){
			var matchResult = specifierString.match(
					validation.implicitSpecifierFormats[format] 
					);
			//console.log(format);
			//console.log( validation.implicitSpecifierFormats[format].source );
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
		//TODO: Throw error.
		console.log("Specifier '" + specifierString + "' did not match anything.");
	}
	return specifier;
}

// TODO: Complete
// specifier is a specifier object.
function resolveExplicitSpecifier(specifier){
	return explicitResolutionTable[specifier.name](specifier);
}

// TODO: Complete
// specifiers are specifier objects.
function resolveImplicitSpecifier(implicitSpec, explicitSpec){
	return implicitResolutionTable[implicitSpec.name](implicitSpec, explicitSpec);
}

// Processng each line: 
//	- Specifier Resolution: 
//		- Examine specifiers.
//			- If explicit, resolve immediately.
//			- If implicit, resolve to explicit.
//		- If any were implicit, resolve them now to simple explicit specifiers.
//	- Pass each name and the corresponding resolved specifier to a function which
//		prints out appropriate lines to final result.
//	- Take in next line. Restart. If no next line, end process.
//
// Specifier Objects:
// - content : What it actually is
// - Type : Implicit/Explicit
// - Name : specifier name, such as "simple_explicit"
