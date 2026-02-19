import * as vscode from "vscode";
import { SclCompletionProvider } from "./completionProvider";
import { SclHoverProvider } from "./hoverProvider";
import { SclSignatureHelpProvider } from "./signatureProvider";

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
}

export function deactivate() {}
