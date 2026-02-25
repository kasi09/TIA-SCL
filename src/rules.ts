/**
 * SCL Lint Rules - All diagnostic checks.
 *
 * Error codes:
 *   SCL001-SCL099: Errors (red)
 *   SCL101-SCL199: Warnings (yellow)
 *   SCL201-SCL299: Hints (grey)
 */

import * as vscode from "vscode";
import { ParseResult } from "./parser";

export interface LintDiagnostic {
  line: number;
  col: number;
  endCol?: number;
  message: string;
  severity: vscode.DiagnosticSeverity;
  code: string;
}

// ─── Run all rules ──────────────────────────────────────────────────────────

export function runRules(result: ParseResult): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];

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

// ─── SCL001: Unmatched control flow ─────────────────────────────────────────

function ruleUnmatchedControlFlow(result: ParseResult): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  // Unmatched opens (e.g. IF without END_IF)
  for (const entry of result.unmatchedOpens) {
    // Only control flow keywords (not blocks/vars - those have their own rules)
    if (["IF", "FOR", "WHILE", "REPEAT", "CASE", "REGION"].includes(entry.keyword)) {
      diags.push({
        line: entry.line,
        col: 0,
        message: `'${entry.keyword}' has no matching 'END_${entry.keyword}'`,
        severity: vscode.DiagnosticSeverity.Error,
        code: "SCL001",
      });
    }
  }

  // Unmatched closes (e.g. END_IF without IF)
  for (const entry of result.unmatchedCloses) {
    if (entry.keyword.startsWith("END_") && !entry.keyword.startsWith("END_FUNCTION") &&
        !entry.keyword.startsWith("END_DATA") && !entry.keyword.startsWith("END_ORGANIZATION") &&
        !entry.keyword.startsWith("END_TYPE") && entry.keyword !== "END_VAR" &&
        entry.keyword !== "END_STRUCT") {
      const openKw = entry.keyword.replace("END_", "");
      diags.push({
        line: entry.line,
        col: 0,
        message: `'${entry.keyword}' without matching '${openKw}'`,
        severity: vscode.DiagnosticSeverity.Error,
        code: "SCL001",
      });
    }
  }

  return diags;
}

// ─── SCL002: Unmatched VAR sections ─────────────────────────────────────────

function ruleUnmatchedVarSections(result: ParseResult): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  for (const entry of result.unmatchedOpens) {
    if (entry.keyword.startsWith("VAR") || entry.keyword === "STRUCT") {
      const endKw = entry.keyword === "STRUCT" ? "END_STRUCT" : "END_VAR";
      diags.push({
        line: entry.line,
        col: 0,
        message: `'${entry.keyword}' has no matching '${endKw}'`,
        severity: vscode.DiagnosticSeverity.Error,
        code: "SCL002",
      });
    }
  }

  for (const entry of result.unmatchedCloses) {
    if (entry.keyword === "END_VAR" || entry.keyword === "END_STRUCT") {
      diags.push({
        line: entry.line,
        col: 0,
        message: `'${entry.keyword}' without matching opening declaration`,
        severity: vscode.DiagnosticSeverity.Error,
        code: "SCL002",
      });
    }
  }

  return diags;
}

// ─── SCL003: Unmatched block declarations ───────────────────────────────────

function ruleUnmatchedBlocks(result: ParseResult): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  for (const entry of result.unmatchedOpens) {
    if (["FUNCTION_BLOCK", "FUNCTION", "ORGANIZATION_BLOCK", "DATA_BLOCK", "TYPE"].includes(entry.keyword)) {
      diags.push({
        line: entry.line,
        col: 0,
        message: `'${entry.keyword}' has no matching 'END_${entry.keyword}'`,
        severity: vscode.DiagnosticSeverity.Error,
        code: "SCL003",
      });
    }
  }

  for (const entry of result.unmatchedCloses) {
    if (["END_FUNCTION_BLOCK", "END_FUNCTION", "END_ORGANIZATION_BLOCK", "END_DATA_BLOCK", "END_TYPE"].includes(entry.keyword)) {
      diags.push({
        line: entry.line,
        col: 0,
        message: `'${entry.keyword}' without matching block declaration`,
        severity: vscode.DiagnosticSeverity.Error,
        code: "SCL003",
      });
    }
  }

  return diags;
}

// ─── SCL004: Duplicate variable names ───────────────────────────────────────

