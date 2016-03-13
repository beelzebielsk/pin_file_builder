# Use

This is a program for quickly creating pin assignment files for use with the Altera DE-2 board and Quartus II's FPGA programming software.

If you've used it, you know that specifying the actual pin name for each signal in a file seems like it should be a much easier task.

## Problems it Solves

- You no longer need to find the actual pin name to create a pin assignment file. You can use the descriptive pin names that are written on the board itself, and within the DE-2 pin assignment guide.
- You can specify assignments for *ranges* of signals and *ranges* of pins.

### Example

**Normal Pin Assignment File**:

```
TO, LOCATION
output[0], PIN_AE23
output[1], PIN_AF23
output[2], PIN_AB21
output[3], PIN_AC22
output[4], PIN_AD22
output[5], PIN_AD23
op0[0], PIN_N25
op0[1], PIN_N26
op0[2], PIN_P25
op0[3], PIN_AE14
op0[4], PIN_AF14
op0[5], PIN_AD13
op1[0], PIN_AC13
op1[1], PIN_C13
op1[2], PIN_B13
op1[3], PIN_A13
op1[4], PIN_N1
op1[5], PIN_P1
opcode[0], PIN_U4
opcode[1], PIN_V1
opcode[2], PIN_V2
execute, PIN_G26
```

That's quite long! You can shorten all of that to:

**Shorthand pin assignment file:**
```
output[0..5], LEDR[..]
op0[0..5], SW[..]
op1[0..5], SW[6..]
opcode[0..2], SW[15..]
execute, KEY[0]
```

The latter is easier to maintain, since you can change a lot of assignments quickly. It's also more descriptive. You can come back to an older project and know what to expect when you put your program on a board.

# How to use

There are two major programs here:
- **pin\_parser.js**, which transforms a file that's in the descriptive shorthand demonstrated above and unwraps it such that there's only one index in between each set of square braces.
	- Use: 
		- `node pin_parser.js` : Will take its input from stadard input and write to standard output.
		- `node pin_parser.js path/to/inputFile` : Will take its input from `inputFile` and write output to standard output.
		- `node pin_parser.js path/to/inputFile path/to/outputFile` : Will take its input from `inputFile` and write output to `outputFile`.
- **replacer.js**, which takes an unwrapped shorthand file and translates it into a file of actual pin names.
	- Use: `node replacer.js` : Will take its input from standard input and write to standard output.

# Specification of Shorthand

## Rules

- Both index specifiers must have the same length.
	- There is no point in trying to make them have differing lengths since
	we can't re-use old pins without overwriting assignemnts. We could try to
	extrapolate pins, but one should make their intent clear.
- Both at least one index specifier must be explicit.

## Index Specifiers

This is a string that specifies a non-empty range of indices. The program will print lines based on these indices.

### Specifier Objects:


The have the following properties:
- content : The completely resolved array of indices.
- text : The actual specifier.
- Type : Implicit/Explicit (either 'e' or 'i')
- Name : specifier name, such as "simpleExplicit"
- match : the result of a format match.
- Length : The length of the completely resolved array of indices. This is useful for resolving implicit specifiers.

## Explicit Index specifiers

These are index specifiers that can be immediately resolved. No extra information is necessary to figure out the indices that are specified.

- Simple Explicit specifier :
	- Format : `[A,B,C,..] `
	- Explicit list of indices. The most basic specifier.
- Simple Range :
	- Format : `[A..B]`
	- Inclusive range. Contains every integer x in range A <= x <= B.
- Step To End :
	- Format : `[A:B..C] `
	- Inclusive. Contains all following integers:
						{A+B*x : A+B*x <= C}
						In other words, A is a start, C is an end, and B is a step amount.
- Step Range : 
	- Format : `[A:B:C] `
	- Contains a range of integers that starts at A, and ends at A + B\*C. . So C controls the length of the list, with 0 meaning only A and 1 meaning A, A + C, and 2 meaning A, A + C, A + 2\*C and so on.

