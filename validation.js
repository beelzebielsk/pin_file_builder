"use strict"
var validation = {};

validation.lineExpression = RegExp("(\\w+)\\[([^\\]]+)\\]\\s*,\\s*(\\w+)\\[([^\\]]+)\\]");
validation.basicLine = RegExp("(\\w+)\\s*,\\s*(\\w+)");
validation.blankLine = /^\s*$/;
validation.afterParseLine = /([^,]+),(.*)$/;
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

module.exports = validation;
