"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode6 = __toESM(require("vscode"));

// src/completionProvider.ts
var vscode = __toESM(require("vscode"));

// src/sclData.ts
var BLOCK_KEYWORDS = [
  { label: "FUNCTION_BLOCK", detail: "Block declaration", documentation: "Declares a Function Block (FB) - a stateful block with instance data." },
  { label: "END_FUNCTION_BLOCK", detail: "Block end", documentation: "Ends a Function Block declaration." },
  { label: "FUNCTION", detail: "Block declaration", documentation: "Declares a Function (FC) - a stateless block with a return value." },
  { label: "END_FUNCTION", detail: "Block end", documentation: "Ends a Function declaration." },
  { label: "ORGANIZATION_BLOCK", detail: "Block declaration", documentation: "Declares an Organization Block (OB) - triggered by system events." },
  { label: "END_ORGANIZATION_BLOCK", detail: "Block end", documentation: "Ends an Organization Block declaration." },
  { label: "DATA_BLOCK", detail: "Block declaration", documentation: "Declares a Data Block (DB) - global data storage." },
  { label: "END_DATA_BLOCK", detail: "Block end", documentation: "Ends a Data Block declaration." },
  { label: "TYPE", detail: "Type declaration", documentation: "Declares a User Defined Type (UDT)." },
  { label: "END_TYPE", detail: "Type end", documentation: "Ends a User Defined Type declaration." },
  { label: "INTERFACE", detail: "Interface declaration", documentation: "Declares an interface (OOP)." },
  { label: "END_INTERFACE", detail: "Interface end", documentation: "Ends an interface declaration." }
];
var VAR_KEYWORDS = [
  { label: "VAR_INPUT", detail: "Input parameters", documentation: "Declares input parameters that are passed to the block when called." },
  { label: "VAR_OUTPUT", detail: "Output parameters", documentation: "Declares output parameters returned from the block." },
  { label: "VAR_IN_OUT", detail: "In/Out parameters", documentation: "Declares parameters that are both read and written (pass by reference)." },
  { label: "VAR_TEMP", detail: "Temporary variables", documentation: "Declares temporary variables that exist only during block execution." },
  { label: "VAR", detail: "Static variables", documentation: "Declares static variables (FB: retained across calls, DB: global data)." },
  { label: "VAR CONSTANT", detail: "Constants", documentation: "Declares constant values that cannot be modified at runtime." },
  { label: "END_VAR", detail: "End variable section", documentation: "Ends a variable declaration section." },
  { label: "STRUCT", detail: "Structure", documentation: "Declares an inline structure type." },
  { label: "END_STRUCT", detail: "End structure", documentation: "Ends a structure declaration." }
];
var CONTROL_KEYWORDS = [
  { label: "IF", detail: "Conditional", documentation: "Conditional execution. Syntax: IF condition THEN ... END_IF;", insertText: "IF ${1:condition} THEN\n    $0\nEND_IF;" },
  { label: "THEN", detail: "IF/ELSIF clause", documentation: "Begins the executable block after IF or ELSIF." },
  { label: "ELSIF", detail: "Else if", documentation: "Additional condition in an IF block.", insertText: "ELSIF ${1:condition} THEN\n    $0" },
  { label: "ELSE", detail: "Else clause", documentation: "Default branch when no IF/ELSIF conditions are met." },
  { label: "END_IF", detail: "End IF", documentation: "Ends an IF block." },
  { label: "FOR", detail: "For loop", documentation: "Counter-based loop. Syntax: FOR i := 0 TO 10 BY 1 DO ... END_FOR;", insertText: "FOR #${1:i} := ${2:0} TO ${3:10} BY ${4:1} DO\n    $0\nEND_FOR;" },
  { label: "TO", detail: "FOR range", documentation: "Specifies the upper limit in a FOR loop." },
  { label: "BY", detail: "FOR step", documentation: "Specifies the step increment in a FOR loop." },
  { label: "DO", detail: "Loop body", documentation: "Begins the loop body (FOR/WHILE)." },
  { label: "END_FOR", detail: "End FOR", documentation: "Ends a FOR loop." },
  { label: "WHILE", detail: "While loop", documentation: "Condition-based loop. Syntax: WHILE condition DO ... END_WHILE;", insertText: "WHILE ${1:condition} DO\n    $0\nEND_WHILE;" },
  { label: "END_WHILE", detail: "End WHILE", documentation: "Ends a WHILE loop." },
  { label: "REPEAT", detail: "Repeat loop", documentation: "Loop that executes at least once. Syntax: REPEAT ... UNTIL condition END_REPEAT;", insertText: "REPEAT\n    $0\nUNTIL ${1:condition}\nEND_REPEAT;" },
  { label: "UNTIL", detail: "REPEAT condition", documentation: "Exit condition for REPEAT loop (exits when TRUE)." },
  { label: "END_REPEAT", detail: "End REPEAT", documentation: "Ends a REPEAT loop." },
  { label: "CASE", detail: "Case statement", documentation: "Multi-way branch. Syntax: CASE variable OF ... END_CASE;", insertText: "CASE #${1:variable} OF\n    ${2:0}:\n        $0\n    ELSE\n        ;\nEND_CASE;" },
  { label: "OF", detail: "CASE clause", documentation: "Begins the case branches." },
  { label: "END_CASE", detail: "End CASE", documentation: "Ends a CASE statement." },
  { label: "RETURN", detail: "Return", documentation: "Exits the current block immediately." },
  { label: "EXIT", detail: "Exit loop", documentation: "Exits the innermost FOR, WHILE, or REPEAT loop." },
  { label: "CONTINUE", detail: "Continue loop", documentation: "Skips to the next iteration of the innermost loop." },
  { label: "BEGIN", detail: "Code section", documentation: "Begins the executable code section of a block." },
  { label: "REGION", detail: "Code region", documentation: "Defines a collapsible code region.", insertText: "REGION ${1:Name}\n    $0\nEND_REGION" },
  { label: "END_REGION", detail: "End region", documentation: "Ends a code region." }
];
var OTHER_KEYWORDS = [
  { label: "TRUE", detail: "Boolean true", documentation: "Boolean literal value TRUE." },
  { label: "FALSE", detail: "Boolean false", documentation: "Boolean literal value FALSE." },
  { label: "NULL", detail: "Null reference", documentation: "Null pointer/reference value." },
  { label: "AND", detail: "Logical AND", documentation: "Logical AND operator." },
  { label: "OR", detail: "Logical OR", documentation: "Logical OR operator." },
  { label: "XOR", detail: "Logical XOR", documentation: "Logical exclusive OR operator." },
  { label: "NOT", detail: "Logical NOT", documentation: "Logical negation operator." },
  { label: "MOD", detail: "Modulo", documentation: "Modulo (remainder) operator." },
  { label: "VERSION", detail: "Block version", documentation: "Block version declaration. Example: VERSION : 0.1" },
  { label: "RETAIN", detail: "Retentive", documentation: "Marks variables as retentive (preserved during power cycle)." },
  { label: "NON_RETAIN", detail: "Non-retentive", documentation: "Marks variables as non-retentive." },
  { label: "CONSTANT", detail: "Constant modifier", documentation: "Declares a constant value." },
  { label: "ARRAY", detail: "Array type", documentation: "Array declaration. Syntax: Array[0..9] of Int", insertText: "Array[${1:0}..${2:9}] of ${3:Int}" },
  { label: "REF_TO", detail: "Reference", documentation: "Reference type (pointer). Syntax: REF_TO DataType" },
  { label: "INSTANCE_DB OF", detail: "Instance association", documentation: "Associates a Data Block with a Function Block." }
];
var DATA_TYPES = [
  // Elementary
  { label: "Bool", detail: "1 bit", documentation: "Boolean: TRUE or FALSE" },
  { label: "Byte", detail: "8 bit unsigned", documentation: "Unsigned 8-bit integer (0..255)" },
  { label: "Char", detail: "8 bit character", documentation: "Single ASCII character" },
  { label: "WChar", detail: "16 bit character", documentation: "Single Unicode character" },
  { label: "SInt", detail: "8 bit signed", documentation: "Signed 8-bit integer (-128..127)" },
  { label: "USInt", detail: "8 bit unsigned", documentation: "Unsigned 8-bit integer (0..255)" },
  { label: "Int", detail: "16 bit signed", documentation: "Signed 16-bit integer (-32768..32767)" },
  { label: "UInt", detail: "16 bit unsigned", documentation: "Unsigned 16-bit integer (0..65535)" },
  { label: "DInt", detail: "32 bit signed", documentation: "Signed 32-bit integer (-2147483648..2147483647)" },
  { label: "UDInt", detail: "32 bit unsigned", documentation: "Unsigned 32-bit integer (0..4294967295)" },
  { label: "LInt", detail: "64 bit signed", documentation: "Signed 64-bit integer" },
  { label: "ULInt", detail: "64 bit unsigned", documentation: "Unsigned 64-bit integer" },
  { label: "Word", detail: "16 bit", documentation: "16-bit bit string (for bit operations)" },
  { label: "DWord", detail: "32 bit", documentation: "32-bit bit string (for bit operations)" },
  { label: "LWord", detail: "64 bit", documentation: "64-bit bit string" },
  { label: "Real", detail: "32 bit float", documentation: "32-bit IEEE 754 floating point" },
  { label: "LReal", detail: "64 bit float", documentation: "64-bit IEEE 754 floating point (double precision)" },
  { label: "String", detail: "Character string", documentation: "Variable-length ASCII string (max 254 chars). Syntax: String[maxLen]" },
  { label: "WString", detail: "Unicode string", documentation: "Variable-length Unicode string" },
  { label: "Time", detail: "Time duration", documentation: "Time duration in ms. Literal: T#1h30m, T#5s, T#100ms" },
  { label: "LTime", detail: "Time duration (ns)", documentation: "Time duration in nanoseconds" },
  { label: "Date", detail: "Date", documentation: "Date value. Literal: D#2024-01-15" },
  { label: "Date_And_Time", detail: "Date+Time (DT)", documentation: "Combined date and time (legacy S7-300/400)" },
  { label: "DTL", detail: "Date+Time long", documentation: "Date and time (S7-1200/1500). 12 bytes." },
  { label: "Time_Of_Day", detail: "Time of day", documentation: "Time of day. Literal: TOD#12:30:00" },
  { label: "S5Time", detail: "S5 time (legacy)", documentation: "S5 time format (legacy, S7-300/400 compatible)" },
  { label: "Void", detail: "No return", documentation: "No return value (for functions)" },
  // Complex
  { label: "Any", detail: "Any type", documentation: "Generic pointer type (80 bit, S7-300/400)" },
  { label: "Pointer", detail: "Pointer", documentation: "48-bit area pointer (S7-300/400)" },
  { label: "Variant", detail: "Variant", documentation: "S7-1500 universal reference to any data type" },
  { label: "DB_ANY", detail: "DB reference", documentation: "Reference to any Data Block" },
  // Hardware
  { label: "HW_ANY", detail: "Hardware ID", documentation: "Hardware identifier (any)" },
  { label: "HW_IO", detail: "I/O module ID", documentation: "Hardware identifier for I/O module" },
  { label: "HW_DEVICE", detail: "Device ID", documentation: "Hardware identifier for a device" },
  { label: "HW_SUBMODULE", detail: "Submodule ID", documentation: "Hardware identifier for a submodule" },
  // Timer/Counter types
  { label: "TON", detail: "On-delay timer", documentation: "IEC on-delay timer. Inputs: IN (Bool), PT (Time). Outputs: Q (Bool), ET (Time)." },
  { label: "TOF", detail: "Off-delay timer", documentation: "IEC off-delay timer. Inputs: IN (Bool), PT (Time). Outputs: Q (Bool), ET (Time)." },
  { label: "TP", detail: "Pulse timer", documentation: "IEC pulse timer. Inputs: IN (Bool), PT (Time). Outputs: Q (Bool), ET (Time)." },
  { label: "TONR", detail: "Retentive on-delay", documentation: "Retentive on-delay timer. Accumulated time is preserved." },
  { label: "CTU", detail: "Count up", documentation: "IEC counter up. Inputs: CU (Bool), R (Bool), PV (Int). Outputs: Q (Bool), CV (Int)." },
  { label: "CTD", detail: "Count down", documentation: "IEC counter down. Inputs: CD (Bool), LD (Bool), PV (Int). Outputs: Q (Bool), CV (Int)." },
  { label: "CTUD", detail: "Count up/down", documentation: "IEC counter up/down." },
  { label: "R_TRIG", detail: "Rising edge", documentation: "Rising edge detection. Input: CLK (Bool). Output: Q (Bool)." },
  { label: "F_TRIG", detail: "Falling edge", documentation: "Falling edge detection. Input: CLK (Bool). Output: Q (Bool)." },
  { label: "IEC_TIMER", detail: "IEC Timer base", documentation: "Base type for IEC timers." },
  { label: "IEC_COUNTER", detail: "IEC Counter base", documentation: "Base type for IEC counters." }
];
var SYSTEM_FUNCTIONS = [
  // Type conversions
  { label: "INT_TO_REAL", detail: "Convert Int to Real", documentation: "Converts an Int value to a Real (floating point) value.", parameters: [{ label: "value: Int", documentation: "Integer value to convert" }], returnType: "Real" },
  { label: "REAL_TO_INT", detail: "Convert Real to Int", documentation: "Converts a Real value to Int (rounds to nearest).", parameters: [{ label: "value: Real", documentation: "Real value to convert" }], returnType: "Int" },
  { label: "REAL_TO_DINT", detail: "Convert Real to DInt", documentation: "Converts a Real value to DInt.", parameters: [{ label: "value: Real", documentation: "Real value to convert" }], returnType: "DInt" },
  { label: "DINT_TO_REAL", detail: "Convert DInt to Real", documentation: "Converts a DInt value to Real.", parameters: [{ label: "value: DInt", documentation: "DInt value to convert" }], returnType: "Real" },
  { label: "INT_TO_DINT", detail: "Convert Int to DInt", documentation: "Converts an Int value to DInt.", parameters: [{ label: "value: Int", documentation: "Int value to convert" }], returnType: "DInt" },
  { label: "DINT_TO_INT", detail: "Convert DInt to Int", documentation: "Converts a DInt value to Int (may truncate).", parameters: [{ label: "value: DInt", documentation: "DInt value to convert" }], returnType: "Int" },
  { label: "BOOL_TO_INT", detail: "Convert Bool to Int", documentation: "Converts Bool to Int (FALSE=0, TRUE=1).", parameters: [{ label: "value: Bool", documentation: "Bool value" }], returnType: "Int" },
  { label: "WORD_TO_INT", detail: "Convert Word to Int", documentation: "Reinterprets a Word as Int.", parameters: [{ label: "value: Word", documentation: "Word value" }], returnType: "Int" },
  { label: "INT_TO_WORD", detail: "Convert Int to Word", documentation: "Reinterprets an Int as Word.", parameters: [{ label: "value: Int", documentation: "Int value" }], returnType: "Word" },
  { label: "DWORD_TO_REAL", detail: "Convert DWord to Real", documentation: "Reinterprets a DWord as Real (IEEE 754).", parameters: [{ label: "value: DWord", documentation: "DWord value" }], returnType: "Real" },
  { label: "REAL_TO_DWORD", detail: "Convert Real to DWord", documentation: "Reinterprets a Real as DWord.", parameters: [{ label: "value: Real", documentation: "Real value" }], returnType: "DWord" },
  { label: "REAL_TO_LREAL", detail: "Convert Real to LReal", documentation: "Promotes Real to LReal (double precision).", parameters: [{ label: "value: Real", documentation: "Real value" }], returnType: "LReal" },
  { label: "LREAL_TO_REAL", detail: "Convert LReal to Real", documentation: "Demotes LReal to Real (may lose precision).", parameters: [{ label: "value: LReal", documentation: "LReal value" }], returnType: "Real" },
  { label: "REAL_TO_STRING", detail: "Convert Real to String", documentation: "Converts a Real value to its string representation.", parameters: [{ label: "value: Real", documentation: "Real value" }], returnType: "String" },
  { label: "STRING_TO_INT", detail: "Convert String to Int", documentation: "Parses a string as an integer.", parameters: [{ label: "value: String", documentation: "String value" }], returnType: "Int" },
  { label: "STRING_TO_REAL", detail: "Convert String to Real", documentation: "Parses a string as a floating point number.", parameters: [{ label: "value: String", documentation: "String value" }], returnType: "Real" },
  // Math
  { label: "ABS", detail: "Absolute value", documentation: "Returns the absolute value of a number.", parameters: [{ label: "value: Numeric", documentation: "Input value" }], returnType: "Numeric" },
  { label: "SQR", detail: "Square", documentation: "Returns the square (x*x) of a number.", parameters: [{ label: "value: Real", documentation: "Input value" }], returnType: "Real" },
  { label: "SQRT", detail: "Square root", documentation: "Returns the square root of a number.", parameters: [{ label: "value: Real", documentation: "Input value (must be >= 0)" }], returnType: "Real" },
  { label: "EXP", detail: "Exponential (e^x)", documentation: "Returns e raised to the power of x.", parameters: [{ label: "value: Real", documentation: "Exponent" }], returnType: "Real" },
  { label: "LN", detail: "Natural log", documentation: "Returns the natural logarithm (base e).", parameters: [{ label: "value: Real", documentation: "Input value (must be > 0)" }], returnType: "Real" },
  { label: "LOG", detail: "Log base 10", documentation: "Returns the base-10 logarithm.", parameters: [{ label: "value: Real", documentation: "Input value (must be > 0)" }], returnType: "Real" },
  { label: "SIN", detail: "Sine", documentation: "Returns the sine (input in radians).", parameters: [{ label: "angle: Real", documentation: "Angle in radians" }], returnType: "Real" },
  { label: "COS", detail: "Cosine", documentation: "Returns the cosine (input in radians).", parameters: [{ label: "angle: Real", documentation: "Angle in radians" }], returnType: "Real" },
  { label: "TAN", detail: "Tangent", documentation: "Returns the tangent (input in radians).", parameters: [{ label: "angle: Real", documentation: "Angle in radians" }], returnType: "Real" },
  { label: "ASIN", detail: "Arc sine", documentation: "Returns the arc sine in radians.", parameters: [{ label: "value: Real", documentation: "Value (-1.0 .. 1.0)" }], returnType: "Real" },
  { label: "ACOS", detail: "Arc cosine", documentation: "Returns the arc cosine in radians.", parameters: [{ label: "value: Real", documentation: "Value (-1.0 .. 1.0)" }], returnType: "Real" },
  { label: "ATAN", detail: "Arc tangent", documentation: "Returns the arc tangent in radians.", parameters: [{ label: "value: Real", documentation: "Input value" }], returnType: "Real" },
  { label: "MAX", detail: "Maximum", documentation: "Returns the larger of two values.", parameters: [{ label: "IN1: Numeric", documentation: "First value" }, { label: "IN2: Numeric", documentation: "Second value" }], returnType: "Numeric" },
  { label: "MIN", detail: "Minimum", documentation: "Returns the smaller of two values.", parameters: [{ label: "IN1: Numeric", documentation: "First value" }, { label: "IN2: Numeric", documentation: "Second value" }], returnType: "Numeric" },
  { label: "LIMIT", detail: "Clamp value", documentation: "Clamps a value to a min/max range.", parameters: [{ label: "MN: Numeric", documentation: "Minimum" }, { label: "IN: Numeric", documentation: "Input value" }, { label: "MX: Numeric", documentation: "Maximum" }], returnType: "Numeric" },
  { label: "SEL", detail: "Binary select", documentation: "Selects one of two values based on a boolean.", parameters: [{ label: "G: Bool", documentation: "Selector (FALSE=IN0, TRUE=IN1)" }, { label: "IN0: Any", documentation: "Value when FALSE" }, { label: "IN1: Any", documentation: "Value when TRUE" }], returnType: "Any" },
  { label: "MUX", detail: "Multiplexer", documentation: "Selects one of N values based on an index.", parameters: [{ label: "K: Int", documentation: "Selector index" }, { label: "IN0..INn: Any", documentation: "Input values" }], returnType: "Any" },
  { label: "ROUND", detail: "Round", documentation: "Rounds a Real to the nearest integer.", parameters: [{ label: "value: Real", documentation: "Input value" }], returnType: "DInt" },
  { label: "TRUNC", detail: "Truncate", documentation: "Truncates a Real towards zero.", parameters: [{ label: "value: Real", documentation: "Input value" }], returnType: "DInt" },
  { label: "CEIL", detail: "Ceiling", documentation: "Rounds up to the next integer.", parameters: [{ label: "value: Real", documentation: "Input value" }], returnType: "DInt" },
  { label: "FLOOR", detail: "Floor", documentation: "Rounds down to the next integer.", parameters: [{ label: "value: Real", documentation: "Input value" }], returnType: "DInt" },
  // Scaling
  { label: "NORM_X", detail: "Normalize", documentation: "Normalizes a value from a range to 0.0..1.0.", parameters: [{ label: "MIN: Numeric", documentation: "Range minimum" }, { label: "VALUE: Numeric", documentation: "Input value" }, { label: "MAX: Numeric", documentation: "Range maximum" }], returnType: "Real", insertText: "NORM_X(MIN := ${1:0}, VALUE := ${2:#Value}, MAX := ${3:27648})" },
  { label: "SCALE_X", detail: "Scale", documentation: "Scales a value from 0.0..1.0 to a target range.", parameters: [{ label: "MIN: Numeric", documentation: "Target minimum" }, { label: "VALUE: Real", documentation: "Normalized input (0.0..1.0)" }, { label: "MAX: Numeric", documentation: "Target maximum" }], returnType: "Numeric", insertText: "SCALE_X(MIN := ${1:0.0}, VALUE := ${2:#NormValue}, MAX := ${3:100.0})" },
  // String
  { label: "LEN", detail: "String length", documentation: "Returns the current length of a string.", parameters: [{ label: "s: String", documentation: "Input string" }], returnType: "Int" },
  { label: "LEFT", detail: "Left substring", documentation: "Returns the leftmost N characters.", parameters: [{ label: "IN: String", documentation: "Input string" }, { label: "L: Int", documentation: "Number of characters" }], returnType: "String" },
  { label: "RIGHT", detail: "Right substring", documentation: "Returns the rightmost N characters.", parameters: [{ label: "IN: String", documentation: "Input string" }, { label: "L: Int", documentation: "Number of characters" }], returnType: "String" },
  { label: "MID", detail: "Mid substring", documentation: "Returns a substring from position P with length L.", parameters: [{ label: "IN: String", documentation: "Input string" }, { label: "L: Int", documentation: "Length" }, { label: "P: Int", documentation: "Start position (1-based)" }], returnType: "String" },
  { label: "CONCAT", detail: "Concatenate", documentation: "Concatenates two strings.", parameters: [{ label: "IN1: String", documentation: "First string" }, { label: "IN2: String", documentation: "Second string" }], returnType: "String" },
  { label: "FIND", detail: "Find substring", documentation: "Finds the position of a substring (0 if not found).", parameters: [{ label: "IN1: String", documentation: "String to search in" }, { label: "IN2: String", documentation: "String to find" }], returnType: "Int" },
  { label: "DELETE", detail: "Delete from string", documentation: "Deletes L characters from position P.", parameters: [{ label: "IN: String", documentation: "Input string" }, { label: "L: Int", documentation: "Number of characters to delete" }, { label: "P: Int", documentation: "Start position" }], returnType: "String" },
  { label: "INSERT", detail: "Insert into string", documentation: "Inserts a string at position P.", parameters: [{ label: "IN1: String", documentation: "Original string" }, { label: "IN2: String", documentation: "String to insert" }, { label: "P: Int", documentation: "Insert position" }], returnType: "String" },
  { label: "REPLACE", detail: "Replace in string", documentation: "Replaces L characters at position P.", parameters: [{ label: "IN1: String", documentation: "Original string" }, { label: "IN2: String", documentation: "Replacement string" }, { label: "L: Int", documentation: "Number of characters to replace" }, { label: "P: Int", documentation: "Start position" }], returnType: "String" },
  // System
  { label: "MOVE", detail: "Move/copy value", documentation: "Copies a value. Syntax: MOVE(IN := source, OUT => target)", parameters: [{ label: "IN: Any", documentation: "Source value" }], returnType: "Any" },
  { label: "FILL_BLK", detail: "Fill block", documentation: "Fills a destination area with a value.", parameters: [{ label: "IN: Any", documentation: "Fill value" }, { label: "COUNT: UDInt", documentation: "Number of elements" }, { label: "OUT: Any", documentation: "Destination" }], returnType: "Void" },
  { label: "UMOVE_BLK", detail: "Uninterruptible move", documentation: "Copies a block of data (uninterruptible).", parameters: [{ label: "IN: Any", documentation: "Source" }, { label: "COUNT: UDInt", documentation: "Number of elements" }, { label: "OUT: Any", documentation: "Destination" }], returnType: "Void" },
  { label: "Serialize", detail: "Serialize data", documentation: "Serializes structured data to a byte array.", parameters: [{ label: "SRC_VARIABLE: Variant", documentation: "Source variable" }, { label: "DEST_ARRAY: Array of Byte", documentation: "Destination byte array" }, { label: "POS: DInt", documentation: "Position in destination" }], returnType: "Int" },
  { label: "Deserialize", detail: "Deserialize data", documentation: "Deserializes a byte array to structured data.", parameters: [{ label: "SRC_ARRAY: Array of Byte", documentation: "Source byte array" }, { label: "DEST_VARIABLE: Variant", documentation: "Destination variable" }, { label: "POS: DInt", documentation: "Position in source" }], returnType: "Int" },
  { label: "RD_SYS_T", detail: "Read system time", documentation: "Reads the current system time.", parameters: [{ label: "OUT: DTL", documentation: "Current date and time" }], returnType: "Int" },
  { label: "RUNTIME", detail: "Measure runtime", documentation: "Measures the runtime of a code section in seconds.", parameters: [{ label: "MEM: LReal", documentation: "Memory variable for measurement" }], returnType: "LReal" },
  { label: "RE_TRIGR", detail: "Retrigger watchdog", documentation: "Retriggers the cycle monitoring watchdog.", parameters: [], returnType: "Void" },
  { label: "STP", detail: "Stop CPU", documentation: "Stops the CPU (transitions to STOP mode).", parameters: [], returnType: "Void" }
];

