/**
 * SCL Parser - Structural analysis of SCL source files.
 *
 * Not a full AST parser, but a stack-based structure tracker that:
 * - Strips comments and strings
 * - Tracks block/var/control flow nesting via stacks
 * - Builds a symbol table of declared variables per block
 * - Tracks which variables are used in code
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StackEntry {
  keyword: string;
  line: number;
  col: number;
}

export interface VariableDecl {
  name: string;
  type: string;
  section: string;      // VAR_INPUT, VAR_OUTPUT, VAR_IN_OUT, VAR, VAR_TEMP, VAR_CONSTANT, STRUCT
  block: string;        // Parent block name
  line: number;
  col: number;
}

export interface BlockDecl {
  type: string;         // FUNCTION_BLOCK, FUNCTION, DATA_BLOCK, ORGANIZATION_BLOCK, TYPE
  name: string;
  line: number;
  endLine: number;
  hasVersion: boolean;
  hasPragma: boolean;
  hasBegin: boolean;
  hasCode: boolean;     // Non-empty code after BEGIN
  hasCaseElse: Map<number, boolean>;  // line -> hasElse for CASE statements
}

export interface ParseResult {
  blocks: BlockDecl[];
  variables: VariableDecl[];
  usedVariables: Set<string>;       // All #variable references (lowercase)
  unmatchedOpens: StackEntry[];     // Opening keywords without closing
  unmatchedCloses: StackEntry[];    // Closing keywords without opening
  exitOutsideLoop: StackEntry[];   // EXIT/CONTINUE outside loop
}

// ─── Block keyword pairs ────────────────────────────────────────────────────

const BLOCK_PAIRS: Record<string, string> = {
  "FUNCTION_BLOCK": "END_FUNCTION_BLOCK",
  "FUNCTION": "END_FUNCTION",
  "ORGANIZATION_BLOCK": "END_ORGANIZATION_BLOCK",
  "DATA_BLOCK": "END_DATA_BLOCK",
  "TYPE": "END_TYPE",
};

const BLOCK_END_TO_OPEN: Record<string, string> = {};
for (const [open, close] of Object.entries(BLOCK_PAIRS)) {
  BLOCK_END_TO_OPEN[close] = open;
}

const VAR_OPENS = new Set([
  "VAR_INPUT", "VAR_OUTPUT", "VAR_IN_OUT", "VAR_TEMP",
  "VAR_GLOBAL", "VAR", "STRUCT",
]);

const CONTROL_PAIRS: Record<string, string> = {
  "IF": "END_IF",
  "FOR": "END_FOR",
  "WHILE": "END_WHILE",
  "REPEAT": "END_REPEAT",
  "CASE": "END_CASE",
  "REGION": "END_REGION",
};

const CONTROL_END_TO_OPEN: Record<string, string> = {};
for (const [open, close] of Object.entries(CONTROL_PAIRS)) {
  CONTROL_END_TO_OPEN[close] = open;
}

const LOOP_KEYWORDS = new Set(["FOR", "WHILE", "REPEAT"]);

// ─── Parser ─────────────────────────────────────────────────────────────────

export function parse(text: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const result: ParseResult = {
    blocks: [],
    variables: [],
    usedVariables: new Set(),
    unmatchedOpens: [],
    unmatchedCloses: [],
    exitOutsideLoop: [],
  };

  const blockStack: StackEntry[] = [];
  const varStack: StackEntry[] = [];
  const controlStack: StackEntry[] = [];

  let currentBlock: BlockDecl | null = null;
  let currentVarSection = "";
  let inBlockComment = false;
  let afterBegin = false;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    let line = lines[lineIdx];

    // Handle block comments spanning lines
    if (inBlockComment) {
      const endIdx = line.indexOf("*)");
      if (endIdx >= 0) {
        line = " ".repeat(endIdx + 2) + line.substring(endIdx + 2);
        inBlockComment = false;
      } else {
        continue;
      }
    }

    // Strip inline block comments (* ... *)
    line = stripBlockComments(line);
    if (line.includes("(*")) {
      inBlockComment = true;
      line = line.substring(0, line.indexOf("(*"));
    }

    // Strip line comments
    const commentIdx = lineCommentIndex(line);
    if (commentIdx >= 0) {
      line = line.substring(0, commentIdx);
    }

    // Save original line (before stripping strings) for block name extraction
    const originalLine = line;

    // Strip string literals
    line = stripStrings(line);

    const trimmed = line.trim();
    if (!trimmed) continue;

    const upper = trimmed.toUpperCase();

    // ── Track #variable usage ──────────────────────────────────
    const hashVarRegex = /#([A-Za-z_]\w*)/g;
    let hvMatch;
    while ((hvMatch = hashVarRegex.exec(originalLine)) !== null) {
      result.usedVariables.add(hvMatch[1].toLowerCase());
    }

    // ── Pragma detection ───────────────────────────────────────
    if (trimmed.startsWith("{") && currentBlock) {
      currentBlock.hasPragma = true;
      continue;
    }

    // ── VERSION detection ──────────────────────────────────────
    if (upper.startsWith("VERSION") && currentBlock) {
      currentBlock.hasVersion = true;
      continue;
    }

    // ── Block declarations ─────────────────────────────────────
    let handled = false;
    for (const openKw of Object.keys(BLOCK_PAIRS)) {
      if (matchKeyword(upper, openKw)) {
        const name = extractBlockName(originalLine);
        const block: BlockDecl = {
          type: openKw,
          name,
          line: lineIdx,
          endLine: -1,
          hasVersion: false,
          hasPragma: false,
          hasBegin: false,
          hasCode: false,
          hasCaseElse: new Map(),
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

    // Block end keywords
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

    // ── BEGIN ──────────────────────────────────────────────────
    if (upper === "BEGIN") {
      if (currentBlock) currentBlock.hasBegin = true;
      afterBegin = true;
      continue;
    }

    // ── VAR section ends ───────────────────────────────────────
    if (matchKeyword(upper, "END_VAR") || matchKeyword(upper, "END_STRUCT")) {
      if (varStack.length > 0) {
        varStack.pop();
        currentVarSection = varStack.length > 0 ? varStack[varStack.length - 1].keyword : "";
      } else {
        result.unmatchedCloses.push({
          keyword: upper.startsWith("END_STRUCT") ? "END_STRUCT" : "END_VAR",
          line: lineIdx, col: 0,
        });
      }
      continue;
    }

    // "VAR CONSTANT" special case
    if (upper.startsWith("VAR") && upper.includes("CONSTANT") && !upper.startsWith("VAR_")) {
      currentVarSection = "VAR_CONSTANT";
      varStack.push({ keyword: "VAR_CONSTANT", line: lineIdx, col: 0 });
      continue;
    }

    // VAR section opens
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

    // ── Variable declarations (inside VAR sections) ────────────
    if (currentVarSection && !afterBegin) {
      // Use originalLine (before stripStrings) to preserve UDT type names like "UDT_Motor"
      const origTrimmed = originalLine.trim();
      const varMatch = origTrimmed.match(/^(\w+)\s*:\s*(.+?)(?:\s*:=\s*.+?)?\s*;/);
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
            col: origTrimmed.indexOf(varName),
          });
        }
        continue;
      }
      // Simple declaration without ; on same line
      const simpleMatch = origTrimmed.match(/^(\w+)\s*:\s*(\S+)/);
      if (simpleMatch && !isKeyword(simpleMatch[1])) {
        result.variables.push({
          name: simpleMatch[1],
          type: simpleMatch[2].replace(/;$/, "").trim(),
          section: currentVarSection,
          block: currentBlock?.name || "",
          line: lineIdx,
          col: 0,
        });
      }
      continue;
    }

    // ── Control flow (only in code section after BEGIN) ────────
    if (afterBegin) {
      if (currentBlock && trimmed !== ";" && !upper.startsWith("END_")) {
        currentBlock.hasCode = true;
      }

      // CASE ... OF
      if (matchKeyword(upper, "CASE")) {
        controlStack.push({ keyword: "CASE", line: lineIdx, col: 0 });
        if (currentBlock) currentBlock.hasCaseElse.set(lineIdx, false);
        continue;
      }

      // ELSE inside CASE -> mark it
      if (matchKeyword(upper, "ELSE") && controlStack.length > 0) {
        const top = controlStack[controlStack.length - 1];
        if (top.keyword === "CASE" && currentBlock) {
          currentBlock.hasCaseElse.set(top.line, true);
        }
        continue;
      }

      // IF (but not ELSIF)
      if ((upper === "IF" || upper.startsWith("IF ")) && !upper.startsWith("ELSIF")) {
        controlStack.push({ keyword: "IF", line: lineIdx, col: 0 });
      }

      // FOR, WHILE, REPEAT, REGION
      for (const openKw of ["FOR", "WHILE", "REPEAT", "REGION"]) {
        if (matchKeyword(upper, openKw)) {
          controlStack.push({ keyword: openKw, line: lineIdx, col: 0 });
          break;
        }
      }

      // Control flow closers
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

      // EXIT / CONTINUE outside loop
      if (matchKeyword(upper, "EXIT") || matchKeyword(upper, "CONTINUE")) {
        const inLoop = controlStack.some(e => LOOP_KEYWORDS.has(e.keyword));
        if (!inLoop) {
          result.exitOutsideLoop.push({
            keyword: upper.startsWith("EXIT") ? "EXIT" : "CONTINUE",
            line: lineIdx, col: 0,
          });
        }
      }
    }
  }

  // Remaining unmatched opens
  result.unmatchedOpens.push(...blockStack, ...varStack, ...controlStack);

  return result;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function matchKeyword(upper: string, keyword: string): boolean {
  if (upper === keyword) return true;
  if (upper === keyword + ";") return true;
  if (upper.startsWith(keyword + " ") || upper.startsWith(keyword + "\t") || upper.startsWith(keyword + ";")) return true;
  return false;
}

function extractBlockName(line: string): string {
  const match = line.match(/"([^"]+)"/);
  return match ? match[1] : "";
}

function stripBlockComments(line: string): string {
  return line.replace(/\(\*[\s\S]*?\*\)/g, (m) => " ".repeat(m.length));
}

function lineCommentIndex(line: string): number {
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

function stripStrings(line: string): string {
  return line.replace(/'[^']*'/g, (m) => "'" + " ".repeat(m.length - 2) + "'")
             .replace(/"[^"]*"/g, (m) => '"' + " ".repeat(m.length - 2) + '"');
}

const KEYWORD_SET = new Set([
  "IF", "THEN", "ELSIF", "ELSE", "END_IF",
  "FOR", "TO", "BY", "DO", "END_FOR",
  "WHILE", "END_WHILE", "REPEAT", "UNTIL", "END_REPEAT",
  "CASE", "OF", "END_CASE", "RETURN", "EXIT", "CONTINUE",
  "BEGIN", "END_VAR", "END_STRUCT", "REGION", "END_REGION",
  "TRUE", "FALSE", "AND", "OR", "XOR", "NOT", "MOD",
]);

function isKeyword(word: string): boolean {
  return KEYWORD_SET.has(word.toUpperCase());
}
