/**
 * SCL Linter - Orchestrates parsing and rule checking.
 *
 * Provides diagnostics to VS Code with debounce support.
 */

import * as vscode from "vscode";
import { parse } from "./parser";
import { runRules, LintDiagnostic } from "./rules";

export class SclLinter {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly debounceMs = 500;

  constructor(context: vscode.ExtensionContext) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection("scl");
    context.subscriptions.push(this.diagnosticCollection);

    // Lint on save (immediate)
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.languageId === "scl") this.lintDocument(doc);
      })
    );

    // Lint on open (immediate)
    context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        if (doc.languageId === "scl") this.lintDocument(doc);
      })
    );

    // Lint on change (debounced)
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document.languageId === "scl") {
          this.lintDocumentDebounced(event.document);
        }
      })
    );

    // Cleanup on close
    context.subscriptions.push(
      vscode.workspace.onDidCloseTextDocument((doc) => {
        this.diagnosticCollection.delete(doc.uri);
        const key = doc.uri.toString();
        const timer = this.debounceTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          this.debounceTimers.delete(key);
        }
      })
    );

    // Lint all currently open SCL files
    for (const doc of vscode.workspace.textDocuments) {
      if (doc.languageId === "scl") this.lintDocument(doc);
    }
  }

  private lintDocumentDebounced(document: vscode.TextDocument): void {
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

  private lintDocument(document: vscode.TextDocument): void {
    const text = document.getText();
    const lines = text.split(/\r?\n/);

    // Parse
    const parseResult = parse(text);

    // Run rules
    const lintDiags = runRules(parseResult, lines);

    // Convert to VS Code diagnostics
    const diagnostics = lintDiags.map((d) => {
      const lineText = lines[d.line] || "";
      const startCol = d.col;
      const endCol = d.endCol ?? lineText.trimEnd().length;
      const range = new vscode.Range(d.line, startCol, d.line, Math.max(endCol, startCol + 1));

      const diag = new vscode.Diagnostic(range, d.message, d.severity);
      diag.code = d.code;
      diag.source = "SCL";
      return diag;
    });

    this.diagnosticCollection.set(document.uri, diagnostics);
  }
}
