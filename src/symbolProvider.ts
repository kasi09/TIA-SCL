/**
 * SCL Document Symbol Provider - Outline view and breadcrumbs.
 *
 * Provides hierarchical document symbols:
 *   Block → VAR section → Variable
 */

import * as vscode from "vscode";
import { parse, BlockDecl, VariableDecl } from "./parser";

export class SclDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(
    document: vscode.TextDocument
  ): vscode.DocumentSymbol[] {
    const text = document.getText();
    const result = parse(text);
    const symbols: vscode.DocumentSymbol[] = [];

    for (const block of result.blocks) {
      const endLine = block.endLine >= 0 ? block.endLine : block.line;
      const blockRange = new vscode.Range(block.line, 0, endLine, document.lineAt(endLine).text.length);
      const selRange = new vscode.Range(block.line, 0, block.line, document.lineAt(block.line).text.length);

      const blockSymbol = new vscode.DocumentSymbol(
        block.name || block.type,
        block.type.replace(/_/g, " "),
        blockKind(block.type),
        blockRange,
        selRange
      );

      // Group variables by section
      const blockVars = result.variables.filter(v => v.block === block.name);
      const sections = new Map<string, VariableDecl[]>();
      for (const v of blockVars) {
        if (!sections.has(v.section)) sections.set(v.section, []);
        sections.get(v.section)!.push(v);
      }

      for (const [sectionName, vars] of sections) {
        const firstVar = vars[0];
        const lastVar = vars[vars.length - 1];
        // Section range: from first var line - 1 (section header) to last var line + 1 (END_VAR)
        const secStart = Math.max(firstVar.line - 1, block.line);
        const secEnd = Math.min(lastVar.line + 1, endLine);
        const secRange = new vscode.Range(secStart, 0, secEnd, 0);
        const secSelRange = new vscode.Range(secStart, 0, secStart, sectionName.length);

        const sectionSymbol = new vscode.DocumentSymbol(
          sectionName,
          `${vars.length} variable(s)`,
          vscode.SymbolKind.Namespace,
          secRange,
          secSelRange
        );

        for (const v of vars) {
          const varLine = document.lineAt(v.line).text;
          const varRange = new vscode.Range(v.line, 0, v.line, varLine.length);
          const varSelRange = new vscode.Range(v.line, v.col, v.line, v.col + v.name.length);

          sectionSymbol.children.push(
            new vscode.DocumentSymbol(
              v.name,
              v.type,
              varKind(v.section),
              varRange,
              varSelRange
            )
          );
        }

        blockSymbol.children.push(sectionSymbol);
      }

      symbols.push(blockSymbol);
    }

    return symbols;
  }
}

function blockKind(type: string): vscode.SymbolKind {
  switch (type) {
    case "FUNCTION_BLOCK": return vscode.SymbolKind.Class;
    case "FUNCTION": return vscode.SymbolKind.Function;
    case "ORGANIZATION_BLOCK": return vscode.SymbolKind.Event;
    case "DATA_BLOCK": return vscode.SymbolKind.Struct;
    case "TYPE": return vscode.SymbolKind.Struct;
    default: return vscode.SymbolKind.Module;
  }
}

function varKind(section: string): vscode.SymbolKind {
  switch (section) {
    case "VAR_INPUT": return vscode.SymbolKind.Property;
    case "VAR_OUTPUT": return vscode.SymbolKind.Property;
    case "VAR_IN_OUT": return vscode.SymbolKind.Property;
    default: return vscode.SymbolKind.Variable;
  }
}
