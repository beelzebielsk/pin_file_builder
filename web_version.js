// ****************************************
// DEFINITIONS
// ****************************************

"use strict"
// Placing all of the format information in one place.
// This seems more sensible considering that the
// name of a format has to be consistent across all
// objects (the format list and the appropriate 
// resolution table). Keeping all of the
// definitions that are dependent on a name
// in one place helps to keep the names
// consistent.

var validation = {};
var explicitSpecifierFormats = {};
var implicitSpecifierFormats = {};
var explicitResolutionTable = {};
var implicitResolutionTable = {};

// ****************************************
// Common Regular Expression Pieces
// ****************************************

validation.lineExpression = 
	RegExp("\\s*(\\w+)\\[([^\\]]+)\\]\\s*,\\s*(\\w+)\\[([^\\]]+)\\]\\s*");
validation.basicLine = RegExp("\\s*(\\w+)\\s*,\\s*(\\w+)\\s*");
validation.blankLine = /^\s*$/;
validation.header = /\s*TO\s*,\s*LOCATION\s*/i;
validation.afterParseLine = /([^,]+),(.*)$/;
validation.number = "\\d+";
validation.numberCap = "(" + validation.number + ")";

// ****************************************
// Explicit Specifiers
// ****************************************

// Specifier Name: Simple Explicit
// Description:
//	 Comma separated list of at least on index.
// Format: {number} ["," {number}]*

explicitSpecifierFormats.simpleExplicit = 
	RegExp("^" + validation.number + "(?:," + validation.number + ")*$"),

explicitResolutionTable.simpleExplicit =
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

