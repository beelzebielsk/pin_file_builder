//////////////////////////////////////////////////
// Javascript Preamble : {{{
//////////////////////////////////////////////////

{ 
//////////////////////////////////////////////////
// Functions : {{{
//////////////////////////////////////////////////

	function makeInteger(digitArray, radix) {
		return parseInt(digitArray.join(''), radix); 
	} 

	function integerRange(opt) {
		var content = [];
		if (opt.start && opt.end) {
			var step = (opt.start <= opt.end ? 1 : -1);
			for (var i = opt.start; i != opt.end; i += step) content.push(i);
		} else if (opt.start && opt.length) {
			for (var i = 0; i < opt.length; i++) content.push( opt.start + i );
		} else if (opt.length && opt.end) {
			for (var i = 0; i < opt.length; i++) content.push( opt.end - i ) ;
		} else content = null;
		return content;
	}

	// Both arguments to this function are objects which
	// must have the following properties:
	//	- signalName (string)
	//	- content (array)
	function createSignalList(spec0, spec1) {
		return spec0.content.map( (_, i) => {
			var sigName = spec0.signalName + '[' + spec0.content[i] + ']';
			var pinName = spec1.signalName + '[' + spec1.content[i] + ']'
			pinName = pinName.toUpperCase();
			if (!pinTable[pinName])
				error("Attempt to reference non-existant pin: " + pinName);
			else
				return sigName + ", " + pinTable[pinName];
		} )
	}

//////////////////////////////////////////////////
// }}}
//////////////////////////////////////////////////

//////////////////////////////////////////////////
// Tables : {{{
//////////////////////////////////////////////////

	var implicitResolutionTable = {
		rangeReuse       : 
			function (explicitContent, implicitInfo) { return explicitContent; },
		offsetRangeReuse : function (explicitContent, implicitInfo) { 
			return explicitContent.map( (index) => index + implicitInfo.offset );
		},
		lengthForward    : function (explicitContent, implicitInfo) { 
			return integerRange( { 
				start : implicitInfo.start,
				length : explicitContent.length 
			} ); 
		},
		lengthBackward   : function (explicitContent, implicitInfo) {
			return integerRange( { 
				end : implicitInfo.end,
				length : explicitContent.length 
			} );
		},
	}

	var pinTable = require("./pin_table.json");

//////////////////////////////////////////////////
// }}}
//////////////////////////////////////////////////

}

//////////////////////////////////////////////////
// }}}
//////////////////////////////////////////////////

start = statements

statements =
	head:statement tail:(whitespace statement)*
	{ return [head].concat( tail.map( (result) => result[1] ) ).reduce( (prev, cur) => prev.concat(cur), [] ).join('\n'); }


statement = 
	left_set:explicitNameSet whitespace "," whitespace right_set:explicitNameSet
	{ 
		if (left_set.content.length != right_set.content.length)
			error("Index specifiers must have the same length! " 
			      + "Left specifier has length " + left_set.content.length + " "
						+ "and right specifier has length " + right_set.content.length
						+ '.');
		else
			return createSignalList(left_set, right_set);
	}
	/ explicit:explicitNameSet whitespace "," whitespace implicit:implicitNameSet
	{ 
		implicit.content = 
			implicitResolutionTable[implicit.specifierInfo.type](explicit.content, implicit.specifierInfo.info);
		return createSignalList(explicit, implicit);
	}
	/ implicit:implicitNameSet whitespace "," whitespace explicit:explicitNameSet
	{ 
		implicit.content = 
			implicitResolutionTable[implicit.specifierInfo.type](explicit.content, implicit.specifierInfo.info);
		return createSignalList(implicit, explicit);
	}
	/ left:signal whitespace ',' whitespace right:signal
	{ return left + ", " + pinTable[right.toUpperCase()]; }

implicitNameSet = 
	name:identifier "[" whitespace specifier:implicitIndexSpecifier whitespace "]"
	{ return { signalName : name, specifierInfo : specifier }; }
