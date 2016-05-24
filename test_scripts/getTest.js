"use strict"

var getInputOutput = require('./getInputOutput.js');
var input, output;
[input, output] = getInputOutput(true, true, 2, 3);

console.log(input, output);