// src/completionProvider.ts
var SclCompletionProvider = class {
  provideCompletionItems(document, position, _token, context) {
    const line = document.lineAt(position).text;
    const prefix = line.substring(0, position.character);
    const items = [];
    if (context.triggerCharacter === "#" || prefix.endsWith("#")) {
      items.push(...this.getLocalVariables(document, position));
      return items;
    }
    if (context.triggerCharacter === "%" || prefix.endsWith("%")) {
      items.push(...this.getAddressCompletions());
      return items;
    }
    if (context.triggerCharacter === '"') {
      items.push(...this.getBlockReferences(document));
      return items;
    }
    if (context.triggerCharacter === ".") {
      items.push(...this.getDotCompletions(prefix));
      return items;
    }
    if (prefix.match(/:\s*\w*$/)) {
      items.push(...this.makeItems(DATA_TYPES, vscode.CompletionItemKind.TypeParameter));
      return items;
    }
    items.push(...this.makeItems(BLOCK_KEYWORDS, vscode.CompletionItemKind.Keyword));
    items.push(...this.makeItems(VAR_KEYWORDS, vscode.CompletionItemKind.Keyword));
    items.push(...this.makeItems(CONTROL_KEYWORDS, vscode.CompletionItemKind.Keyword));
    items.push(...this.makeItems(OTHER_KEYWORDS, vscode.CompletionItemKind.Keyword));
    items.push(...this.makeItems(DATA_TYPES, vscode.CompletionItemKind.TypeParameter));
    items.push(...this.makeFunctionItems(SYSTEM_FUNCTIONS));
    return items;
  }
  makeItems(data, kind) {
    return data.map((item) => {
      const ci = new vscode.CompletionItem(item.label, kind);
      ci.detail = item.detail;
      ci.documentation = new vscode.MarkdownString(item.documentation);
      if (item.insertText) {
        ci.insertText = new vscode.SnippetString(item.insertText);
      }
      return ci;
    });
  }
  makeFunctionItems(data) {
    return data.map((fn) => {
      const ci = new vscode.CompletionItem(fn.label, vscode.CompletionItemKind.Function);
      ci.detail = `${fn.detail} \u2192 ${fn.returnType}`;
      const params = fn.parameters.map((p) => p.label).join(", ");
      ci.documentation = new vscode.MarkdownString(
        `${fn.documentation}

**Syntax:** \`${fn.label}(${params})\` \u2192 \`${fn.returnType}\``
      );
      if (fn.insertText) {
        ci.insertText = new vscode.SnippetString(fn.insertText);
      } else if (fn.parameters.length > 0) {
        const paramSnippets = fn.parameters.map((p, i) => `\${${i + 1}:${p.label.split(":")[0].trim()}}`);
        ci.insertText = new vscode.SnippetString(`${fn.label}(${paramSnippets.join(", ")})`);
      }
      return ci;
    });
  }
  getLocalVariables(document, position) {
    const items = [];
    const seen = /* @__PURE__ */ new Set();
    const text = document.getText();
    const varRegex = /^\s+(\w+)\s*:\s*([\w"\[\].]+)/gm;
    let match;
    while ((match = varRegex.exec(text)) !== null) {
      const name = match[1];
      const type = match[2];
      if (!seen.has(name) && !["END_VAR", "END_STRUCT", "STRUCT"].includes(name)) {
        seen.add(name);
        const ci = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
        ci.detail = type;
        ci.documentation = `Local variable: ${name} : ${type}`;
        items.push(ci);
      }
    }
    return items;
  }
  getAddressCompletions() {
    const addresses = [
      { label: "I", detail: "Input bit", documentation: "Digital input. Example: %I0.0", insertText: "I${1:0}.${2:0}" },
      { label: "IB", detail: "Input byte", documentation: "Input byte. Example: %IB0", insertText: "IB${1:0}" },
      { label: "IW", detail: "Input word", documentation: "Input word (16 bit). Example: %IW64", insertText: "IW${1:64}" },
      { label: "ID", detail: "Input double word", documentation: "Input double word (32 bit). Example: %ID68", insertText: "ID${1:68}" },
      { label: "Q", detail: "Output bit", documentation: "Digital output. Example: %Q0.0", insertText: "Q${1:0}.${2:0}" },
      { label: "QB", detail: "Output byte", documentation: "Output byte. Example: %QB0", insertText: "QB${1:0}" },
      { label: "QW", detail: "Output word", documentation: "Output word. Example: %QW80", insertText: "QW${1:80}" },
      { label: "QD", detail: "Output double word", documentation: "Output double word. Example: %QD84", insertText: "QD${1:84}" },
      { label: "M", detail: "Memory bit", documentation: "Memory bit (Merker). Example: %M0.0", insertText: "M${1:0}.${2:0}" },
      { label: "MB", detail: "Memory byte", documentation: "Memory byte. Example: %MB100", insertText: "MB${1:100}" },
      { label: "MW", detail: "Memory word", documentation: "Memory word. Example: %MW100", insertText: "MW${1:100}" },
      { label: "MD", detail: "Memory double word", documentation: "Memory double word. Example: %MD200", insertText: "MD${1:200}" }
    ];
    return addresses.map((a) => {
      const ci = new vscode.CompletionItem(a.label, vscode.CompletionItemKind.Reference);
      ci.detail = a.detail;
      ci.documentation = new vscode.MarkdownString(a.documentation);
      ci.insertText = new vscode.SnippetString(a.insertText);
      return ci;
    });
  }
  getBlockReferences(document) {
    const items = [];
    const seen = /* @__PURE__ */ new Set();
    const text = document.getText();
    const blockRegex = /(?:FUNCTION_BLOCK|FUNCTION|DATA_BLOCK|ORGANIZATION_BLOCK|TYPE)\s+"([^"]+)"/g;
    let match;
    while ((match = blockRegex.exec(text)) !== null) {
      const name = match[1];
      if (!seen.has(name)) {
        seen.add(name);
        const ci = new vscode.CompletionItem(name, vscode.CompletionItemKind.Module);
        ci.detail = "Block reference";
        items.push(ci);
      }
    }
    const udtRegex = /"([^"]+)"/g;
    while ((match = udtRegex.exec(text)) !== null) {
      const name = match[1];
      if (!seen.has(name)) {
        seen.add(name);
        const ci = new vscode.CompletionItem(name, vscode.CompletionItemKind.Module);
        ci.detail = "Reference";
        items.push(ci);
      }
    }
    return items;
  }
  getDotCompletions(prefix) {
    const items = [];
    const timerOutputs = [
      { label: "Q", detail: "Bool", documentation: "Timer/Counter output (done/reached)" },
      { label: "ET", detail: "Time", documentation: "Elapsed time" },
      { label: "CV", detail: "Int", documentation: "Counter current value" },
      { label: "IN", detail: "Bool", documentation: "Timer/Counter input" },
      { label: "PT", detail: "Time", documentation: "Preset time" },
      { label: "PV", detail: "Int", documentation: "Preset value (counter)" }
    ];
    for (const out of timerOutputs) {
      const ci = new vscode.CompletionItem(out.label, vscode.CompletionItemKind.Property);
      ci.detail = out.detail;
      ci.documentation = out.documentation;
      items.push(ci);
    }
    return items;
  }
};

