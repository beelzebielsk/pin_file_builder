"use strict"
module.exports = {
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
}
