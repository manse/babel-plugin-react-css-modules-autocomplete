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

const QUOTES = ['"', "'", '`'];

export function getImportPaths(source: string) {
  const reg = /(import\s+|from\s+|require\(\s*)["'](.*?\.(s|pc|sc|c)ss)["']/g;
  let matched: RegExpExecArray | null;
  const paths: string[] = [];
  while ((matched = reg.exec(source))) {
    paths.push(matched[2]);
  }
  return paths;
}

export function getAllStyleName(css: string): string[] {
  const reg = /\.(-?[_a-zA-Z]+[_a-zA-Z0-9\-]*)([\w/:%#\$&\?\(\)~\.=\+\-]*[\s"']*?\))?/g;
  let matched: RegExpExecArray | null;
  const styleNames: string[] = [];
  while ((matched = reg.exec(css))) {
    !matched[2] && styleNames.push(matched[1]);
  }
  return styleNames.filter((x, i, self) => self.indexOf(x) === i);
}

export function isStyleNameValue(target: string) {
  const propNamePosition = target.lastIndexOf('=');
  if (propNamePosition === -1) return false;
  return target.substr(propNamePosition - 9, 9) === 'styleName';
}

export function getNearestBeginningQuote(target: string) {
  const result = QUOTES.map(quote => ({
    position: target.lastIndexOf(quote),
    quote
  })).sort((a, b) => (a.position < b.position ? 1 : -1))[0];
  if (result.position === -1) return null;
  return result.quote;
}

export function isInsideString(target: string, char?: string) {
  const propValuePosition = target.lastIndexOf('=');
  if (propValuePosition === -1) return false;
  const test = target.substr(propValuePosition);
  const quote = char || getNearestBeginningQuote(test);
  if (!quote) return false;
  const hits = test.split(quote).length;
  return hits >= 2 && hits % 2 === 0;
}

export function getStyleNames(target: string): string[] {
  const propNamePosition = target.lastIndexOf('=');
  if (propNamePosition === -1) return [];
  return target.substr(propNamePosition).match(/-?[_a-zA-Z]+[_a-zA-Z0-9\-]*/g) || [];
}

export async function getDefinitionsAsync(document: vscode.TextDocument) {
  return await Promise.all(
    getImportPaths(document.getText()).map(
      importPath =>
        new Promise<{ path: string; styleName: string }[]>(resolve => {
          const fullpath = path.resolve(path.dirname(document.uri.fsPath), importPath);
          fs.readFile(fullpath, (err, body) =>
            resolve(
              err
                ? []
                : getAllStyleName(body.toString('utf8')).map(styleName => ({
                    path: fullpath,
                    styleName
                  }))
            )
          );
        })
    )
  ).then(pathResults => pathResults.reduce((acc, results) => [...acc, ...results], []));
}

export async function provideCompletionItemsWithQuoteAsync(
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<CompletionItem[]> {
  const line = document.getText(document.lineAt(position).range);
  const cursorChar = line[position.character - 1];
  if (cursorChar !== '"' && cursorChar !== "'" && cursorChar !== '`') return [];
  const target = line.substr(0, position.character);
  if (!isStyleNameValue(target) || !isInsideString(target, cursorChar)) return [];
  const definitions = await getDefinitionsAsync(document);
  const styleNames = getStyleNames(target);
  return definitions
    .filter(def => styleNames.indexOf(def.styleName) === -1)
    .map(def => new CompletionItem(def.styleName, vscode.CompletionItemKind.Variable));
}

async function provideCompletionItemsWithSpaceAsync(
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<CompletionItem[]> {
  const line = document.getText(document.lineAt(position).range);
  if (line[position.character - 1] !== ' ') return [];
  const target = line.substr(0, position.character);
  if (!isStyleNameValue(target) || !isInsideString(target)) return [];
  const definitions = await getDefinitionsAsync(document);
  const styleNames = getStyleNames(target);
  return definitions
    .filter(def => styleNames.indexOf(def.styleName) === -1)
    .map(def => new CompletionItem(def.styleName, vscode.CompletionItemKind.Variable));
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      SCHEMES,
      {
        provideCompletionItems: provideCompletionItemsWithQuoteAsync
      },
      '"',
      "'",
      '`'
    )
  );
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      SCHEMES,
      {
        provideCompletionItems: provideCompletionItemsWithSpaceAsync
      },
      ' '
    )
  );
}

export function deactivate() {}
