/**
 * SCL Definition Provider - Go to Definition (Ctrl+Click / F12).
 *
 * Supports:
 *   - #VarName → jump to variable declaration
 *   - "BlockName" → jump to block declaration
 *   - Plain word → fallback match against variable names
 */

import * as vscode from "vscode";
import { parse, VariableDecl, BlockDecl } from "./parser";

export class SclDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Location | undefined {
    const text = document.getText();
    const result = parse(text);
    const line = document.lineAt(position).text;

    // Case 1: #VarName - local variable reference
    const hashRange = document.getWordRangeAtPosition(position, /#[A-Za-z_]\w*/);
    if (hashRange) {
      const varName = document.getText(hashRange).substring(1); // strip '#'
      return this.findVariable(document, result.variables, varName);
    }

    // Case 2: "BlockName" - quoted block reference
    const quoted = this.getQuotedName(line, position.character);
    if (quoted) {
      return this.findBlock(document, result.blocks, quoted);
    }

    // Case 3: Plain word - fallback match against variables
    const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z_]\w*/);
    if (wordRange) {
      const word = document.getText(wordRange);
      return this.findVariable(document, result.variables, word);
    }

    return undefined;
  }

  private findVariable(
    document: vscode.TextDocument,
    variables: VariableDecl[],
    name: string
  ): vscode.Location | undefined {
    const lower = name.toLowerCase();
    const match = variables.find(v => v.name.toLowerCase() === lower);
    if (match) {
      return new vscode.Location(document.uri, new vscode.Position(match.line, match.col));
    }
    return undefined;
  }

  private findBlock(
    document: vscode.TextDocument,
    blocks: BlockDecl[],
    name: string
  ): vscode.Location | undefined {
    const match = blocks.find(b => b.name === name);
    if (match) {
      return new vscode.Location(document.uri, new vscode.Position(match.line, 0));
    }
    return undefined;
  }

  private getQuotedName(line: string, charPos: number): string | undefined {
    // Find the enclosing double quotes around the cursor position
    let start = -1;
    for (let i = charPos; i >= 0; i--) {
      if (line[i] === '"') { start = i; break; }
    }
    if (start < 0) return undefined;

    let end = -1;
    for (let i = Math.max(charPos, start + 1); i < line.length; i++) {
      if (line[i] === '"') { end = i; break; }
    }
    if (end <= start) return undefined;

    return line.substring(start + 1, end);
  }
}