explicitResolutionTable.simpleRange = 
	function (specifier){
		specifier.content = [];
		var first = +specifier.match[1];
		var second = +specifier.match[2];
		if ( first < second ) {
			for (let i = first; i <= second; i++){
				specifier.content.push(i);
			}
		} else {
			for (let i = first; i >= second; i--){
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

explicitResolutionTable.stepToEnd =
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

explicitResolutionTable.stepRange =
	function (specifier){
		var start = +specifier.match[1];
		specifier.content = [start];
		var multiplier = +specifier.match[2];
		var length = +specifier.match[3];
		for (var i = 1; i <= length; i++){
			specifier.content.push( start + multiplier*i );
		}
	};


// ****************************************
// Implicit Specifiers
// ****************************************

// Specifier Name: Range Reuse
// Description:
//   Reuses the indices specified by the explicit specifier
//   on the same line.
// Format: ".."
implicitSpecifierFormats.rangeReuse =
	RegExp("^\\.\\.$"),

implicitResolutionTable.rangeReuse =
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

implicitResolutionTable.offsetRangeReuse =
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

implicitResolutionTable.lengthForward = 
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

implicitResolutionTable.lengthBackward =
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

implicitResolutionTable.stepRangeLengthReuse = 
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
// PIN TABLE
// ****************************************

var pinTable = {
	"SW[0]"         : "PIN_N25",
	"SW[1]"         : "PIN_N26",
	"SW[2]"         : "PIN_P25",
	"SW[3]"         : "PIN_AE14",
	"SW[4]"         : "PIN_AF14",
	"SW[5]"         : "PIN_AD13",
	"SW[6]"         : "PIN_AC13",
	"SW[7]"         : "PIN_C13",
	"SW[8]"         : "PIN_B13",
	"SW[9]"         : "PIN_A13",
	"SW[10]"        : "PIN_N1",
	"SW[11]"        : "PIN_P1",
	"SW[12]"        : "PIN_P2",
	"SW[13]"        : "PIN_T7",
	"SW[14]"        : "PIN_U3",
	"SW[15]"        : "PIN_U4",
	"SW[16]"        : "PIN_V1",
	"SW[17]"        : "PIN_V2",
	"DRAM_ADDR[0]"  : "PIN_T6",
	"DRAM_ADDR[1]"  : "PIN_V4",
	"DRAM_ADDR[2]"  : "PIN_V3",
	"DRAM_ADDR[3]"  : "PIN_W2",
	"DRAM_ADDR[4]"  : "PIN_W1",
	"DRAM_ADDR[5]"  : "PIN_U6",
	"DRAM_ADDR[6]"  : "PIN_U7",
	"DRAM_ADDR[7]"  : "PIN_U5",
	"DRAM_ADDR[8]"  : "PIN_W4",
	"DRAM_ADDR[9]"  : "PIN_W3",
	"DRAM_ADDR[10]" : "PIN_Y1",
	"DRAM_ADDR[11]" : "PIN_V5",
	"DRAM_DQ[0]"    : "PIN_V6",
	"DRAM_DQ[1]"    : "PIN_AA2",
	"DRAM_DQ[2]"    : "PIN_AA1",
	"DRAM_DQ[3]"    : "PIN_Y3",
	"DRAM_DQ[4]"    : "PIN_Y4",
	"DRAM_DQ[5]"    : "PIN_R8",
	"DRAM_DQ[6]"    : "PIN_T8",
	"DRAM_DQ[7]"    : "PIN_V7",
	"DRAM_DQ[8]"    : "PIN_W6",
	"DRAM_DQ[9]"    : "PIN_AB2",
	"DRAM_DQ[10]"   : "PIN_AB1",
	"DRAM_DQ[11]"   : "PIN_AA4",
	"DRAM_DQ[12]"   : "PIN_AA3",
	"DRAM_DQ[13]"   : "PIN_AC2",
	"DRAM_DQ[14]"   : "PIN_AC1",
	"DRAM_DQ[15]"   : "PIN_AA5",
	"DRAM_BA_0"     : "PIN_AE2",
	"DRAM_BA_1"     : "PIN_AE3",
	"DRAM_LDQM"     : "PIN_AD2",
	"DRAM_UDQM"     : "PIN_Y5",
	"DRAM_RAS_N"    : "PIN_AB4",
	"DRAM_CAS_N"    : "PIN_AB3",
	"DRAM_CKE"      : "PIN_AA6",
	"DRAM_CLK"      : "PIN_AA7",
	"DRAM_WE_N"     : "PIN_AD3",
	"DRAM_CS_N"     : "PIN_AC3",
	"FL_ADDR[0]"    : "PIN_AC18",
	"FL_ADDR[1]"    : "PIN_AB18",
	"FL_ADDR[2]"    : "PIN_AE19",
	"FL_ADDR[3]"    : "PIN_AF19",
	"FL_ADDR[4]"    : "PIN_AE18",
	"FL_ADDR[5]"    : "PIN_AF18",
	"FL_ADDR[6]"    : "PIN_Y16",
	"FL_ADDR[7]"    : "PIN_AA16",
	"FL_ADDR[8]"    : "PIN_AD17",
	"FL_ADDR[9]"    : "PIN_AC17",
	"FL_ADDR[10]"   : "PIN_AE17",
	"FL_ADDR[11]"   : "PIN_AF17",
	"FL_ADDR[12]"   : "PIN_W16",
	"FL_ADDR[13]"   : "PIN_W15",
	"FL_ADDR[14]"   : "PIN_AC16",
	"FL_ADDR[15]"   : "PIN_AD16",
	"FL_ADDR[16]"   : "PIN_AE16",
	"FL_ADDR[17]"   : "PIN_AC15",
	"FL_ADDR[18]"   : "PIN_AB15",
	"FL_ADDR[19]"   : "PIN_AA15",
	"FL_ADDR[20]"   : "PIN_Y15",
	"FL_ADDR[21]"   : "PIN_Y14",
	"FL_DQ[0]"      : "PIN_AD19",
	"FL_DQ[1]"      : "PIN_AC19",
	"FL_DQ[2]"      : "PIN_AF20",
	"FL_DQ[3]"      : "PIN_AE20",
	"FL_DQ[4]"      : "PIN_AB20",
	"FL_DQ[5]"      : "PIN_AC20",
	"FL_DQ[6]"      : "PIN_AF21",
	"FL_DQ[7]"      : "PIN_AE21",
	"FL_CE_N"       : "PIN_V17",
	"FL_OE_N"       : "PIN_W17",
	"FL_RST_N"      : "PIN_AA18",
	"FL_WE_N"       : "PIN_AA17",
	"SRAM_ADDR[0]"  : "PIN_AE4",
	"SRAM_ADDR[1]"  : "PIN_AF4",
	"SRAM_ADDR[2]"  : "PIN_AC5",
	"SRAM_ADDR[3]"  : "PIN_AC6",
	"SRAM_ADDR[4]"  : "PIN_AD4",
	"SRAM_ADDR[5]"  : "PIN_AD5",
	"SRAM_ADDR[6]"  : "PIN_AE5",
	"SRAM_ADDR[7]"  : "PIN_AF5",
	"SRAM_ADDR[8]"  : "PIN_AD6",
	"SRAM_ADDR[9]"  : "PIN_AD7",
	"SRAM_ADDR[10]" : "PIN_V10",
	"SRAM_ADDR[11]" : "PIN_V9",
	"SRAM_ADDR[12]" : "PIN_AC7",
	"SRAM_ADDR[13]" : "PIN_W8",
	"SRAM_ADDR[14]" : "PIN_W10",
	"SRAM_ADDR[15]" : "PIN_Y10",
	"SRAM_ADDR[16]" : "PIN_AB8",
	"SRAM_ADDR[17]" : "PIN_AC8",
	"SRAM_DQ[0]"    : "PIN_AD8",
	"SRAM_DQ[1]"    : "PIN_AE6",
	"SRAM_DQ[2]"    : "PIN_AF6",
	"SRAM_DQ[3]"    : "PIN_AA9",
	"SRAM_DQ[4]"    : "PIN_AA10",
	"SRAM_DQ[5]"    : "PIN_AB10",
	"SRAM_DQ[6]"    : "PIN_AA11",
	"SRAM_DQ[7]"    : "PIN_Y11",
	"SRAM_DQ[8]"    : "PIN_AE7",
	"SRAM_DQ[9]"    : "PIN_AF7",
	"SRAM_DQ[10]"   : "PIN_AE8",
	"SRAM_DQ[11]"   : "PIN_AF8",
	"SRAM_DQ[12]"   : "PIN_W11",
	"SRAM_DQ[13]"   : "PIN_W12",
	"SRAM_DQ[14]"   : "PIN_AC9",
	"SRAM_DQ[15]"   : "PIN_AC10",
	"SRAM_WE_N"     : "PIN_AE10",
	"SRAM_OE_N"     : "PIN_AD10",
	"SRAM_UB_N"     : "PIN_AF9",
	"SRAM_LB_N"     : "PIN_AE9",
	"SRAM_CE_N"     : "PIN_AC11",
	"OTG_ADDR[0]"   : "PIN_K7",
	"OTG_ADDR[1]"   : "PIN_F2",
	"OTG_DATA[0]"   : "PIN_F4",
	"OTG_DATA[1]"   : "PIN_D2",
	"OTG_DATA[2]"   : "PIN_D1",
	"OTG_DATA[3]"   : "PIN_F7",
	"OTG_DATA[4]"   : "PIN_J5",
	"OTG_DATA[5]"   : "PIN_J8",
	"OTG_DATA[6]"   : "PIN_J7",
	"OTG_DATA[7]"   : "PIN_H6",
	"OTG_DATA[8]"   : "PIN_E2",
	"OTG_DATA[9]"   : "PIN_E1",
	"OTG_DATA[10]"  : "PIN_K6",
	"OTG_DATA[11]"  : "PIN_K5",
	"OTG_DATA[12]"  : "PIN_G4",
	"OTG_DATA[13]"  : "PIN_G3",
	"OTG_DATA[14]"  : "PIN_J6",
	"OTG_DATA[15]"  : "PIN_K8",
	"OTG_CS_N"      : "PIN_F1",
	"OTG_RD_N"      : "PIN_G2",
	"OTG_WR_N"      : "PIN_G1",
	"OTG_RST_N"     : "PIN_G5",
	"OTG_INT0"      : "PIN_B3",
	"OTG_INT1"      : "PIN_C3",
	"OTG_DACK0_N"   : "PIN_C2",
	"OTG_DACK1_N"   : "PIN_B2",
	"OTG_DREQ0"     : "PIN_F6",
	"OTG_DREQ1"     : "PIN_E5",
	"OTG_FSPEED"    : "PIN_F3",
	"OTG_LSPEED"    : "PIN_G6",
	"LCD_DATA[0]"   : "PIN_J1",
	"LCD_DATA[1]"   : "PIN_J2",
	"LCD_DATA[2]"   : "PIN_H1",
	"LCD_DATA[3]"   : "PIN_H2",
	"LCD_DATA[4]"   : "PIN_J4",
	"LCD_DATA[5]"   : "PIN_J3",
	"LCD_DATA[6]"   : "PIN_H4",
	"LCD_DATA[7]"   : "PIN_H3",
	"LCD_RW"        : "PIN_K4",
	"LCD_EN"        : "PIN_K3",
	"LCD_RS"        : "PIN_K1",
	"LCD_ON"        : "PIN_L4",
	"LCD_BLON"      : "PIN_K2",
	"SD_DAT"        : "PIN_AD24",
	"SD_DAT3"       : "PIN_AC23",
	"SD_CMD"        : "PIN_Y21",
	"SD_CLK"        : "PIN_AD25",
	"TDI"           : "PIN_B14",
	"TCS"           : "PIN_A14",
	"TCK"           : "PIN_D14",
	"TDO"           : "PIN_F14",
	"IRDA_TXD"      : "PIN_AE24",
	"IRDA_RXD"      : "PIN_AE25",
	"HEX0[0]"       : "PIN_AF10",
	"HEX0[1]"       : "PIN_AB12",
	"HEX0[2]"       : "PIN_AC12",
	"HEX0[3]"       : "PIN_AD11",
	"HEX0[4]"       : "PIN_AE11",
	"HEX0[5]"       : "PIN_V14",
	"HEX0[6]"       : "PIN_V13",
	"HEX1[0]"       : "PIN_V20",
	"HEX1[1]"       : "PIN_V21",
	"HEX1[2]"       : "PIN_W21",
	"HEX1[3]"       : "PIN_Y22",
	"HEX1[4]"       : "PIN_AA24",
	"HEX1[5]"       : "PIN_AA23",
	"HEX1[6]"       : "PIN_AB24",
	"HEX2[0]"       : "PIN_AB23",
	"HEX2[1]"       : "PIN_V22",
	"HEX2[2]"       : "PIN_AC25",
	"HEX2[3]"       : "PIN_AC26",
	"HEX2[4]"       : "PIN_AB26",
	"HEX2[5]"       : "PIN_AB25",
	"HEX2[6]"       : "PIN_Y24",
	"HEX3[0]"       : "PIN_Y23",
	"HEX3[1]"       : "PIN_AA25",
	"HEX3[2]"       : "PIN_AA26",
	"HEX3[3]"       : "PIN_Y26",
	"HEX3[4]"       : "PIN_Y25",
	"HEX3[5]"       : "PIN_U22",
	"HEX3[6]"       : "PIN_W24",
	"HEX4[0]"       : "PIN_U9",
	"HEX4[1]"       : "PIN_U1",
	"HEX4[2]"       : "PIN_U2",
	"HEX4[3]"       : "PIN_T4",
	"HEX4[4]"       : "PIN_R7",
	"HEX4[5]"       : "PIN_R6",
	"HEX4[6]"       : "PIN_T3",
	"HEX5[0]"       : "PIN_T2",
	"HEX5[1]"       : "PIN_P6",
	"HEX5[2]"       : "PIN_P7",
	"HEX5[3]"       : "PIN_T9",
	"HEX5[4]"       : "PIN_R5",
	"HEX5[5]"       : "PIN_R4",
	"HEX5[6]"       : "PIN_R3",
	"HEX6[0]"       : "PIN_R2",
	"HEX6[1]"       : "PIN_P4",
	"HEX6[2]"       : "PIN_P3",
	"HEX6[3]"       : "PIN_M2",
	"HEX6[4]"       : "PIN_M3",
	"HEX6[5]"       : "PIN_M5",
	"HEX6[6]"       : "PIN_M4",
	"HEX7[0]"       : "PIN_L3",
	"HEX7[1]"       : "PIN_L2",
	"HEX7[2]"       : "PIN_L9",
	"HEX7[3]"       : "PIN_L6",
	"HEX7[4]"       : "PIN_L7",
	"HEX7[5]"       : "PIN_P9",
	"HEX7[6]"       : "PIN_N9",
	"KEY[0]"        : "PIN_G26",
	"KEY[1]"        : "PIN_N23",
	"KEY[2]"        : "PIN_P23",
	"KEY[3]"        : "PIN_W26",
	"LEDR[0]"       : "PIN_AE23",
	"LEDR[1]"       : "PIN_AF23",
	"LEDR[2]"       : "PIN_AB21",
	"LEDR[3]"       : "PIN_AC22",
	"LEDR[4]"       : "PIN_AD22",
	"LEDR[5]"       : "PIN_AD23",
	"LEDR[6]"       : "PIN_AD21",
	"LEDR[7]"       : "PIN_AC21",
	"LEDR[8]"       : "PIN_AA14",
	"LEDR[9]"       : "PIN_Y13",
	"LEDR[10]"      : "PIN_AA13",
	"LEDR[11]"      : "PIN_AC14",
	"LEDR[12]"      : "PIN_AD15",
	"LEDR[13]"      : "PIN_AE15",
	"LEDR[14]"      : "PIN_AF13",
	"LEDR[15]"      : "PIN_AE13",
	"LEDR[16]"      : "PIN_AE12",
	"LEDR[17]"      : "PIN_AD12",
	"LEDG[0]"       : "PIN_AE22",
	"LEDG[1]"       : "PIN_AF22",
	"LEDG[2]"       : "PIN_W19",
	"LEDG[3]"       : "PIN_V18",
	"LEDG[4]"       : "PIN_U18",
	"LEDG[5]"       : "PIN_U17",
	"LEDG[6]"       : "PIN_AA20",
	"LEDG[7]"       : "PIN_Y18",
	"LEDG[8]"       : "PIN_Y12",
	"CLOCK_27"      : "PIN_D13",
	"CLOCK_50"      : "PIN_N2",
	"EXT_CLOCK"     : "PIN_P26",
	"UART_RXD"      : "PIN_C25",
	"UART_TXD"      : "PIN_B25",
	"PS2_CLK"       : "PIN_D26",
	"PS2_DAT"       : "PIN_C24",
	"I2C_SCLK"      : "PIN_A6",
	"I2C_SDAT"      : "PIN_B6",
	"TD_DATA[0]"    : "PIN_J9",
	"TD_DATA[1]"    : "PIN_E8",
	"TD_DATA[2]"    : "PIN_H8",
	"TD_DATA[3]"    : "PIN_H10",
	"TD_DATA[4]"    : "PIN_G9",
	"TD_DATA[5]"    : "PIN_F9",
	"TD_DATA[6]"    : "PIN_D7",
	"TD_DATA[7]"    : "PIN_C7",
	"TD_HS"         : "PIN_D5",
	"TD_VS"         : "PIN_K9",
	"TD_RESET"      : "PIN_C4",
	"VGA_R[0]"      : "PIN_C8",
	"VGA_R[1]"      : "PIN_F10",
	"VGA_R[2]"      : "PIN_G10",
	"VGA_R[3]"      : "PIN_D9",
	"VGA_R[4]"      : "PIN_C9",
	"VGA_R[5]"      : "PIN_A8",
	"VGA_R[6]"      : "PIN_H11",
	"VGA_R[7]"      : "PIN_H12",
	"VGA_R[8]"      : "PIN_F11",
	"VGA_R[9]"      : "PIN_E10",
	"VGA_G[0]"      : "PIN_B9",
	"VGA_G[1]"      : "PIN_A9",
	"VGA_G[2]"      : "PIN_C10",
	"VGA_G[3]"      : "PIN_D10",
	"VGA_G[4]"      : "PIN_B10",
	"VGA_G[5]"      : "PIN_A10",
	"VGA_G[6]"      : "PIN_G11",
	"VGA_G[7]"      : "PIN_D11",
	"VGA_G[8]"      : "PIN_E12",
	"VGA_G[9]"      : "PIN_D12",
	"VGA_B[0]"      : "PIN_J13",
	"VGA_B[1]"      : "PIN_J14",
	"VGA_B[2]"      : "PIN_F12",
	"VGA_B[3]"      : "PIN_G12",
	"VGA_B[4]"      : "PIN_J10",
	"VGA_B[5]"      : "PIN_J11",
	"VGA_B[6]"      : "PIN_C11",
	"VGA_B[7]"      : "PIN_B11",
	"VGA_B[8]"      : "PIN_C12",
	"VGA_B[9]"      : "PIN_B12",
	"VGA_CLK"       : "PIN_B8",
	"VGA_BLANK"     : "PIN_D6",
	"VGA_HS"        : "PIN_A7",
	"VGA_VS"        : "PIN_D8",
	"VGA_SYNC"      : "PIN_B7",
	"AUD_ADCLRCK"   : "PIN_C5",
	"AUD_ADCDAT"    : "PIN_B5",
	"AUD_DACLRCK"   : "PIN_C6",
	"AUD_DACDAT"    : "PIN_A4",
	"AUD_XCK"       : "PIN_A5",
	"AUD_BCLK"      : "PIN_B4",
	"ENET_DATA[0]"  : "PIN_D17",
	"ENET_DATA[1]"  : "PIN_C17",
	"ENET_DATA[2]"  : "PIN_B18",
	"ENET_DATA[3]"  : "PIN_A18",
	"ENET_DATA[4]"  : "PIN_B17",
	"ENET_DATA[5]"  : "PIN_A17",
	"ENET_DATA[6]"  : "PIN_B16",
	"ENET_DATA[7]"  : "PIN_B15",
	"ENET_DATA[8]"  : "PIN_B20",
	"ENET_DATA[9]"  : "PIN_A20",
	"ENET_DATA[10]" : "PIN_C19",
	"ENET_DATA[11]" : "PIN_D19",
	"ENET_DATA[12]" : "PIN_B19",
	"ENET_DATA[13]" : "PIN_A19",
	"ENET_DATA[14]" : "PIN_E18",
	"ENET_DATA[15]" : "PIN_D18",
	"ENET_CLK"      : "PIN_B24",
	"ENET_CMD"      : "PIN_A21",
	"ENET_CS_N"     : "PIN_A23",
	"ENET_INT"      : "PIN_B21",
	"ENET_RD_N"     : "PIN_A22",
	"ENET_WR_N"     : "PIN_B22",
	"ENET_RST_N"    : "PIN_B23",
	"GPIO_0[0]"     : "PIN_D25",
	"GPIO_0[1]"     : "PIN_J22",
	"GPIO_0[2]"     : "PIN_E26",
	"GPIO_0[3]"     : "PIN_E25",
	"GPIO_0[4]"     : "PIN_F24",
	"GPIO_0[5]"     : "PIN_F23",
	"GPIO_0[6]"     : "PIN_J21",
	"GPIO_0[7]"     : "PIN_J20",
	"GPIO_0[8]"     : "PIN_F25",
	"GPIO_0[9]"     : "PIN_F26",
	"GPIO_0[10]"    : "PIN_N18",
	"GPIO_0[11]"    : "PIN_P18",
	"GPIO_0[12]"    : "PIN_G23",
	"GPIO_0[13]"    : "PIN_G24",
	"GPIO_0[14]"    : "PIN_K22",
	"GPIO_0[15]"    : "PIN_G25",
	"GPIO_0[16]"    : "PIN_H23",
	"GPIO_0[17]"    : "PIN_H24",
	"GPIO_0[18]"    : "PIN_J23",
	"GPIO_0[19]"    : "PIN_J24",
	"GPIO_0[20]"    : "PIN_H25",
	"GPIO_0[21]"    : "PIN_H26",
	"GPIO_0[22]"    : "PIN_H19",
	"GPIO_0[23]"    : "PIN_K18",
	"GPIO_0[24]"    : "PIN_K19",
	"GPIO_0[25]"    : "PIN_K21",
	"GPIO_0[26]"    : "PIN_K23",
	"GPIO_0[27]"    : "PIN_K24",
	"GPIO_0[28]"    : "PIN_L21",
	"GPIO_0[29]"    : "PIN_L20",
	"GPIO_0[30]"    : "PIN_J25",
	"GPIO_0[31]"    : "PIN_J26",
	"GPIO_0[32]"    : "PIN_L23",
	"GPIO_0[33]"    : "PIN_L24",
	"GPIO_0[34]"    : "PIN_L25",
	"GPIO_0[35]"    : "PIN_L19",
	"GPIO_1[0]"     : "PIN_K25",
	"GPIO_1[1]"     : "PIN_K26",
	"GPIO_1[2]"     : "PIN_M22",
	"GPIO_1[3]"     : "PIN_M23",
	"GPIO_1[4]"     : "PIN_M19",
	"GPIO_1[5]"     : "PIN_M20",
	"GPIO_1[6]"     : "PIN_N20",
	"GPIO_1[7]"     : "PIN_M21",
	"GPIO_1[8]"     : "PIN_M24",
	"GPIO_1[9]"     : "PIN_M25",
	"GPIO_1[10]"    : "PIN_N24",
	"GPIO_1[11]"    : "PIN_P24",
	"GPIO_1[12]"    : "PIN_R25",
	"GPIO_1[13]"    : "PIN_R24",
	"GPIO_1[14]"    : "PIN_R20",
	"GPIO_1[15]"    : "PIN_T22",
	"GPIO_1[16]"    : "PIN_T23",
	"GPIO_1[17]"    : "PIN_T24",
	"GPIO_1[18]"    : "PIN_T25",
	"GPIO_1[19]"    : "PIN_T18",
	"GPIO_1[20]"    : "PIN_T21",
	"GPIO_1[21]"    : "PIN_T20",
	"GPIO_1[22]"    : "PIN_U26",
	"GPIO_1[23]"    : "PIN_U25",
	"GPIO_1[24]"    : "PIN_U23",
	"GPIO_1[25]"    : "PIN_U24",
	"GPIO_1[26]"    : "PIN_R19",
	"GPIO_1[27]"    : "PIN_T19",
	"GPIO_1[28]"    : "PIN_U20",
	"GPIO_1[29]"    : "PIN_U21",
	"GPIO_1[30]"    : "PIN_V26",
	"GPIO_1[31]"    : "PIN_V25",
	"GPIO_1[32]"    : "PIN_V24",
	"GPIO_1[33]"    : "PIN_V23",
	"GPIO_1[34]"    : "PIN_W25",
	"GPIO_1[35]"    : "PIN_W2",

	"HEX[0]"  : "PIN_AF10" ,
	"HEX[1]"  : "PIN_AB12" ,
	"HEX[2]"  : "PIN_AC12" ,
	"HEX[3]"  : "PIN_AD11" ,
	"HEX[4]"  : "PIN_AE11" ,
	"HEX[5]"  : "PIN_V14"  ,
	"HEX[6]"  : "PIN_V13"  ,
	"HEX[7]"  : "PIN_V20"  ,
	"HEX[8]"  : "PIN_V21"  ,
	"HEX[9]"  : "PIN_W21"  ,
	"HEX[10]" : "PIN_Y22"  ,
	"HEX[11]" : "PIN_AA24" ,
	"HEX[12]" : "PIN_AA23" ,
	"HEX[13]" : "PIN_AB24" ,
	"HEX[14]" : "PIN_AB23" ,
	"HEX[15]" : "PIN_V22"  ,
	"HEX[16]" : "PIN_AC25" ,
	"HEX[17]" : "PIN_AC26" ,
	"HEX[18]" : "PIN_AB26" ,
	"HEX[19]" : "PIN_AB25" ,
	"HEX[20]" : "PIN_Y24"  ,
	"HEX[21]" : "PIN_Y23"  ,
	"HEX[22]" : "PIN_AA25" ,
	"HEX[23]" : "PIN_AA26" ,
	"HEX[24]" : "PIN_Y26"  ,
	"HEX[25]" : "PIN_Y25"  ,
	"HEX[26]" : "PIN_U22"  ,
	"HEX[27]" : "PIN_W24"  ,
	"HEX[28]" : "PIN_U9"   ,
	"HEX[29]" : "PIN_U1"   ,
	"HEX[30]" : "PIN_U2"   ,
	"HEX[31]" : "PIN_T4"   ,
	"HEX[32]" : "PIN_R7"   ,
	"HEX[33]" : "PIN_R6"   ,
	"HEX[34]" : "PIN_T3"   ,
	"HEX[35]" : "PIN_T2"   ,
	"HEX[36]" : "PIN_P6"   ,
	"HEX[37]" : "PIN_P7"   ,
	"HEX[38]" : "PIN_T9"   ,
	"HEX[39]" : "PIN_R5"   ,
	"HEX[40]" : "PIN_R4"   ,
	"HEX[41]" : "PIN_R3"   ,
	"HEX[42]" : "PIN_R2"   ,
	"HEX[43]" : "PIN_P4"   ,
	"HEX[44]" : "PIN_P3"   ,
	"HEX[45]" : "PIN_M2"   ,
	"HEX[46]" : "PIN_M3"   ,
	"HEX[47]" : "PIN_M5"   ,
	"HEX[48]" : "PIN_M4"   ,
	"HEX[49]" : "PIN_L3"   ,
	"HEX[50]" : "PIN_L2"   ,
	"HEX[51]" : "PIN_L9"   ,
	"HEX[52]" : "PIN_L6"   ,
	"HEX[53]" : "PIN_L7"   ,
	"HEX[54]" : "PIN_P9"   ,
	"HEX[55]" : "PIN_N9"
}

// ****************************************
// PARSER
// ****************************************

function processFile(fileContents){
	var output = {
		contents : ""
	}
	output.write = (chunk) => { output.contents += chunk.trim() + '\n'; };
	// Line number is maintained for use in
	// error reporting.
	var lineNumber = 1;
	// Create an array of lines to parse.
	var lines = fileContents.trim().split('\n');
	// Handling header: If header is present
	// in pinfile, ignore it. Print header
	// to output file.
	if (lines[0].match( validation.header ) )
		lines = lines.slice(1);
	output.write("To, Location\n");

	for (var line of lines){
		try {
			processLine(line, output);
		} catch (e) {
			if (e instanceof SyntaxError) { 
				e.message = "Error at Line Number: " + lineNumber
					+ '\n' + e.message;
				throw e;
			}
		}
		lineNumber++;
	}
	return output.contents.trim();
};

function processLine(line, output){
	// Match line to one of valid line possibilities. So far
	// thes are:
	//	- A line with index specifiers
	//	- A basic line
	//	- A blank line.
	var lineMatch = line.match( validation.lineExpression );
	if (!lineMatch){
		if (line.match( validation.basicLine ) )
			output.write(line + "\n");
		else if (line.match( validation.blankLine ) )
			output.write(line + "\n");
		else
			throw new SyntaxError("Cannot parse line.\n" + line + "\n");
	}
	// Store the names and specifiers that were matched
	// from the line.
	var name0    = lineMatch[1].trim();
	var specStr0 = lineMatch[2].trim();
	var name1    = lineMatch[3].trim();
	var specStr1 = lineMatch[4].trim();
	var spec0;
	var spec1;

	// Try to determine the specifier types.
	// If they don't match anything, then the program
	// exits and reports the specifier string that couldn't
	// be recognized.
	try {
		spec0 = determineSpecifier(specStr0);
	} catch (e) {
		if (e instanceof SyntaxError) {
			e.message += "Culprit: " + specStr0;
		}
		throw e;
	}
	try {
		spec1 = determineSpecifier(specStr1);
	} catch (e) {
		if (e instanceof SyntaxError) {
			e.message += "Culprit:" + specStr1;
		}
		throw e;
	}

	// If both specifiers are explicit, then exit program.
	if (spec0.type === 'i' && spec1.type === 'i'){
		let error = new SyntaxError;
		error.message += "Cannot have two implicit specifiers!\n";
		error.message += "Culprits: '" + spec0 + "' '" + spec1 + "'";
		throw error;
	}
	// If first specifier is implicit, then second is explicit.
	if (spec0.type === 'i')
		resolveImplicitSpecifier(spec0, spec1);
	// If second specifier is implicit, then first is explicit.
	else if ( spec1.type === 'i' )
		resolveImplicitSpecifier(spec1, spec0);

	// Now, both specifiers are necessarily explicit.
	if (spec0.length != spec1.length) {
		let error = new SyntaxError;
		error.message += 
			"Cannot have two specifiers with different index lengths.\n";
		error.message += "Culprits: '" + specStr0 + "', '" + specStr1 + "'";
		throw error;
	}
	printResult(name0,spec0,name1,spec1,output);
}

// arguments are strings that should match one specifier format.
function determineSpecifier(specifierString){
	// Keeps track of if a format has been matched yet.
	var matched = false;
	var specifier = {};

	// Check specifierString agaisnt explicit formats.
	for( let format in explicitSpecifierFormats ){
		var matchResult = specifierString.match(
				explicitSpecifierFormats[format] 
				);
		if (matchResult) {
			matched = true;
			for (var i = 1; i < matchResult.length; i++) {
				matchResult[i] = matchResult[i].trim();
			}
			specifier.text = specifierString;
			specifier.type = 'e';
			specifier.name = format;
			specifier.match = matchResult;
			resolveExplicitSpecifier(specifier);
			specifier.length = specifier.content.length;
			break;
		}
	}

	// If it wasn't explicit, match it against implicit formats.
	// match any explicit formats.
	if (!matched) {
		for ( let format in implicitSpecifierFormats ) {
			var matchResult = specifierString.match(
					implicitSpecifierFormats[format] 
					);
			//console.log(format); //DEBUG
			//console.log( implicitSpecifierFormats[format].source ); //DEBUG
			if (matchResult) {
				matched = true;
				for (var i = 1; i < matchResult.length; i++) {
					matchResult[i] = matchResult[i].trim();
				}
				specifier.text = specifierString;
				specifier.type = 'i';
				specifier.name = format;
				specifier.match = matchResult;
				break;
			}
		}
	}

	// If didn't match any formats, throw an error.
	if (!matched){
		throw new SyntaxError("Specifier matched no known formats.\n");
	}
	return specifier;
}

// specifier is a specifier object.
function resolveExplicitSpecifier(specifier){
	return explicitResolutionTable[specifier.name](specifier);
}

// specifiers are specifier objects.
function resolveImplicitSpecifier(implicitSpec, explicitSpec){
	return implicitResolutionTable[implicitSpec.name](implicitSpec, explicitSpec);
}

function printResult(name0, spec0, name1, spec1, output){
	for ( var i = 0; i < spec0.content.length; i++) {
		var outputStr = name0 + '[' + spec0.content[i] + '], '
			+ name1 + '[' + spec1.content[i] + ']\n' ;
		output.write(outputStr);
	}
}

// ****************************************
// REPLACER
// ****************************************

function replace(fileContent) {
	var output = {
		contents : ""
	}
	output.write = (chunk) => { output.contents += chunk.trim() + '\n'; };

	var lines = fileContent.trim().split('\n');
	var lineNumber = 1;
	for (var line of lines) {
		if (line.match(validation.blankLine)) {
			output.write(line);
			lineNumber++;
			continue;
		}
		var match = line.match( validation.afterParseLine);
		var pinName;
		if (match) {
			var pinName = match[2].trim().toUpperCase();
			if (pinName === "LOCATION") {
				output.write(line);
				lineNumber++;
				continue;
			}
			if (!pinTable[pinName]) {
				throw new SyntaxError("Error(" + lineNumber 
						+ "). No pin associated with name '" + pinName + "'.");
			}
			output.write(line.replace(match[2], pinTable[pinName]) + '\n');
		}
		lineNumber++;
	}
	return output.contents;
}
