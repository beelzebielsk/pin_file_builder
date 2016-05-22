"use strict"
// Placing all of the format information in one place.
// This seems more sensible considering that the
// name of a format has to be consistent across all
// objects (the format list and the appropriate 
// resolution table). Keeping all of the
// definitions that are dependent on a name
// in one place helps to keep the names
// consistent.


//////////////////////////////////////////////////
// Adding New Formats : {{{
//////////////////////////////////////////////////
//
// If you would like to add new specifiers of your own
// to those presented here, then you must know the
// following:
// - Every specifier has a format in the formats
//	table and a resolving function in the
//	resolution table.
// - For each specifier, the entries for that
//	specifier in each table must have the same
//	key (name). So, for example, with the
//	'Explicit Simple Specifier', there are two
//	entries in the tables for explicit
//	specifiers:
//		- explicitSpecifierFormats.simpleExplicit
//		- explicitResolution.simpleExplicit
// - The formats for each specifier are regular
//	expressions.
// - Explicit and Implicit specifier information is
//	kept separate. There are two tables for each
//	kind of specifier:
//		- Formats Table: A table of regular expressions
//			which match and parse the specifier.
//		- Resolution table: A table of functions which
//			accept formats. In JavaScript, regular expression
//			objects have a state based on their last match.
//			They keep track of captured groups, so they're
//			basically parsed forms of the specifier.
//
//////////////////////////////////////////////////
// }}}
//////////////////////////////////////////////////

var validation = {};
var explicitSpecifierFormats = {};
var implicitSpecifierFormats = {};
var explicitResolution = {};
var implicitResolution = {};

// ****************************************
// Common Regular Expression Pieces {{{
// ****************************************

validation.lineExpression = 
	RegExp("(\\w+)\\[([^\\]]+)\\]\\s*,\\s*(\\w+)\\[([^\\]]+)\\]");
validation.basicLine = RegExp("(\\w+)\\s*,\\s*(\\w+)");
validation.blankLine = /^\s*$/;
validation.header = /\s*TO\s*,\s*LOCATION\s*/i;
validation.afterParseLine = /([^,]+),(.*)$/;
validation.number = "\\d+";
validation.numberCap = "(" + validation.number + ")";

// ****************************************
// }}}
// ****************************************

// ****************************************
// Explicit Specifiers {{{
// ****************************************

// Specifier Name: Simple Explicit
// Description:
//	 Comma separated list of at least one index.
// Format: {number} ["," {number}]*

explicitSpecifierFormats.simpleExplicit = 
	RegExp("^" + validation.number + "(?:," + validation.number + ")*$"),

explicitResolution.simpleExplicit =
	function (specifier){
		specifier.content = 
			specifier.match[0].trim().split(",").map( cur => +cur );
		// Just transform the text numbers to actual numbers.
	};

// Specifier Name: Simple Range
// Description:
//	 Specify an inclusive range of consecutive integers.
// Format: { number } ".." { number }
//         {  start }      {   end  }

explicitSpecifierFormats.simpleRange = 
	RegExp("^" + validation.numberCap + "\\.\\." + validation.numberCap + "$"),

explicitResolution.simpleRange = 
	function (specifier){
		specifier.content = [];
		var first = +specifier.match[1];
		var second = +specifier.match[2];
		if ( first < second ) {
			for (var i = first; i <= second; i++){
				specifier.content.push(i);
			}
		} else {
			for (var i = second; i >= first; i--){
				specifier.content.push(i);
			}
		}
	};

// Specifier Name: Step To End
// Description:
//	 Specify a sequence of indices
//	 which are separated by a common difference, or step amount.
//	 (An arithmetic progression).
//	 Sequence starts at 'start' and proceeds to the largest
//	 number of the form 'start + k*step' that is less than
//	 or equal to 'end'.
// Format: { number } ":" { number } ".." { number }
//         {  start }     {  step  }      {   end  }
explicitSpecifierFormats.stepToEnd =
	RegExp("^" + validation.numberCap + ":" + validation.numberCap + "\\.\\." + validation.numberCap + "$"),

explicitResolution.stepToEnd =
	function (specifier){
		specifier.content = [];
		for (var i = +specifier.match[1];
					i <= +specifier.match[3];
					i += +specifier.match[2]) {
				specifier.content.push(i);
		}
	};

// Specifier Name: Step Range 
// Description: 
//	 Similar to Step to End specifier. Specifies a sequence
//	 of indices that starts from the 'start', uses
//	 'step' as a common difference. However, rather than
//	 proceeding while it does not exceed an end, it creates
//	 a sequence with length 'length + 1', such that
//		- The first number is 'start'.
//		- The last number is 'start + length*step'.
// Format: { number } ":" { number } ":" { number }
//         {  start }     {  step  }     { length }
explicitSpecifierFormats.stepRange =
	RegExp("^" + validation.numberCap + ":" + validation.numberCap + ":" + validation.numberCap + "$"),

