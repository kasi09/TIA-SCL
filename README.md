# TIA-SCL

Siemens SCL (Structured Control Language) support for Visual Studio Code.

<a href="https://www.buymeacoffee.com/kasi09" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Features

### Syntax Highlighting

Full highlighting for `.scl` files:

- **Keywords** - FUNCTION_BLOCK, IF/THEN, FOR/DO, CASE/OF, etc.
- **Data types** - Bool, Int, Real, Time, String, Array, Struct, IEC timers/counters
- **Variables** - `#local` variables, `"DB_Name"` references, `%I/%Q/%M` addresses
- **Literals** - Time (`T#5s`), hex (`16#FF00`), binary (`2#1010`), dates (`D#2024-01-15`)
- **System functions** - Type conversions, math, string functions, S7 system calls
- **Comments** - `//` line and `(* block *)` comments
- **Pragmas** - `{ S7_Optimized_Access := 'TRUE' }`

### Code Snippets

Type a prefix and press `Tab` to insert:

| Prefix | Snippet |
|---|---|
| `fb` | Function Block (full template) |
| `fc` | Function with return type |
| `ob` | Organization Block |
| `db` | Data Block |
| `idb` | Instance Data Block |
| `udt` | User Defined Type (STRUCT) |
| `if` | IF THEN END_IF |
| `ife` | IF THEN ELSE END_IF |
| `ifei` | IF ELSIF ELSE END_IF |
| `for` | FOR loop |
| `while` | WHILE loop |
| `repeat` | REPEAT UNTIL loop |
| `case` | CASE OF statement |
| `var_input` | VAR_INPUT section |
| `var_output` | VAR_OUTPUT section |
| `var_inout` | VAR_IN_OUT section |
| `var_temp` | VAR_TEMP section |
| `ton` | TON timer call |
| `tof` | TOF timer call |
| `tp` | TP pulse timer call |
| `ctu` | CTU counter call |
| `rtrig` | R_TRIG rising edge |
| `ftrig` | F_TRIG falling edge |
| `call` | FB instance call |
| `norm` | NORM_X normalize |
| `scale` | SCALE_X scale |
| `motor` | Motor control pattern |
| `statemachine` | State machine (CASE) |
| `analogscale` | Analog scaling formula |
| `region` | REGION fold block |

### IntelliSense / Autocomplete

Real-time autocomplete as you type:

- **Keywords** - All SCL block, variable and control flow keywords with documentation
- **Data types** - All S7 data types with size info (suggested automatically after `:`)
- **System functions** - Type conversions, math, string, scaling functions with parameter info
- **`#` variables** - Type `#` to see all declared variables in the current block
- **`%` addresses** - Type `%` to get I/Q/M address suggestions
- **`"` block references** - Type `"` to see all block names in the file
- **`.` member access** - Timer/Counter outputs (Q, ET, CV) after dot

### Hover Documentation

Hover over any keyword, data type or system function to see documentation.

### Signature Help

Parameter hints when calling system functions - shows parameter names and types as you type.

### Linter / Diagnostics

Real-time error checking as you type:

**Errors (red):**
| Code | Check |
|---|---|
| SCL001 | Unmatched control flow (IF without END_IF, FOR without END_FOR, ...) |
| SCL002 | Unmatched VAR sections (VAR_INPUT without END_VAR) |
| SCL003 | Unmatched block declarations (FUNCTION_BLOCK without END_FUNCTION_BLOCK) |
| SCL004 | Duplicate variable names in same block |
| SCL005 | EXIT/CONTINUE outside of a loop |

**Warnings (yellow):**
| Code | Check |
|---|---|
| SCL101 | Unused variables (declared but never referenced) |
| SCL102 | Missing VERSION declaration |
| SCL103 | Missing S7_Optimized_Access pragma |
| SCL104 | CASE statement without ELSE branch |
| SCL105 | Empty BEGIN section (no code) |

**Hints (grey):**
| Code | Check |
|---|---|
| SCL201 | Naming convention (FB_, FC_, DB_ prefix suggestion) |

### Code Folding

Automatic folding for:
- Block declarations (FUNCTION_BLOCK, FUNCTION, etc.)
- Variable sections (VAR_INPUT, VAR_OUTPUT, etc.)
- Control structures (IF, FOR, WHILE, CASE)
- Regions (REGION / END_REGION)

### Auto-Indentation

Automatic indent/outdent for block keywords and control flow.

### Bracket Matching

Matching of parentheses, brackets, and `(* *)` comments.

## Installation

### From VS Code Marketplace

Search for **TIA-SCL** in the Extensions view (`Ctrl+Shift+X`).

### Manual Installation

```bash
# Clone and install
git clone https://github.com/kasi09/TIA-SCL.git
cd TIA-SCL
# Copy to VS Code extensions folder
# Windows:
cp -r . "%USERPROFILE%/.vscode/extensions/tia-scl"
# Then restart VS Code
```

## File Association

The extension automatically associates with `.scl` files. To manually set the language mode, click the language indicator in the bottom right of VS Code and select **SCL**.

## Related

- [TIA-Tools](https://github.com/kasi09/TIA-Tools) - Python toolkit for Siemens TIA Portal projects (reader, block generator, SCL generator, tag export)

## License

MIT
