/**
 * SCL Code Formatter - Document formatting provider.
 *
 * Handles:
 *   - Indentation (4 spaces per level)
 *   - Keyword casing (UPPERCASE)
 *   - Spacing around operators (:=, :, ,)
 *   - Preserves strings, comments, and pragmas
 */

import * as vscode from "vscode";

// ─── Keyword sets for casing ────────────────────────────────────────────────

const SCL_KEYWORDS = new Set([
  // Block keywords
  "FUNCTION_BLOCK", "END_FUNCTION_BLOCK", "FUNCTION", "END_FUNCTION",
  "ORGANIZATION_BLOCK", "END_ORGANIZATION_BLOCK", "DATA_BLOCK", "END_DATA_BLOCK",
  "TYPE", "END_TYPE", "INTERFACE", "END_INTERFACE",
  // Variable sections
  "VAR_INPUT", "VAR_OUTPUT", "VAR_IN_OUT", "VAR_TEMP", "VAR_GLOBAL",
  "VAR", "END_VAR", "STRUCT", "END_STRUCT",
  // Control flow
  "IF", "THEN", "ELSIF", "ELSE", "END_IF",
  "FOR", "TO", "BY", "DO", "END_FOR",
  "WHILE", "END_WHILE", "REPEAT", "UNTIL", "END_REPEAT",
  "CASE", "OF", "END_CASE",
  "RETURN", "EXIT", "CONTINUE", "GOTO",
  "BEGIN", "REGION", "END_REGION",
  // Operators and literals
  "AND", "OR", "XOR", "NOT", "MOD",
  "TRUE", "FALSE", "NULL",
  // Modifiers
  "VERSION", "RETAIN", "NON_RETAIN", "CONSTANT",
  "ARRAY", "REF_TO",
  // Data types
  "BOOL", "BYTE", "CHAR", "WCHAR",
  "SINT", "USINT", "INT", "UINT", "DINT", "UDINT", "LINT", "ULINT",
  "WORD", "DWORD", "LWORD",
  "REAL", "LREAL",
  "STRING", "WSTRING",
  "TIME", "LTIME", "DATE", "DATE_AND_TIME", "DTL", "TIME_OF_DAY", "S5TIME",
  "VOID", "ANY", "POINTER", "VARIANT", "DB_ANY",
  "TON", "TOF", "TP", "TONR", "CTU", "CTD", "CTUD",
  "R_TRIG", "F_TRIG",
  "IEC_TIMER", "IEC_COUNTER",
]);

// ─── Indent rules ───────────────────────────────────────────────────────────

function shouldIncreaseIndent(upper: string): boolean {
  if (/^(FUNCTION_BLOCK|FUNCTION|ORGANIZATION_BLOCK|DATA_BLOCK|TYPE|INTERFACE)\b/.test(upper)) return true;
  if (/^(VAR_INPUT|VAR_OUTPUT|VAR_IN_OUT|VAR_TEMP|VAR_GLOBAL|STRUCT)\b/.test(upper)) return true;
  if (/^VAR\b/.test(upper) && !/^VAR_/.test(upper)) return true;
  if (upper === "BEGIN") return true;
  if (/^IF\b.*\bTHEN\s*$/.test(upper)) return true;
  if (/^ELSIF\b.*\bTHEN\s*$/.test(upper)) return true;
  if (/^ELSE\s*$/.test(upper) || upper === "ELSE") return true;
  if (/^FOR\b.*\bDO\s*$/.test(upper)) return true;
  if (/^WHILE\b.*\bDO\s*$/.test(upper)) return true;
  if (upper === "REPEAT") return true;
  if (/^CASE\b.*\bOF\s*$/.test(upper)) return true;
  if (/^REGION\b/.test(upper)) return true;
  return false;
}

function shouldDecreaseIndent(upper: string): boolean {
  if (/^(END_FUNCTION_BLOCK|END_FUNCTION|END_ORGANIZATION_BLOCK|END_DATA_BLOCK|END_TYPE|END_INTERFACE)\b/.test(upper)) return true;
  if (/^(END_VAR|END_STRUCT)\b/.test(upper)) return true;
  if (/^(END_IF|END_FOR|END_WHILE|END_REPEAT|END_CASE|END_REGION)\b/.test(upper)) return true;
  if (/^ELSIF\b/.test(upper)) return true;
  if (/^ELSE\b/.test(upper)) return true;
  if (/^UNTIL\b/.test(upper)) return true;
  return false;
}

// ─── String/comment protection ──────────────────────────────────────────────

interface LineParts {
  code: string;
  comment: string;
}

function splitLineComment(line: string): LineParts {
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
        return { code: line.substring(0, i), comment: line.substring(i) };
      }
    }
  }
  return { code: line, comment: "" };
}