explicitResolution.stepRange =
	function (specifier){
		var start = +specifier.match[1];
		specifier.content = [start];
		var multiplier = +specifier.match[2];
		var length = +specifier.match[3];
		for (var i = 1; i < length; i++){
			specifier.content.push( start + multiplier*i );
		}
	};

// ****************************************
// }}}
// ****************************************

// ****************************************
// Implicit Specifiers {{{
// ****************************************

// Specifier Name: Range Reuse
// Description:
//   Reuses the indices specified by the explicit specifier
//   on the same line.
// Format: ".."
implicitSpecifierFormats.rangeReuse =
	RegExp("^\\.\\.$"),

implicitResolution.rangeReuse =
	function (implicitSpec, explicitSpec){
		implicitSpec.content = explicitSpec.content;
		implicitSpec.length = implicitSpec.content.length;
	};

// Specifier Name: Offset Range Reuse
// Description:
//   Reuses the indices specified by the explicit specifier,
//   but adds a common offset to all of them.
// Format: { number } ".."
//         { offset }
implicitSpecifierFormats.offsetRangeReuse =
	RegExp("^" + validation.numberCap + "\\.\\.$"),

implicitResolution.offsetRangeReuse =
	function (implicitSpec, explicitSpec){
		let offset = +implicitSpec.match[1];
		implicitSpec.content = 
			explicitSpec.content.map( cur => cur + offset );
		implicitSpec.length = implicitSpec.content.length;
	};

// Specifier Name: Length Forward
// Description:
//   You can think of the '#' as being a placeholder for
//   the length of the explicit specifier index list.
//   So this acts like a simple range, which starts at
//   'start' and ends at 'start + length - 1'. The
//   'length - 1' is to ensure that both the explicit
//   specifier and the implicit specifier are the same
//   length.
// Format: { number } "..#"
//         {  start }
implicitSpecifierFormats.lengthForward = 
	RegExp("^" + validation.numberCap + "\\.\\.#$"),

implicitResolution.lengthForward = 
	function (implicitSpec, explicitSpec){
		let length = explicitSpec.length;
		implicitSpec.content = [];
		let start = +implicitSpec.match[1];
		for (var i = 0; i < length; i++) {
			implicitSpec.content.push(start + i);
		}
		implicitSpec.length = implicitSpec.content.length;
	};

// Specifier Name: Length Backward
// Description:
//   You can think of the '#' as being a placeholder
//   for the length of the explicit specifier index list.
//   So this acts like a simple range, but reversed. 
//   It starts at 'end' and proceeds backward to
//   'end - length + 1'. The 'length+1' is there
//   to ensure that the explicit specifier and the
//   implicit specifier are the same length.
// Format: "#.." { number }
//               {   end  }
implicitSpecifierFormats.lengthBackward =
	RegExp("^#\\.\\." + validation.numberCap + "$"),

implicitResolution.lengthBackward =
	function (implicitSpec, explicitSpec){
		let length = explicitSpec.length;
		implicitSpec.content = [];
		let end = +implicitSpec.match[1];
		for (var i = 0; i < length; i++) {
			implicitSpec.content.push(end - i);
		}
		implicitSpec.length = implicitSpec.content.length;
	};

// Specifier Name: Step Range Length Reuse
// Description:
//   You can think of the '#' as a placeholder
//   for the length of an explicit specifier.
//   So the index list produced by this specifier
//   is exactly like the step range explicit
//   specifier, with the 'length' parameter
//   replaced by the length of the explicit
//   specifier.
// Format: { number } ":" { number } ":#"
//         {  start }     {  step  }
implicitSpecifierFormats.stepRangeLengthReuse = 
	RegExp("^" + validation.numberCap + ":" + validation.numberCap + ":#$"),

implicitResolution.stepRangeLengthReuse = 
	function (implicitSpec, explicitSpec){
		var start  = +implicitSpec.match[1];
		var step   = +implicitSpec.match[2];
		var length = +implicitSpec.match[3];
		implicitSpec.content = [start];
		for (var i = start + step; i < length; i += step) {
			implicitSpec.content.push(i);
		}
		implicitSpec.length = implicitSpec.content.length;
	};

// ****************************************
// }}}
// ****************************************

module.exports = {
	validation               : validation,
	explicitSpecifierFormats : explicitSpecifierFormats,
	implicitSpecifierFormats : implicitSpecifierFormats,
	explicitResolution       : explicitResolution,
	implicitResolution       : implicitResolution,
}