function ruleDuplicateVariables(result: ParseResult): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  // Group by block
  const byBlock = new Map<string, Map<string, { line: number; col: number }[]>>();
  for (const v of result.variables) {
    const key = v.block;
    if (!byBlock.has(key)) byBlock.set(key, new Map());
    const blockVars = byBlock.get(key)!;
    const lower = v.name.toLowerCase();
    if (!blockVars.has(lower)) blockVars.set(lower, []);
    blockVars.get(lower)!.push({ line: v.line, col: v.col });
  }

  for (const [, blockVars] of byBlock) {
    for (const [name, locations] of blockVars) {
      if (locations.length > 1) {
        // Mark all duplicates after the first
        for (let i = 1; i < locations.length; i++) {
          diags.push({
            line: locations[i].line,
            col: locations[i].col,
            message: `Duplicate variable '${name}' (first declared on line ${locations[0].line + 1})`,
            severity: vscode.DiagnosticSeverity.Error,
            code: "SCL004",
          });
        }
      }
    }
  }

  return diags;
}

// ─── SCL005: EXIT/CONTINUE outside loop ─────────────────────────────────────

function ruleExitOutsideLoop(result: ParseResult): LintDiagnostic[] {
  return result.exitOutsideLoop.map(entry => ({
    line: entry.line,
    col: 0,
    message: `'${entry.keyword}' used outside of a FOR/WHILE/REPEAT loop`,
    severity: vscode.DiagnosticSeverity.Error,
    code: "SCL005",
  }));
}

// ─── SCL101: Unused variables ───────────────────────────────────────────────

function ruleUnusedVariables(result: ParseResult): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  for (const v of result.variables) {
    // Skip variables in DATA_BLOCK and TYPE (they're data, not code)
    const block = result.blocks.find(b => b.name === v.block);
    if (block && (block.type === "DATA_BLOCK" || block.type === "TYPE")) continue;

    // Skip VAR_OUTPUT (they may be set but not read internally)
    if (v.section === "VAR_OUTPUT") continue;

    const lower = v.name.toLowerCase();
    if (!result.usedVariables.has(lower)) {
      diags.push({
        line: v.line,
        col: v.col,
        message: `Variable '${v.name}' is declared but never used`,
        severity: vscode.DiagnosticSeverity.Warning,
        code: "SCL101",
      });
    }
  }

  return diags;
}

// ─── SCL102: Missing VERSION ────────────────────────────────────────────────

function ruleMissingVersion(result: ParseResult): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  for (const block of result.blocks) {
    if (!block.hasVersion) {
      diags.push({
        line: block.line,
        col: 0,
        message: `Block '${block.name || block.type}' has no VERSION declaration`,
        severity: vscode.DiagnosticSeverity.Warning,
        code: "SCL102",
      });
    }
  }

  return diags;
}

// ─── SCL103: Missing S7_Optimized_Access pragma ─────────────────────────────

function ruleMissingPragma(result: ParseResult): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  for (const block of result.blocks) {
    // TYPE/UDT don't need pragma
    if (block.type === "TYPE") continue;

    if (!block.hasPragma) {
      diags.push({
        line: block.line,
        col: 0,
        message: `Block '${block.name || block.type}' has no { S7_Optimized_Access } pragma`,
        severity: vscode.DiagnosticSeverity.Warning,
        code: "SCL103",
      });
    }
  }

  return diags;
}

// ─── SCL104: CASE without ELSE ──────────────────────────────────────────────

function ruleCaseWithoutElse(result: ParseResult): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  for (const block of result.blocks) {
    for (const [caseLine, hasElse] of block.hasCaseElse) {
      if (!hasElse) {
        diags.push({
          line: caseLine,
          col: 0,
          message: "CASE statement has no ELSE branch",
          severity: vscode.DiagnosticSeverity.Warning,
          code: "SCL104",
        });
      }
    }
  }

  return diags;
}

// ─── SCL105: Empty block ────────────────────────────────────────────────────

function ruleEmptyBlock(result: ParseResult): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  for (const block of result.blocks) {
    // DATA_BLOCK and TYPE don't need code after BEGIN
    if (block.type === "DATA_BLOCK" || block.type === "TYPE") continue;

    if (block.hasBegin && !block.hasCode) {
      diags.push({
        line: block.line,
        col: 0,
        message: `Block '${block.name || block.type}' has an empty BEGIN section`,
        severity: vscode.DiagnosticSeverity.Warning,
        code: "SCL105",
      });
    }
  }

  return diags;
}

// ─── SCL201: Naming convention ──────────────────────────────────────────────

function ruleNamingConvention(result: ParseResult): LintDiagnostic[] {
  const diags: LintDiagnostic[] = [];

  const prefixMap: Record<string, string> = {
    "FUNCTION_BLOCK": "FB_",
    "FUNCTION": "FC_",
    "DATA_BLOCK": "DB_",
  };

  for (const block of result.blocks) {
    const expected = prefixMap[block.type];
    if (expected && block.name && !block.name.startsWith(expected) && !block.name.startsWith("UDT_")) {
      diags.push({
        line: block.line,
        col: 0,
        message: `Block '${block.name}' does not follow naming convention '${expected}...'`,
        severity: vscode.DiagnosticSeverity.Hint,
        code: "SCL201",
      });
    }
  }

  return diags;
}
