'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { CompletionItem } from 'vscode';

const SCHEMES = [
  { language: 'typescriptreact', scheme: 'file' },
  { language: 'javascriptreact', scheme: 'file' },
  { language: 'javascript', scheme: 'file' }
];

function getImportPaths(source: string) {
  const reg = /(import\s+|from\s+|require\(\s*)["'](.*?\.(s|pc|sc|c)ss)["']/g;
  let matched: RegExpExecArray | null;
  const paths: string[] = [];
  while ((matched = reg.exec(source))) {
    paths.push(matched[2]);
  }
  return paths;
}

function extractStyleNames(css: string): string[] {
  const reg = /\.(-?[_a-zA-Z]+[_a-zA-Z0-9\-]*)/g;
  let matched: RegExpExecArray | null;
  const styleNames: string[] = [];
  while ((matched = reg.exec(css))) {
    styleNames.push(matched[1]);
  }
  return styleNames.filter((x, i, self) => self.indexOf(x) === i);
}

async function getDefinitionsAsync(document: vscode.TextDocument) {
  return await Promise.all(
    getImportPaths(document.getText()).map(
      importPath =>
        new Promise<{ path: string; styleName: string }[]>(resolve => {
          const fullpath = path.resolve(
            path.dirname(document.uri.fsPath),
            importPath
          );
          fs.readFile(fullpath, (err, body) => {
            if (err) {
              resolve([]);
            } else {
              resolve(
                extractStyleNames(body.toString('utf8')).map(styleName => ({
                  path: fullpath,
                  styleName
                }))
              );
            }
          });
        })
    )
  ).then(pathResults =>
    pathResults.reduce((acc, results) => [...acc, ...results], [])
  );
}

async function provideCompletionItemsWithQuoteAsync(
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<CompletionItem[]> {
  const line = document.getText(document.lineAt(position).range);
  const cursorChar = line[position.character - 1];
  if (cursorChar !== '"' && cursorChar !== "'") return [];
  const propName = document.getText(
    new vscode.Range(
      position.with(undefined, position.character - 11),
      position.with(undefined, position.character - 2)
    )
  );
  if (propName !== 'styleName') return [];
  const definitions = await getDefinitionsAsync(document);
  return definitions.map(
    def => new CompletionItem(def.styleName, vscode.CompletionItemKind.Variable)
  );
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      SCHEMES,
      {
        provideCompletionItems: provideCompletionItemsWithQuoteAsync
      },
      '"',
      "'"
    )
  );
}

export function deactivate() {}