// src/hoverProvider.ts
var vscode2 = __toESM(require("vscode"));
var SclHoverProvider = class {
  constructor() {
    this.lookup = /* @__PURE__ */ new Map();
    const allItems = [
      ...BLOCK_KEYWORDS,
      ...VAR_KEYWORDS,
      ...CONTROL_KEYWORDS,
      ...OTHER_KEYWORDS,
      ...DATA_TYPES
    ];
    for (const item of allItems) {
      this.lookup.set(item.label.toUpperCase(), item);
    }
    for (const fn of SYSTEM_FUNCTIONS) {
      this.lookup.set(fn.label.toUpperCase(), fn);
    }
  }
  provideHover(document, position) {
    const range = document.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
    if (!range) return void 0;
    const word = document.getText(range).toUpperCase();
    const item = this.lookup.get(word);
    if (!item) return void 0;
    const md = new vscode2.MarkdownString();
    md.isTrusted = true;
    if ("parameters" in item) {
      const fn = item;
      const params = fn.parameters.map((p) => p.label).join(", ");
      md.appendCodeblock(`${fn.label}(${params}) : ${fn.returnType}`, "scl");
      md.appendMarkdown(`

${fn.documentation}`);
      if (fn.parameters.length > 0) {
        md.appendMarkdown("\n\n**Parameters:**\n");
        for (const p of fn.parameters) {
          md.appendMarkdown(`- \`${p.label}\` - ${p.documentation}
`);
        }
      }
    } else {
      md.appendCodeblock(item.label, "scl");
      md.appendMarkdown(`

*${item.detail}*

${item.documentation}`);
    }
    return new vscode2.Hover(md, range);
  }
};

