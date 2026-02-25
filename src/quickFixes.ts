/**
 * SCL Code Action Provider - Quick fixes for linter diagnostics.
 *
 * Provides auto-fix actions for:
 *   SCL102: Add missing VERSION declaration
 *   SCL103: Add missing S7_Optimized_Access pragma
 *   SCL104: Add ELSE branch to CASE statement
 *   SCL201: Rename block with naming convention prefix
 */

import * as vscode from "vscode";

export class SclCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diag of context.diagnostics) {
      if (diag.source !== "SCL") continue;

      switch (diag.code) {
        case "SCL102":
          actions.push(this.fixMissingVersion(document, diag));
          break;
        case "SCL103":
          actions.push(this.fixMissingPragma(document, diag));
          break;
        case "SCL104":
          actions.push(this.fixCaseWithoutElse(document, diag));
          break;
        case "SCL201": {
          const a = this.fixNamingConvention(document, diag);
          if (a) actions.push(a);
          break;
        }
      }
    }

    return actions;
  }

  private fixMissingVersion(
    document: vscode.TextDocument,
    diag: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction("Add VERSION : 0.1", vscode.CodeActionKind.QuickFix);
    action.diagnostics = [diag];
    action.isPreferred = true;

    // Find insert position: after block declaration + any pragma
    const blockLine = diag.range.start.line;
    let insertLine = blockLine + 1;
    for (let i = blockLine + 1; i < Math.min(blockLine + 5, document.lineCount); i++) {
      const trimmed = document.lineAt(i).text.trim();
      if (trimmed.startsWith("{")) {
        insertLine = i + 1;
      } else {
        break;
      }
    }

    const edit = new vscode.WorkspaceEdit();
    edit.insert(document.uri, new vscode.Position(insertLine, 0), "VERSION : 0.1\n");
    action.edit = edit;
    return action;
  }

  private fixMissingPragma(
    document: vscode.TextDocument,
    diag: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      "Add { S7_Optimized_Access := 'TRUE' }",
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diag];
    action.isPreferred = true;

    const blockLine = diag.range.start.line;
    const edit = new vscode.WorkspaceEdit();
    edit.insert(
      document.uri,
      new vscode.Position(blockLine + 1, 0),
      "{ S7_Optimized_Access := 'TRUE' }\n"
    );
    action.edit = edit;
    return action;
  }

  private fixCaseWithoutElse(
    document: vscode.TextDocument,
    diag: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction("Add ELSE branch", vscode.CodeActionKind.QuickFix);
    action.diagnostics = [diag];

    const caseLine = diag.range.start.line;
    const caseIndent = this.getIndent(document, caseLine);
    const endCaseLine = this.findEndCase(document, caseLine);

    const edit = new vscode.WorkspaceEdit();
    edit.insert(
      document.uri,
      new vscode.Position(endCaseLine, 0),
      `${caseIndent}    ELSE\n${caseIndent}        ;\n`
    );
    action.edit = edit;
    return action;
  }

  private fixNamingConvention(
    document: vscode.TextDocument,
    diag: vscode.Diagnostic
  ): vscode.CodeAction | undefined {
    const line = document.lineAt(diag.range.start.line).text;
    const nameMatch = line.match(/"([^"]+)"/);
    if (!nameMatch) return undefined;
    const currentName = nameMatch[1];

    // Extract expected prefix from message
    const prefixMatch = diag.message.match(/'([A-Z]+_)\.\.\.'$/);
    if (!prefixMatch) return undefined;
    const prefix = prefixMatch[1];
    const newName = prefix + currentName;

    const action = new vscode.CodeAction(
      `Rename to "${newName}"`,
      vscode.CodeActionKind.QuickFix
    );
    action.diagnostics = [diag];

    const edit = new vscode.WorkspaceEdit();
    const fullText = document.getText();
    const escaped = currentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`"${escaped}"`, "g");
    let match;
    while ((match = regex.exec(fullText)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      edit.replace(document.uri, new vscode.Range(startPos, endPos), `"${newName}"`);
    }
    action.edit = edit;
    return action;
  }

  private findEndCase(document: vscode.TextDocument, caseLine: number): number {
    let depth = 0;
    for (let i = caseLine; i < document.lineCount; i++) {
      const upper = document.lineAt(i).text.trim().toUpperCase();
      if (/^CASE\b/.test(upper)) depth++;
      if (/^END_CASE\b/.test(upper)) {
        depth--;
        if (depth === 0) return i;
      }
    }
    return caseLine;
  }

  private getIndent(document: vscode.TextDocument, line: number): string {
    const match = document.lineAt(line).text.match(/^(\s*)/);
    return match ? match[1] : "";
  }
}
