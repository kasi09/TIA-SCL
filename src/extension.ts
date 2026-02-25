import * as vscode from "vscode";
import { SclCompletionProvider } from "./completionProvider";
import { SclHoverProvider } from "./hoverProvider";
import { SclSignatureHelpProvider } from "./signatureProvider";
import { SclLinter } from "./linter";
import { SclDocumentSymbolProvider } from "./symbolProvider";
import { SclDefinitionProvider } from "./definitionProvider";
import { SclFormattingProvider } from "./formatter";
import { SclCodeActionProvider } from "./quickFixes";

export function activate(context: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = { language: "scl", scheme: "file" };

  // Autocomplete
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      selector,
      new SclCompletionProvider(),
      ".", "#", "%", '"'
    )
  );

  // Hover documentation
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, new SclHoverProvider())
  );

  // Signature help for function calls
  context.subscriptions.push(
    vscode.languages.registerSignatureHelpProvider(
      selector,
      new SclSignatureHelpProvider(),
      "(", ","
    )
  );

  // Document symbols (outline + breadcrumbs)
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(selector, new SclDocumentSymbolProvider())
  );

  // Go to definition (Ctrl+Click / F12)
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, new SclDefinitionProvider())
  );

  // Code formatting (Shift+Alt+F)
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(selector, new SclFormattingProvider())
  );

  // Quick fixes (Ctrl+.)
  context.subscriptions.push(
    vscode.languages.registerCodeActionProvider(selector, new SclCodeActionProvider(), {
      providedCodeActionKinds: SclCodeActionProvider.providedCodeActionKinds,
    })
  );

  // Linter - real-time diagnostics
  new SclLinter(context);
}

export function deactivate() {}
