"use strict"

// Get location of VHDL file.
// Find the port declaration of the entity defined in file.
//	- Do this by finding the entity declaration
//	- Then find the port declaration within the entity declaration.
// Then parse the port declarations for relevant information
// such as the lengths of vectors.
//	If necessary, get the generics declaration as well and
//	parse that, just in case some of the port information is
//	defined in terms of a generic. Replace the generic with
//	the default value, since that's what's going to be used
//	when the device is placed on a board.


// Set up some validation/search info

var validation = {};
//validation.entityStart = /^\s*entity \s*(\w+) \s*is\s*$/;
//validation.entityend = /^\s*end \s*entity/
validation.entityStart = /entity \s*(\w+) \s*is/i;
validation.entityEnd = /end\s* entity/i;
validation.portStart = /port\(/i;
// validation.portEnd = /\)\s*;/; // This should be
// I need to figure out how to search for a parenthesis match.
// I can't just look for the next partenthesis followed by a
// semi-colon. I have to look for the next matching closed
// parenthesis.

// Get VHDL File.

var fs = require('fs');
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

// Open: The opening delimiter (eg. '(', '{')
// Close: The closing delimiter (eg. ')', '}')
// String: The string to search.
// Start: The index to start searching from.
//	Start needs to be chosen such that: 
//		string[start] === open || string[start] === close
function findMatchingDelimiter(open, close, string, start){
	var count = 0;
	// For now, assume that we start on an 'open', and we're
	// looking for a 'close'.
	if (open === close) {
		//TODO: Something clever.
		// Or maybe nothing at all.
	}
	//var parens = RegExp("(?:" + start 
	while(true) {
		//var match = parens.exec(
	}

	// ( () () (()) () )
	// 01234567890123456

}

//	Problems:
//		- Function assumes that you've started at
//			an open parenthesis. Therefore, if it
//			it would return the same location for the
//			following inputs:
//				String : (  () () (()) () )
//				Start  : *
//				String : (  () () (()) () )
//				Start  :  *
//				String : (  () () (()) () )
//				Start  :   *
function findMatchingParens(string, start) {
	var parens = /(?:\(|\))/g;
	var count = 0; // Records the # of unmatched open parenthesis,
								 // exlcluding the one at which you start.
	// Since start is the location of the open parenthesis,
	// start right after the open parenthesis.
	parens.lastIndex = start + 1;
	var matchLocation = -1;
	while (true) {
		var match = parens.exec(string);
		if (!match) return matchLocation;
		if (match[0] === "(") {
			count++;
		} else if ( match[0] === ")" && --count === -1) {
			matchLocation = match.index;
			return matchLocation;
		}
	}
}

// Take in file, return a list of generics
// and infomration about them
// then a list of ports and information
// about them.
// Generics:
//	- Throw away the non-number generics
//	- Take the name and default value of
//		the generics
// Port:
//	- Look for ports of type:
//		- std_logic
//		- std_ulogic
//		- bit
//		- anything of the previous plus "_vector".
//	- If the port has "_vector" in its data type
//		then record
//		- port'left (leftmost index)
//		- port'right (rightmost index)
//		- port'length (# of items in vector = right - left + 1)
//	- If port'left or port'right is not numeric, then:
//		- check the list of generics for a matching (case insensitive) name.  If
//		there's a matching id, replace the generic with the default value.
//		- If what's left is an expression, then evaluate the expression.
function parseEntity(fileContent) {
}
function getEntity(fileContent){
}
function parsePort() {}
module.exports = findMatchingParens;

