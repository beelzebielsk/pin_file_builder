"use strict"
module.exports = {
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

