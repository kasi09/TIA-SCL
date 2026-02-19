import * as vscode from "vscode";
import { SYSTEM_FUNCTIONS, SclFunction } from "./sclData";

export class SclSignatureHelpProvider implements vscode.SignatureHelpProvider {
  private fnLookup: Map<string, SclFunction>;

  constructor() {
    this.fnLookup = new Map();
    for (const fn of SYSTEM_FUNCTIONS) {
      this.fnLookup.set(fn.label.toUpperCase(), fn);
    }
  }

  provideSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.SignatureHelp | undefined {
    const line = document.lineAt(position).text;
    const textBefore = line.substring(0, position.character);

    // Find the function name before the opening parenthesis
    // Walk backwards to find the matching '('
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

    if (parenPos < 0) return undefined;

    // Extract function name before the '('
    const beforeParen = textBefore.substring(0, parenPos).trimEnd();
    const fnMatch = beforeParen.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
    if (!fnMatch) return undefined;

    const fnName = fnMatch[1].toUpperCase();
    const fn = this.fnLookup.get(fnName);
    if (!fn || fn.parameters.length === 0) return undefined;

    const sig = new vscode.SignatureInformation(
      `${fn.label}(${fn.parameters.map((p) => p.label).join(", ")}) : ${fn.returnType}`,
      new vscode.MarkdownString(fn.documentation)
    );

    for (const param of fn.parameters) {
      sig.parameters.push(
        new vscode.ParameterInformation(param.label, new vscode.MarkdownString(param.documentation))
      );
    }

    const help = new vscode.SignatureHelp();
    help.signatures = [sig];
    help.activeSignature = 0;
    help.activeParameter = Math.min(commaCount, fn.parameters.length - 1);

    return help;
  }
}