// src/signatureProvider.ts
var vscode3 = __toESM(require("vscode"));
var SclSignatureHelpProvider = class {
  constructor() {
    this.fnLookup = /* @__PURE__ */ new Map();
    for (const fn of SYSTEM_FUNCTIONS) {
      this.fnLookup.set(fn.label.toUpperCase(), fn);
    }
  }
  provideSignatureHelp(document, position) {
    const line = document.lineAt(position).text;
    const textBefore = line.substring(0, position.character);
    let depth = 0;
    let parenPos = -1;
    let commaCount = 0;
    for (let i = textBefore.length - 1; i >= 0; i--) {
      const ch = textBefore[i];
      if (ch === ")") depth++;
      else if (ch === "(") {
        if (depth === 0) {
          parenPos = i;
          break;
        }
        depth--;
      } else if (ch === "," && depth === 0) {
        commaCount++;
      }
    }
    if (parenPos < 0) return void 0;
    const beforeParen = textBefore.substring(0, parenPos).trimEnd();
    const fnMatch = beforeParen.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
    if (!fnMatch) return void 0;
    const fnName = fnMatch[1].toUpperCase();
    const fn = this.fnLookup.get(fnName);
    if (!fn || fn.parameters.length === 0) return void 0;
    const sig = new vscode3.SignatureInformation(
      `${fn.label}(${fn.parameters.map((p) => p.label).join(", ")}) : ${fn.returnType}`,
      new vscode3.MarkdownString(fn.documentation)
    );
    for (const param of fn.parameters) {
      sig.parameters.push(
        new vscode3.ParameterInformation(param.label, new vscode3.MarkdownString(param.documentation))
      );
    }
    const help = new vscode3.SignatureHelp();
    help.signatures = [sig];
    help.activeSignature = 0;
    help.activeParameter = Math.min(commaCount, fn.parameters.length - 1);
    return help;
  }
};

