import * as vscode from "vscode";
import {
  BLOCK_KEYWORDS,
  VAR_KEYWORDS,
  CONTROL_KEYWORDS,
  OTHER_KEYWORDS,
  DATA_TYPES,
  SYSTEM_FUNCTIONS,
  PRAGMAS,
  SclItem,
  SclFunction,
} from "./sclData";

export class SclCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.CompletionItem[] {
    const line = document.lineAt(position).text;
    const prefix = line.substring(0, position.character);
    const items: vscode.CompletionItem[] = [];

    // After '#' -> suggest local variables from the current block
    if (context.triggerCharacter === "#" || prefix.endsWith("#")) {
      items.push(...this.getLocalVariables(document));
      return items;
    }

    // After '%' -> suggest address patterns
    if (context.triggerCharacter === "%" || prefix.endsWith("%")) {
      items.push(...this.getAddressCompletions());
      return items;
    }

    // After '"' -> suggest DB/block names from the document
    if (context.triggerCharacter === '"') {
      items.push(...this.getBlockReferences(document));
      return items;
    }

    // After '.' -> suggest struct members or timer/counter outputs
    if (context.triggerCharacter === ".") {
      items.push(...this.getDotCompletions(prefix));
      return items;
    }

    // Check if we're in a variable declaration context (after ':')
    if (prefix.match(/:\s*\w*$/)) {
      items.push(...this.makeItems(DATA_TYPES, vscode.CompletionItemKind.TypeParameter));
      return items;
    }

    // General completions
    items.push(...this.makeItems(BLOCK_KEYWORDS, vscode.CompletionItemKind.Keyword));
    items.push(...this.makeItems(VAR_KEYWORDS, vscode.CompletionItemKind.Keyword));
    items.push(...this.makeItems(CONTROL_KEYWORDS, vscode.CompletionItemKind.Keyword));
    items.push(...this.makeItems(OTHER_KEYWORDS, vscode.CompletionItemKind.Keyword));
    items.push(...this.makeItems(DATA_TYPES, vscode.CompletionItemKind.TypeParameter));
    items.push(...this.makeFunctionItems(SYSTEM_FUNCTIONS));

