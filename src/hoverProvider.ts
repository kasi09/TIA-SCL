import * as vscode from "vscode";
import {
  BLOCK_KEYWORDS,
  VAR_KEYWORDS,
  CONTROL_KEYWORDS,
  OTHER_KEYWORDS,
  DATA_TYPES,
  SYSTEM_FUNCTIONS,
  SclItem,
  SclFunction,
} from "./sclData";

export class SclHoverProvider implements vscode.HoverProvider {
  private lookup: Map<string, SclItem | SclFunction>;

  constructor() {
    this.lookup = new Map();
    const allItems: SclItem[] = [
      ...BLOCK_KEYWORDS,
      ...VAR_KEYWORDS,
      ...CONTROL_KEYWORDS,
      ...OTHER_KEYWORDS,
      ...DATA_TYPES,
    ];
    for (const item of allItems) {
      this.lookup.set(item.label.toUpperCase(), item);
    }
    for (const fn of SYSTEM_FUNCTIONS) {
      this.lookup.set(fn.label.toUpperCase(), fn);
    }
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Hover | undefined {
    const range = document.getWordRangeAtPosition(position, /[A-Za-z_][A-Za-z0-9_]*/);
    if (!range) return undefined;

    const word = document.getText(range).toUpperCase();
    const item = this.lookup.get(word);
    if (!item) return undefined;

    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    if ("parameters" in item) {
      // It's a function
      const fn = item as SclFunction;
      const params = fn.parameters.map((p) => p.label).join(", ");
      md.appendCodeblock(`${fn.label}(${params}) : ${fn.returnType}`, "scl");
      md.appendMarkdown(`\n\n${fn.documentation}`);
      if (fn.parameters.length > 0) {
        md.appendMarkdown("\n\n**Parameters:**\n");
        for (const p of fn.parameters) {
          md.appendMarkdown(`- \`${p.label}\` - ${p.documentation}\n`);
        }
      }
    } else {
      md.appendCodeblock(item.label, "scl");
      md.appendMarkdown(`\n\n*${item.detail}*\n\n${item.documentation}`);
    }

    return new vscode.Hover(md, range);
  }
}