// src/linter.ts
var vscode5 = __toESM(require("vscode"));

// src/parser.ts
var BLOCK_PAIRS = {
  "FUNCTION_BLOCK": "END_FUNCTION_BLOCK",
  "FUNCTION": "END_FUNCTION",
  "ORGANIZATION_BLOCK": "END_ORGANIZATION_BLOCK",
  "DATA_BLOCK": "END_DATA_BLOCK",
  "TYPE": "END_TYPE"
};
var BLOCK_END_TO_OPEN = {};
for (const [open, close] of Object.entries(BLOCK_PAIRS)) {
  BLOCK_END_TO_OPEN[close] = open;
}
var VAR_OPENS = /* @__PURE__ */ new Set([
  "VAR_INPUT",
  "VAR_OUTPUT",
  "VAR_IN_OUT",
  "VAR_TEMP",
  "VAR_GLOBAL",
  "VAR",
  "STRUCT"
]);
var CONTROL_PAIRS = {
  "IF": "END_IF",
  "FOR": "END_FOR",
  "WHILE": "END_WHILE",
  "REPEAT": "END_REPEAT",
  "CASE": "END_CASE",
  "REGION": "END_REGION"
};
var CONTROL_END_TO_OPEN = {};
for (const [open, close] of Object.entries(CONTROL_PAIRS)) {
  CONTROL_END_TO_OPEN[close] = open;
}
var LOOP_KEYWORDS = /* @__PURE__ */ new Set(["FOR", "WHILE", "REPEAT"]);
function parse(text) {
  const lines = text.split(/\r?\n/);
  const result = {
    blocks: [],
    variables: [],
    usedVariables: /* @__PURE__ */ new Set(),
    unmatchedOpens: [],
    unmatchedCloses: [],
    exitOutsideLoop: []
  };
  const blockStack = [];
  const varStack = [];
  const controlStack = [];
  let currentBlock = null;
  let currentVarSection = "";
  let inBlockComment = false;
  let afterBegin = false;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    let line = lines[lineIdx];
    if (inBlockComment) {
      const endIdx = line.indexOf("*)");
      if (endIdx >= 0) {
        line = " ".repeat(endIdx + 2) + line.substring(endIdx + 2);
        inBlockComment = false;
      } else {
        continue;
      }
    }
    line = stripBlockComments(line);
    if (line.includes("(*")) {
      inBlockComment = true;
      line = line.substring(0, line.indexOf("(*"));
    }
    const commentIdx = lineCommentIndex(line);
    if (commentIdx >= 0) {
      line = line.substring(0, commentIdx);
    }
    const originalLine = line;
    line = stripStrings(line);
    const trimmed = line.trim();
    if (!trimmed) continue;
    const upper = trimmed.toUpperCase();
    const hashVarRegex = /#([A-Za-z_]\w*)/g;
    let hvMatch;
    while ((hvMatch = hashVarRegex.exec(originalLine)) !== null) {
      result.usedVariables.add(hvMatch[1].toLowerCase());
    }
    if (trimmed.startsWith("{") && currentBlock) {
      currentBlock.hasPragma = true;
      continue;
    }
    if (upper.startsWith("VERSION") && currentBlock) {
      currentBlock.hasVersion = true;
      continue;
    }
    let handled = false;
    for (const openKw of Object.keys(BLOCK_PAIRS)) {
      if (matchKeyword(upper, openKw)) {
        const name = extractBlockName(originalLine);
        const block = {
          type: openKw,
          name,
          line: lineIdx,
          endLine: -1,
          hasVersion: false,
          hasPragma: false,
          hasBegin: false,
          hasCode: false,
          hasCaseElse: /* @__PURE__ */ new Map()
        };
        result.blocks.push(block);
        currentBlock = block;
        blockStack.push({ keyword: openKw, line: lineIdx, col: 0 });
        afterBegin = false;
        handled = true;
        break;
      }
    }
    if (handled) continue;
    for (const closeKw of Object.keys(BLOCK_END_TO_OPEN)) {
      if (matchKeyword(upper, closeKw)) {
        if (blockStack.length > 0) {
          const top = blockStack[blockStack.length - 1];
          if (BLOCK_PAIRS[top.keyword] === closeKw) {
            blockStack.pop();
            if (currentBlock) currentBlock.endLine = lineIdx;
            currentBlock = null;
            afterBegin = false;
          } else {
            result.unmatchedCloses.push({ keyword: closeKw, line: lineIdx, col: 0 });
          }
        } else {
          result.unmatchedCloses.push({ keyword: closeKw, line: lineIdx, col: 0 });
        }
        handled = true;
        break;
      }
    }
    if (handled) continue;
    if (upper === "BEGIN") {
      if (currentBlock) currentBlock.hasBegin = true;
      afterBegin = true;
      continue;
    }
    if (matchKeyword(upper, "END_VAR") || matchKeyword(upper, "END_STRUCT")) {
      if (varStack.length > 0) {
        varStack.pop();
        currentVarSection = varStack.length > 0 ? varStack[varStack.length - 1].keyword : "";
      } else {
        result.unmatchedCloses.push({
          keyword: upper.startsWith("END_STRUCT") ? "END_STRUCT" : "END_VAR",
          line: lineIdx,
          col: 0
        });
      }
      continue;
    }
    if (upper.startsWith("VAR") && upper.includes("CONSTANT") && !upper.startsWith("VAR_")) {
      currentVarSection = "VAR_CONSTANT";
      varStack.push({ keyword: "VAR_CONSTANT", line: lineIdx, col: 0 });
      continue;
    }
    let varMatched = false;
    for (const varKw of VAR_OPENS) {
      if (matchKeyword(upper, varKw)) {
        currentVarSection = varKw;
        varStack.push({ keyword: varKw, line: lineIdx, col: 0 });
        varMatched = true;
        break;
      }
    }
    if (varMatched) continue;
    if (currentVarSection && !afterBegin) {
      const varMatch = trimmed.match(/^(\w+)\s*:\s*(.+?)(?:\s*:=\s*.+?)?\s*;/);
      if (varMatch) {
        const varName = varMatch[1];
        let varType = varMatch[2].trim().replace(/;$/, "").trim();
        if (!isKeyword(varName)) {
          result.variables.push({
            name: varName,
            type: varType,
            section: currentVarSection,
            block: currentBlock?.name || "",
            line: lineIdx,
            col: trimmed.indexOf(varName)
          });
        }
        continue;
      }
      const simpleMatch = trimmed.match(/^(\w+)\s*:\s*(\S+)/);
      if (simpleMatch && !isKeyword(simpleMatch[1])) {
        result.variables.push({
          name: simpleMatch[1],
          type: simpleMatch[2].replace(/;$/, "").trim(),
          section: currentVarSection,
          block: currentBlock?.name || "",
          line: lineIdx,
          col: 0
        });
      }
      continue;
    }
    if (afterBegin) {
      if (currentBlock && trimmed !== ";" && !upper.startsWith("END_")) {
        currentBlock.hasCode = true;
      }
      if (matchKeyword(upper, "CASE") || upper.startsWith("CASE ")) {
        controlStack.push({ keyword: "CASE", line: lineIdx, col: 0 });
        if (currentBlock) currentBlock.hasCaseElse.set(lineIdx, false);
        continue;
      }
      if (matchKeyword(upper, "ELSE") && controlStack.length > 0) {
        const top = controlStack[controlStack.length - 1];
        if (top.keyword === "CASE" && currentBlock) {
          currentBlock.hasCaseElse.set(top.line, true);
        }
        continue;
      }
      if ((upper === "IF" || upper.startsWith("IF ")) && !upper.startsWith("ELSIF")) {
        controlStack.push({ keyword: "IF", line: lineIdx, col: 0 });
      }
      for (const openKw of ["FOR", "WHILE", "REPEAT", "REGION"]) {
        if (matchKeyword(upper, openKw) || upper.startsWith(openKw + " ")) {
          controlStack.push({ keyword: openKw, line: lineIdx, col: 0 });
          break;
        }
      }
      for (const closeKw of Object.keys(CONTROL_END_TO_OPEN)) {
        if (matchKeyword(upper, closeKw)) {
          const expectedOpen = CONTROL_END_TO_OPEN[closeKw];
          if (controlStack.length > 0 && controlStack[controlStack.length - 1].keyword === expectedOpen) {
            controlStack.pop();
          } else {
            result.unmatchedCloses.push({ keyword: closeKw, line: lineIdx, col: 0 });
          }
          break;
        }
      }
      if (matchKeyword(upper, "EXIT") || matchKeyword(upper, "CONTINUE")) {
        const inLoop = controlStack.some((e) => LOOP_KEYWORDS.has(e.keyword));
        if (!inLoop) {
          result.exitOutsideLoop.push({
            keyword: upper.startsWith("EXIT") ? "EXIT" : "CONTINUE",
            line: lineIdx,
            col: 0
          });
        }
      }
    }
  }
  result.unmatchedOpens.push(...blockStack, ...varStack, ...controlStack);
  return result;
}
function matchKeyword(upper, keyword) {
  if (upper === keyword) return true;
  if (upper === keyword + ";") return true;
  if (upper.startsWith(keyword + " ") || upper.startsWith(keyword + "	") || upper.startsWith(keyword + ";")) return true;
  return false;
}
function extractBlockName(line) {
  const match = line.match(/"([^"]+)"/);
  return match ? match[1] : "";
}
function stripBlockComments(line) {
  return line.replace(/\(\*[^]*?\*\)/g, (m) => " ".repeat(m.length));
}
function lineCommentIndex(line) {
  let inString = false;
  let stringChar = "";
  for (let i = 0; i < line.length - 1; i++) {
    const ch = line[i];
    if (inString) {
      if (ch === stringChar) inString = false;
    } else {
      if (ch === "'" || ch === '"') {
        inString = true;
        stringChar = ch;
      } else if (ch === "/" && line[i + 1] === "/") {
        return i;
      }
    }
  }
  return -1;
}
function stripStrings(line) {
  return line.replace(/'[^']*'/g, (m) => "'" + " ".repeat(m.length - 2) + "'").replace(/"[^"]*"/g, (m) => '"' + " ".repeat(m.length - 2) + '"');
}
var KEYWORD_SET = /* @__PURE__ */ new Set([
  "IF",
  "THEN",
  "ELSIF",
  "ELSE",
  "END_IF",
  "FOR",
  "TO",
  "BY",
  "DO",
  "END_FOR",
  "WHILE",
  "END_WHILE",
  "REPEAT",
  "UNTIL",
  "END_REPEAT",
  "CASE",
  "OF",
  "END_CASE",
  "RETURN",
  "EXIT",
  "CONTINUE",
  "BEGIN",
  "END_VAR",
  "END_STRUCT",
  "REGION",
  "END_REGION",
  "TRUE",
  "FALSE",
  "AND",
  "OR",
  "XOR",
  "NOT",
  "MOD"
]);
function isKeyword(word) {
  return KEYWORD_SET.has(word.toUpperCase());
}