explicitNameSet = 
	name:identifier "[" whitespace indicies:explicitIndexSpecifier whitespace "]"
	{ return { signalName : name, content : indicies }; }

signal = $( identifier ('[' nonnegative_literal ']' ) ? )
identifier = $( (alpha / "_") ( "_" / alpha / numeric)* )
alphanumeric = ([a-zA-Z0-9])
alpha = [a-zA-Z]
numeric = [0-9]

//////////////////////////////////////////////////
// Implicit Index Specifiers : {{{
//////////////////////////////////////////////////

implicitIndexSpecifier =
	rangeReuse { return { type: 'rangeReuse' } }
	/ info:offsetRangeReuse 
		{ return { type: 'offsetRangeReuse', info: info }; }
	/ info:lengthForward { return { type: 'lengthForward', info: info  }; }
	/ info:lengthBackward { return { type: 'lengthBackward', info: info }; }

rangeReuse = ".."
offsetRangeReuse = offset:numeric_literal ".." ! "#" { return { offset : offset }; }
lengthForward = start:nonnegative_literal "..#" { return { start : start }; }
lengthBackward = "#.." end:nonnegative_literal { return { end : end } ; }
	
//////////////////////////////////////////////////
// }}}
//////////////////////////////////////////////////

//////////////////////////////////////////////////
// Explicit Index Specifiers : {{{
//////////////////////////////////////////////////

explicitIndexSpecifier = 
	simpleExplicit
	/ simpleRange 
	/ stepToEnd 
	/ stepRange 

// Needs to come before simpleRange in list of explicitIndex Specifiers.
simpleExplicit =
	head:nonnegative_literal !(".." / ":") tail:("," (nonnegative_literal))*
	// Each member of 'tail' is an array: [',', {some nonnegative_literal}].
	// Extract the literals.
	{ return [head].concat( tail.map( (match) => match[1] ) ); }

simpleRange = 
	left:(nonnegative_literal) !("," / ":") ".." right:(nonnegative_literal)
	{ 
		var step = (left < right ? 1 : -1);
		var content = [];
		for (var i = left; i != right; i += step) {
			content.push(i);
		}
		content.push(i);
		return content;
	}

stepToEnd =
	start:(nonnegative_literal) ":" step:(numeric_literal) ".." end:(nonnegative_literal)
	{ 
		var content = [];
		if (start <= end) {
			for (var i = start; i <= end; i += step) content.push(i);
		} else {
			for (var i = start; i >= end; i += step) content.push(i);
		}
		return content;
	}

stepRange =
	start:(nonnegative_literal) ":" step:(numeric_literal) ":" length:(nonnegative_literal)
	{
		var content = [];
		for (var i = 0; i < length; i++) content.push( start + step*i );
		return content;
	}

//////////////////////////////////////////////////
// }}}
//////////////////////////////////////////////////

//////////////////////////////////////////////////
// Numbers : {{{
//////////////////////////////////////////////////

numeric_literal = nonnegative_literal / negative_literal

negative_literal = 
	"-" number:numeric_literal
	{return -number;}

nonnegative_literal	= 
	binary_literal
	/ hexadecimal_literal
	/ octal_literal
	/ decimal_literal

binary_literal = 
	[bB] digits:binary 
	{ return makeIntegerdigits, 2; }
octal_literal =
	( [oO] / "0" ) digits:octal 
	{ return makeInteger(digits, 8); }
decimal_literal =
	digits:decimal
	{ return makeInteger(digits, 10); }
hexadecimal_literal = 
	( [hH] / "0" [Xx] ) digits:hexadecimal
	{ return makeInteger(digits, 16); }

decimal = [0-9]+
binary =  [01]+
octal =  [0-7]+ 
hexadecimal =  [0-9a-fA-F]+
whitespace = [ \t\n\r]*

//////////////////////////////////////////////////
// }}}
//////////////////////////////////////////////////