    return items;
  }

  private makeItems(data: SclItem[], kind: vscode.CompletionItemKind): vscode.CompletionItem[] {
    return data.map((item) => {
      const ci = new vscode.CompletionItem(item.label, kind);
      ci.detail = item.detail;
      ci.documentation = new vscode.MarkdownString(item.documentation);
      if (item.insertText) {
        ci.insertText = new vscode.SnippetString(item.insertText);
      }
      return ci;
    });
  }

  private makeFunctionItems(data: SclFunction[]): vscode.CompletionItem[] {
    return data.map((fn) => {
      const ci = new vscode.CompletionItem(fn.label, vscode.CompletionItemKind.Function);
      ci.detail = `${fn.detail} → ${fn.returnType}`;
      const params = fn.parameters.map((p) => p.label).join(", ");
      ci.documentation = new vscode.MarkdownString(
        `${fn.documentation}\n\n**Syntax:** \`${fn.label}(${params})\` → \`${fn.returnType}\``
      );
      if (fn.insertText) {
        ci.insertText = new vscode.SnippetString(fn.insertText);
      } else if (fn.parameters.length > 0) {
        // Auto-generate snippet with parameters
        const paramSnippets = fn.parameters.map((p, i) => `\${${i + 1}:${p.label.split(":")[0].trim()}}`);
        ci.insertText = new vscode.SnippetString(`${fn.label}(${paramSnippets.join(", ")})`);
      }
      return ci;
    });
  }

  private getLocalVariables(document: vscode.TextDocument): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    const seen = new Set<string>();
    const text = document.getText();

    // Find all variable declarations in VAR sections
    const varRegex = /^\s+(\w+)\s*:\s*([\w"\[\].]+)/gm;
    let match;
    while ((match = varRegex.exec(text)) !== null) {
      const name = match[1];
      const type = match[2];
      if (!seen.has(name) && !["END_VAR", "END_STRUCT", "STRUCT"].includes(name)) {
        seen.add(name);
        const ci = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
        ci.detail = type;
        ci.documentation = `Local variable: ${name} : ${type}`;
        items.push(ci);
      }
    }
    return items;
  }

  private getAddressCompletions(): vscode.CompletionItem[] {
    const addresses = [
      { label: "I", detail: "Input bit", documentation: "Digital input. Example: %I0.0", insertText: "I${1:0}.${2:0}" },
      { label: "IB", detail: "Input byte", documentation: "Input byte. Example: %IB0", insertText: "IB${1:0}" },
      { label: "IW", detail: "Input word", documentation: "Input word (16 bit). Example: %IW64", insertText: "IW${1:64}" },
      { label: "ID", detail: "Input double word", documentation: "Input double word (32 bit). Example: %ID68", insertText: "ID${1:68}" },
      { label: "Q", detail: "Output bit", documentation: "Digital output. Example: %Q0.0", insertText: "Q${1:0}.${2:0}" },
      { label: "QB", detail: "Output byte", documentation: "Output byte. Example: %QB0", insertText: "QB${1:0}" },
      { label: "QW", detail: "Output word", documentation: "Output word. Example: %QW80", insertText: "QW${1:80}" },
      { label: "QD", detail: "Output double word", documentation: "Output double word. Example: %QD84", insertText: "QD${1:84}" },
      { label: "M", detail: "Memory bit", documentation: "Memory bit (Merker). Example: %M0.0", insertText: "M${1:0}.${2:0}" },
      { label: "MB", detail: "Memory byte", documentation: "Memory byte. Example: %MB100", insertText: "MB${1:100}" },
      { label: "MW", detail: "Memory word", documentation: "Memory word. Example: %MW100", insertText: "MW${1:100}" },
      { label: "MD", detail: "Memory double word", documentation: "Memory double word. Example: %MD200", insertText: "MD${1:200}" },
    ];
    return addresses.map((a) => {
      const ci = new vscode.CompletionItem(a.label, vscode.CompletionItemKind.Reference);
      ci.detail = a.detail;
      ci.documentation = new vscode.MarkdownString(a.documentation);
      ci.insertText = new vscode.SnippetString(a.insertText);
      return ci;
    });
  }

  private getBlockReferences(document: vscode.TextDocument): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    const seen = new Set<string>();
    const text = document.getText();

    // Find all block names in the document
    const blockRegex = /(?:FUNCTION_BLOCK|FUNCTION|DATA_BLOCK|ORGANIZATION_BLOCK|TYPE)\s+"([^"]+)"/g;
    let match;
    while ((match = blockRegex.exec(text)) !== null) {
      const name = match[1];
      if (!seen.has(name)) {
        seen.add(name);
        const ci = new vscode.CompletionItem(name, vscode.CompletionItemKind.Module);
        ci.detail = "Block reference";
        items.push(ci);
      }
    }

    // Also find UDT references used in variable declarations
    const udtRegex = /"([^"]+)"/g;
    while ((match = udtRegex.exec(text)) !== null) {
      const name = match[1];
      if (!seen.has(name)) {
        seen.add(name);
        const ci = new vscode.CompletionItem(name, vscode.CompletionItemKind.Module);
        ci.detail = "Reference";
        items.push(ci);
      }
    }
    return items;
  }

  private getDotCompletions(prefix: string): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];

    // Timer outputs
    const timerOutputs = [
      { label: "Q", detail: "Bool", documentation: "Timer/Counter output (done/reached)" },
      { label: "ET", detail: "Time", documentation: "Elapsed time" },
      { label: "CV", detail: "Int", documentation: "Counter current value" },
      { label: "IN", detail: "Bool", documentation: "Timer/Counter input" },
      { label: "PT", detail: "Time", documentation: "Preset time" },
      { label: "PV", detail: "Int", documentation: "Preset value (counter)" },
    ];

    for (const out of timerOutputs) {
      const ci = new vscode.CompletionItem(out.label, vscode.CompletionItemKind.Property);
      ci.detail = out.detail;
      ci.documentation = out.documentation;
      items.push(ci);
    }

    return items;
  }
}