// src/rules.ts
var vscode4 = __toESM(require("vscode"));
function runRules(result, lines) {
  const diagnostics = [];
  diagnostics.push(...ruleUnmatchedControlFlow(result));
  diagnostics.push(...ruleUnmatchedVarSections(result));
  diagnostics.push(...ruleUnmatchedBlocks(result));
  diagnostics.push(...ruleDuplicateVariables(result));
  diagnostics.push(...ruleExitOutsideLoop(result));
  diagnostics.push(...ruleUnusedVariables(result));
  diagnostics.push(...ruleMissingVersion(result));
  diagnostics.push(...ruleMissingPragma(result));
  diagnostics.push(...ruleCaseWithoutElse(result));
  diagnostics.push(...ruleEmptyBlock(result));
  diagnostics.push(...ruleNamingConvention(result));
  return diagnostics;
}
function ruleUnmatchedControlFlow(result) {
  const diags = [];
  for (const entry of result.unmatchedOpens) {
    if (["IF", "FOR", "WHILE", "REPEAT", "CASE", "REGION"].includes(entry.keyword)) {
      diags.push({
        line: entry.line,
        col: 0,
        message: `'${entry.keyword}' has no matching 'END_${entry.keyword}'`,
        severity: vscode4.DiagnosticSeverity.Error,
        code: "SCL001"
      });
    }
  }
  for (const entry of result.unmatchedCloses) {
    if (entry.keyword.startsWith("END_") && !entry.keyword.startsWith("END_FUNCTION") && !entry.keyword.startsWith("END_DATA") && !entry.keyword.startsWith("END_ORGANIZATION") && !entry.keyword.startsWith("END_TYPE") && entry.keyword !== "END_VAR" && entry.keyword !== "END_STRUCT") {
      const openKw = entry.keyword.replace("END_", "");
      diags.push({
        line: entry.line,
        col: 0,
        message: `'${entry.keyword}' without matching '${openKw}'`,
        severity: vscode4.DiagnosticSeverity.Error,
        code: "SCL001"
      });
    }
  }
  return diags;
}
function ruleUnmatchedVarSections(result) {
  const diags = [];
  for (const entry of result.unmatchedOpens) {
    if (entry.keyword.startsWith("VAR") || entry.keyword === "STRUCT") {
      const endKw = entry.keyword === "STRUCT" ? "END_STRUCT" : "END_VAR";
      diags.push({
        line: entry.line,
        col: 0,
        message: `'${entry.keyword}' has no matching '${endKw}'`,
        severity: vscode4.DiagnosticSeverity.Error,
        code: "SCL002"
      });
    }
  }
  for (const entry of result.unmatchedCloses) {
    if (entry.keyword === "END_VAR" || entry.keyword === "END_STRUCT") {
      diags.push({
        line: entry.line,
        col: 0,
        message: `'${entry.keyword}' without matching opening declaration`,
        severity: vscode4.DiagnosticSeverity.Error,
        code: "SCL002"
      });
    }
  }
  return diags;
}
function ruleUnmatchedBlocks(result) {
  const diags = [];
  for (const entry of result.unmatchedOpens) {
    if (["FUNCTION_BLOCK", "FUNCTION", "ORGANIZATION_BLOCK", "DATA_BLOCK", "TYPE"].includes(entry.keyword)) {
      diags.push({
        line: entry.line,
        col: 0,
        message: `'${entry.keyword}' has no matching 'END_${entry.keyword}'`,
        severity: vscode4.DiagnosticSeverity.Error,
        code: "SCL003"
      });
    }
  }
  for (const entry of result.unmatchedCloses) {
    if (["END_FUNCTION_BLOCK", "END_FUNCTION", "END_ORGANIZATION_BLOCK", "END_DATA_BLOCK", "END_TYPE"].includes(entry.keyword)) {
      diags.push({
        line: entry.line,
        col: 0,
        message: `'${entry.keyword}' without matching block declaration`,
        severity: vscode4.DiagnosticSeverity.Error,
        code: "SCL003"
      });
    }
  }
  return diags;
}
function ruleDuplicateVariables(result) {
  const diags = [];
  const byBlock = /* @__PURE__ */ new Map();
  for (const v of result.variables) {
    const key = v.block;
    if (!byBlock.has(key)) byBlock.set(key, /* @__PURE__ */ new Map());
    const blockVars = byBlock.get(key);
    const lower = v.name.toLowerCase();
    if (!blockVars.has(lower)) blockVars.set(lower, []);
    blockVars.get(lower).push({ line: v.line, col: v.col });
  }
  for (const [, blockVars] of byBlock) {
    for (const [name, locations] of blockVars) {
      if (locations.length > 1) {
        for (let i = 1; i < locations.length; i++) {
          diags.push({
            line: locations[i].line,
            col: locations[i].col,
            message: `Duplicate variable '${name}' (first declared on line ${locations[0].line + 1})`,
            severity: vscode4.DiagnosticSeverity.Error,
            code: "SCL004"
          });
        }
      }
    }
  }
  return diags;
}
function ruleExitOutsideLoop(result) {
  return result.exitOutsideLoop.map((entry) => ({
    line: entry.line,
    col: 0,
    message: `'${entry.keyword}' used outside of a FOR/WHILE/REPEAT loop`,
    severity: vscode4.DiagnosticSeverity.Error,
    code: "SCL005"
  }));
}
function ruleUnusedVariables(result) {
  const diags = [];
  for (const v of result.variables) {
    const block = result.blocks.find((b) => b.name === v.block);
    if (block && (block.type === "DATA_BLOCK" || block.type === "TYPE")) continue;
    if (v.section === "VAR_OUTPUT") continue;
    const lower = v.name.toLowerCase();
    if (!result.usedVariables.has(lower)) {
      diags.push({
        line: v.line,
        col: v.col,
        message: `Variable '${v.name}' is declared but never used`,
        severity: vscode4.DiagnosticSeverity.Warning,
        code: "SCL101"
      });
    }
  }
  return diags;
}
function ruleMissingVersion(result) {
  const diags = [];
  for (const block of result.blocks) {
    if (!block.hasVersion) {
      diags.push({
        line: block.line,
        col: 0,
        message: `Block '${block.name || block.type}' has no VERSION declaration`,
        severity: vscode4.DiagnosticSeverity.Warning,
        code: "SCL102"
      });
    }
  }
  return diags;
}
function ruleMissingPragma(result) {
  const diags = [];
  for (const block of result.blocks) {
    if (block.type === "TYPE") continue;
    if (!block.hasPragma) {
      diags.push({
        line: block.line,
        col: 0,
        message: `Block '${block.name || block.type}' has no { S7_Optimized_Access } pragma`,
        severity: vscode4.DiagnosticSeverity.Warning,
        code: "SCL103"
      });
    }
  }
  return diags;
}
function ruleCaseWithoutElse(result) {
  const diags = [];
  for (const block of result.blocks) {
    for (const [caseLine, hasElse] of block.hasCaseElse) {
      if (!hasElse) {
        diags.push({
          line: caseLine,
          col: 0,
          message: "CASE statement has no ELSE branch",
          severity: vscode4.DiagnosticSeverity.Warning,
          code: "SCL104"
        });
      }
    }
  }
  return diags;
}
function ruleEmptyBlock(result) {
  const diags = [];
  for (const block of result.blocks) {
    if (block.type === "DATA_BLOCK" || block.type === "TYPE") continue;
    if (block.hasBegin && !block.hasCode) {
      diags.push({
        line: block.line,
        col: 0,
        message: `Block '${block.name || block.type}' has an empty BEGIN section`,
        severity: vscode4.DiagnosticSeverity.Warning,
        code: "SCL105"
      });
    }
  }
  return diags;
}
function ruleNamingConvention(result) {
  const diags = [];
  const prefixMap = {
    "FUNCTION_BLOCK": "FB_",
    "FUNCTION": "FC_",
    "DATA_BLOCK": "DB_"
  };
  for (const block of result.blocks) {
    const expected = prefixMap[block.type];
    if (expected && block.name && !block.name.startsWith(expected) && !block.name.startsWith("UDT_")) {
      diags.push({
        line: block.line,
        col: 0,
        message: `Block '${block.name}' does not follow naming convention '${expected}...'`,
        severity: vscode4.DiagnosticSeverity.Hint,
        code: "SCL201"
      });
    }
  }
  return diags;
}