// Replace strings with placeholders, return restore function
function protectStrings(code: string): { protected: string; restore: (s: string) => string } {
  const strings: string[] = [];
  const protected_ = code.replace(/'[^']*'|"[^"]*"/g, (match) => {
    strings.push(match);
    return `\x00STR${strings.length - 1}\x00`;
  });
  return {
    protected: protected_,
    restore: (s: string) => s.replace(/\x00STR(\d+)\x00/g, (_, idx) => strings[Number(idx)]),
  };
}

// ─── Keyword casing ─────────────────────────────────────────────────────────

function applyKeywordCasing(code: string): string {
  const { protected: p, restore } = protectStrings(code);
  const result = p.replace(/\b([A-Za-z_][A-Za-z_0-9]*)\b/g, (match) => {
    const upper = match.toUpperCase();
    if (SCL_KEYWORDS.has(upper)) return upper;
    return match;
  });
  return restore(result);
}

// ─── Spacing ────────────────────────────────────────────────────────────────

function applySpacing(code: string): string {
  const { protected: p, restore } = protectStrings(code);
  let result = p;
  // Space around :=
  result = result.replace(/\s*:=\s*/g, " := ");
  // Space after : in declarations (not :=, not after digits like CASE labels 0:)
  result = result.replace(/([A-Za-z_]\w*)\s*:\s*(?!=)/g, "$1 : ");
  // Space after comma
  result = result.replace(/,\s*/g, ", ");
  // Clean up multiple spaces (but not at start of line)
  result = result.replace(/([^ ]) {2,}/g, "$1 ");
  return restore(result);
}

// ─── Main formatter ─────────────────────────────────────────────────────────

export interface FormatOptions {
  indentSize: number;
  uppercaseKeywords: boolean;
}

export function formatScl(text: string, opts: FormatOptions): string {
  const lines = text.split(/\r?\n/);
  const result: string[] = [];
  let indentLevel = 0;
  let inBlockComment = false;
  let inCase = false;

  const indent = (level: number) => " ".repeat(Math.max(0, level) * opts.indentSize);

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Handle multiline block comments - preserve original content
    if (inBlockComment) {
      const endIdx = rawLine.indexOf("*)");
      if (endIdx >= 0) {
        inBlockComment = false;
      }
      result.push(rawLine);
      continue;
    }

    // Empty lines
    if (!rawLine.trim()) {
      result.push("");
      continue;
    }

    // Check for block comment start (without end on same line)
    const trimmedRaw = rawLine.trim();
    if (trimmedRaw.startsWith("(*") && !trimmedRaw.includes("*)")) {
      result.push(indent(indentLevel) + trimmedRaw);
      inBlockComment = true;
      continue;
    }

    // Pragma lines - just indent, don't modify
    if (trimmedRaw.startsWith("{")) {
      result.push(indent(indentLevel) + trimmedRaw);
      continue;
    }

    // Split code and comment
    const { code, comment } = splitLineComment(rawLine);
    let formattedCode = code;

    // Apply keyword casing
    if (opts.uppercaseKeywords) {
      formattedCode = applyKeywordCasing(formattedCode);
    }

    // Apply spacing
    formattedCode = applySpacing(formattedCode);

    const trimmedCode = formattedCode.trim();
    if (!trimmedCode && comment) {
      // Comment-only line
      result.push(indent(indentLevel) + comment.trim());
      continue;
    }
    if (!trimmedCode) {
      result.push("");
      continue;
    }

    const upper = trimmedCode.toUpperCase();

    // Determine indent changes
    const decrease = shouldDecreaseIndent(upper);
    const increase = shouldIncreaseIndent(upper);

    // CASE label detection (e.g., "0:", "10, 20:", "ELSE" inside CASE)
    const isCaseLabel = inCase && /^\d+[\d\s,]*:/.test(trimmedCode);

    if (decrease && indentLevel > 0) {
      indentLevel--;
    }

    // Track CASE state
    if (/^CASE\b.*\bOF/i.test(upper)) {
      inCase = true;
    }
    if (/^END_CASE\b/i.test(upper)) {
      inCase = false;
    }

    // Build formatted line
    let currentIndent: string;
    if (isCaseLabel) {
      currentIndent = indent(indentLevel + 1);
    } else {
      currentIndent = indent(indentLevel);
    }

    let formatted = currentIndent + trimmedCode;
    if (comment) {
      formatted += "  " + comment.trim();
    }
    result.push(formatted);

    if (increase) {
      indentLevel++;
    }
  }

  return result.join("\n");
}

// ─── VS Code provider ──────────────────────────────────────────────────────

export class SclFormattingProvider implements vscode.DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions
  ): vscode.TextEdit[] {
    const text = document.getText();
    const formatted = formatScl(text, {
      indentSize: options.tabSize || 4,
      uppercaseKeywords: true,
    });

    if (formatted === text) return [];

    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(text.length)
    );
    return [vscode.TextEdit.replace(fullRange, formatted)];
  }
}
