"use strict"

var children = require('child_process');
var getInputOutput = require('./getInputOutput.js');
var input, output;
[input, output] = getInputOutput(true, true, 2, 3);

//var fullParser = 
	//children.exec( "node pin_parsing.js | node replacer.js",
			//(error) => { if (error) console.log(error); } 
			//);

//var fullParser = children.exec( "node pin_parsing.js | node replacer.js" );
var parser = children.exec(" node pin_parsing.js ", (error, _, stderr) => 
		{ 
			if (error) console.error("Parsing error:", stderr); 
		} );
var replacer = children.exec(" node replacer.js ", (error, _, stderr) => 
		{ 
			if (error) console.error("Replacement error:", stderr); 
		} );

input.pipe( parser.stdin );
parser.stdout.pipe( replacer.stdin );
replacer.stdout.pipe( output );
//parser.stderr.pipe( process.stderr );
//replacer.stderr.pipe( process.stderr );
//fullParser.stdout.pipe( output ) ;
//fullParser.stderr.pipe( process.stderr );