// src/linter.ts
var SclLinter = class {
  constructor(context) {
    this.debounceTimers = /* @__PURE__ */ new Map();
    this.debounceMs = 500;
    this.diagnosticCollection = vscode5.languages.createDiagnosticCollection("scl");
    context.subscriptions.push(this.diagnosticCollection);
    context.subscriptions.push(
      vscode5.workspace.onDidSaveTextDocument((doc) => {
        if (doc.languageId === "scl") this.lintDocument(doc);
      })
    );
    context.subscriptions.push(
      vscode5.workspace.onDidOpenTextDocument((doc) => {
        if (doc.languageId === "scl") this.lintDocument(doc);
      })
    );
    context.subscriptions.push(
      vscode5.workspace.onDidChangeTextDocument((event) => {
        if (event.document.languageId === "scl") {
          this.lintDocumentDebounced(event.document);
        }
      })
    );
    context.subscriptions.push(
      vscode5.workspace.onDidCloseTextDocument((doc) => {
        this.diagnosticCollection.delete(doc.uri);
        const key = doc.uri.toString();
        const timer = this.debounceTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          this.debounceTimers.delete(key);
        }
      })
    );
    for (const doc of vscode5.workspace.textDocuments) {
      if (doc.languageId === "scl") this.lintDocument(doc);
    }
  }
  lintDocumentDebounced(document) {
    const key = document.uri.toString();
    const existing = this.debounceTimers.get(key);
    if (existing) clearTimeout(existing);
    this.debounceTimers.set(
      key,
      setTimeout(() => {
        this.debounceTimers.delete(key);
        this.lintDocument(document);
      }, this.debounceMs)
    );
  }
  lintDocument(document) {
    const text = document.getText();
    const lines = text.split(/\r?\n/);
    const parseResult = parse(text);
    const lintDiags = runRules(parseResult, lines);
    const diagnostics = lintDiags.map((d) => {
      const lineText = lines[d.line] || "";
      const startCol = d.col;
      const endCol = d.endCol ?? lineText.trimEnd().length;
      const range = new vscode5.Range(d.line, startCol, d.line, Math.max(endCol, startCol + 1));
      const diag = new vscode5.Diagnostic(range, d.message, d.severity);
      diag.code = d.code;
      diag.source = "SCL";
      return diag;
    });
    this.diagnosticCollection.set(document.uri, diagnostics);
  }
};

// src/extension.ts
function activate(context) {
  const selector = { language: "scl", scheme: "file" };
  context.subscriptions.push(
    vscode6.languages.registerCompletionItemProvider(
      selector,
      new SclCompletionProvider(),
      ".",
      "#",
      "%",
      '"'
    )
  );
  context.subscriptions.push(
    vscode6.languages.registerHoverProvider(selector, new SclHoverProvider())
  );
  context.subscriptions.push(
    vscode6.languages.registerSignatureHelpProvider(
      selector,
      new SclSignatureHelpProvider(),
      "(",
      ","
    )
  );
  new SclLinter(context);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
