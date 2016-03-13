"use strict"
module.exports = {
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
