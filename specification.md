# Rules

- Both index specifiers must have the same length.
	- There is no point in trying to make them have differing lengths since
	we can't re-use old pins without overwriting assignemnts. We could try to
	extrapolate pins, but one should make their intent clear.

# Index Specifiers

This is a string that specifies a non-empty range of indices. The program will print lines based on these indices.

## Specifier Objects:

The have the following properties:
- content : What it actually is
- Type : Implicit/Explicit (either 'e' or 'i')
- Name : specifier name, such as "simple_explicit"
- match : the result of a match function.
- Length : For explicit specifiers, for the use of implicit resolution. Is the number of indices in a list of indices.

# Explicit Index specifiers

- Simple Explicit specifier :
	- Format : [A,B,C,..] 
	- Explicit list of indices. The most basic specifier.
- Simple Range :
	- Format : [A..B]
	- Inclusive range. Contains every integer x in range A <= x <= B.
- Step To End :
	- Format : [A:B..C] 
	- Inclusive. Contains all following integers:
						{A+B*x : A+B*x <= C}
						In other words, A is a start, C is an end, and B is a step amount.
- Step Range : 
	- Format : [A:B:C] 
	- Contains a range of integers that starts at A, and ends at A + B\*C. . So C controls the length of the list, with 0 meaning only A and 1 meaning A, A + C, and 2 meaning A, A + C, A + 2\*C and so on.

# Implicit Index Specifiers

These index specifiers omit some information about which indices to specify. Since each line must include a "TO" entry and a "LOCATION" entry, an implicit specifier can use the indices from an explicit index specifier on the same line to build an index list.

This means that there must be at least one explciit index specifier on every line.

NOTE: Implicit index specifiers are not limited to 'TO' entries. They can also be used in 'LOCATION' entries.

- Range Reuse:
	- Format : [..] 
	- Uses the same index specifier as an explcit index specifier.
	- Example: 
		Implicit Form : Array[..]   , SW[0..5]
		Explicit Form : Array[0..5] , SW[0..5]
- Offset Range Reuse: 
	- Format : [A..] 
	- Uses the same indices in an explicit index specifier, but shifted up by 'A'. In other words, let 'j' be an index in this implicit list: for every index 'i' in an explicit list, j = A + i.
	- Example:
		Implicit Form : array[2..]  , SW[1..6]
		Explicit Form : array[3..8] , SW[1..6]
- Length Forward : 
	- Format : [A..#] 
	- The range here doesn't use an explicit index list itself, but rather the length of an explicit index list. The index specifier starts from A and proceeds to [A..(A+length-1)].
	- Example:
		Implicit Form : array[5..#], SW[1..6]
		Explicit Form : array[5..10], SW[1..6]
	- Example:
		Implicit Form : array[5..#], SW[0:2..10]
		Explicit Form : array[5..10], SW[0:2..10]
	- Exmaple:
		Implicit Form : array[5..#], SW[2,3,5,7,11]
		Explicit Form : array[5..9], SW[2,3,5,7,11]

- Length Backward 
	- Format : [#..A] 
	- The range here doesn't use an explicit index list itself, but rather the length of an explicit index list. The index specifier starts from (A - length + 1) and proceeds to A.
	- Example:
		Implicit Form : array[#..8], SW[1..6]
		Explicit Form : array[3..8], SW[1..6]
	- Example:
		Implicit Form : array[#..8], SW[0:2..10]
		Explicit Form : array[3..8], SW[0:2..10]
	- Exmaple:
		Implicit Form : array[#..8], SW[2,3,5,7,11]
		Explicit Form : array[4..8], SW[2,3,5,7,11]

- Step Range Length Reuse : 
	- Format : [A:B:#] 
	- The range here doesn't use an explicit index list itself, but rather the length of an explicit index list. This specifier works just like the explicit index specifier of similar form: [A:B:C], where 'C' is replaced by the length of an explicit index specifier minus 1. [A:B:(length-1)].
	- Example:
		Implicit Form : array[0:2:#]     , SW[0..5]
		Explicit Form : array[0:2:4]     , SW[0..5]
		Explicit Form : array[0,2,4,6,8] , SW[0..5]
	- Example:
		Implicit Form : array[1:2:#]   , SW[0:3..10]
		Explicit Form : array[1:2:3]   , SW[0:3..10]
		Explicit Form : array[1,3,5,7] , SW[0:3..10]
	- Exmaple:
		Implicit Form : array[4:3:#]           , SW[2,3,5,7,11,13]
		Explicit Form : array[4:3:5]           , SW[2,3,5,7,11,13]
		Explicit Form : array[4,7,10,13,16,19] , SW[2,3,5,7,11,13]

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

# TODO

- Get command parser working.
- Get explicit specifiers working.
- Get first four implicit specifiers working.