## Implicit Index Specifiers

These index specifiers omit some information about which indices to specify. Since each line must include a "TO" entry and a "LOCATION" entry, an implicit specifier can use the indices from an explicit index specifier on the same line to build an index list.

This means that there must be at least one explciit index specifier on every line.

```
NOTE: Implicit index specifiers are not limited to 'TO' entries. They can also be used in 'LOCATION' entries.
```

- Range Reuse:
	- Format : `[..] `
	- Uses the same index specifier as an explcit index specifier.
	- Example: 
		```
		Implicit Form : Array[..]   , SW[0..5]

		Explicit Form : Array[0..5] , SW[0..5]
		```
- Offset Range Reuse: 
	- Format : `[A..] `
	- Uses the same indices in an explicit index specifier, but shifted up by 'A'. In other words, let 'j' be an index in this implicit list: for every index 'i' in an explicit list, j = A + i.
	- Example:
		```
		Implicit Form : array[2..]  , SW[1..6]

		Explicit Form : array[3..8] , SW[1..6]
		```
- Length Forward : 
	- Format : `[A..#] `
	- The range here doesn't use an explicit index list itself, but rather the length of an explicit index list. The index specifier starts from A and proceeds to [A..(A+length-1)].
	- Example:
		```
		Implicit Form : array[5..#], SW[1..6]

		Explicit Form : array[5..10], SW[1..6]
		```
	- Example:
		```
		Implicit Form : array[5..#], SW[0:2..10]

		Explicit Form : array[5..10], SW[0:2..10]
		```
	- Exmaple:
		```
		Implicit Form : array[5..#], SW[2,3,5,7,11]

		Explicit Form : array[5..9], SW[2,3,5,7,11]
		```

- Length Backward 
	- Format : `[#..A] `
	- The range here doesn't use an explicit index list itself, but rather the length of an explicit index list. The index specifier starts from (A - length + 1) and proceeds to A.
	- Example:
		```
		Implicit Form : array[#..8], SW[1..6]

		Explicit Form : array[3..8], SW[1..6]
		```
	- Example:
		```
		Implicit Form : array[#..8], SW[0:2..10]

		Explicit Form : array[3..8], SW[0:2..10]
		```
	- Exmaple:
		```
		Implicit Form : array[#..8], SW[2,3,5,7,11]

		Explicit Form : array[4..8], SW[2,3,5,7,11]
		```

- Step Range Length Reuse : 
	- Format : `[A:B:#] `
	- The range here doesn't use an explicit index list itself, but rather the length of an explicit index list. This specifier works just like the explicit index specifier of similar form: [A:B:C], where 'C' is replaced by the length of an explicit index specifier minus 1. [A:B:(length-1)].
	- Example:
		```
		Implicit Form : array[0:2:#]     , SW[0..5]

		Explicit Form : array[0:2:4]     , SW[0..5]

		Explicit Form : array[0,2,4,6,8] , SW[0..5]
		```
	- Example:
		```
		Implicit Form : array[1:2:#]   , SW[0:3..10]

		Explicit Form : array[1:2:3]   , SW[0:3..10]

		Explicit Form : array[1,3,5,7] , SW[0:3..10]
		```
	- Exmaple:
		```
		Implicit Form : array[4:3:#]           , SW[2,3,5,7,11,13]

		Explicit Form : array[4:3:5]           , SW[2,3,5,7,11,13]

		Explicit Form : array[4,7,10,13,16,19] , SW[2,3,5,7,11,13]
		```

Line form:
```
Vim Specific Regex: \v(\w+)\[([^]]+)]\s*,\s*(\w+)\[([^]]+)]
```
```
(\w+)\[([^]]+)]\s*,\s*(\w+)\[([^]]+)]
```
```
( \w+     ) "[" ( [^]]+              ) "]," ( \w+           ) "[" ( [^]]+                    ) ]
( TO_name )     ( TO_index_specifier )      ( LOCATION_name )     ( LOCATION_index_specifier )
```
