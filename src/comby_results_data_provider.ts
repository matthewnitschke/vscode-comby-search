import * as vscode from 'vscode';
import { basename } from 'path';
import { ChildProcess, exec, ExecException } from "child_process";

export default class CombyResultsDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  data: vscode.TreeItem[];

  constructor() {
    this.data = [];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async runCombySearch(combyStr: string) {
    if (vscode.workspace.workspaceFolders) {
      this.data = []
      this.refresh();

      let folder = vscode.workspace.workspaceFolders[0].uri.path;
      let res = await this.createSearchProcess(combyStr, folder);

      let lines = res.trim().split('\n');

      let output: CombyFileMatch[] = lines.map((line) => JSON.parse(line));
      
      this.data = [
        new CommandTreeItem(combyStr),

        ...output.map((fileMatch) => new FileTreeItem(
          fileMatch.uri,
          fileMatch.matches.map((lineMatch) => new MatchTreeItem(
            fileMatch.uri,
            lineMatch
          ))
        ))
      ];

      this.refresh()
    }
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: FileTreeItem|undefined): vscode.ProviderResult<vscode.TreeItem[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }

  private createSearchProcess(queryString: string, dir: string): Promise<string> {
    const executable = 'comby';
    const params = [
      `'${queryString}'`,
      `''`, 
      '-json-lines',
      '-matcher .dart', // TODO: implement specific language
      '-match-only',
      '-d', dir
    ];
    const command = `${executable} ${params.join(" ")}`;

    return new Promise((acc, rej) => {
      exec(command, (err, stdout) => {
        if (err) rej(err);
        acc(stdout);
      });
    })
  }
}

class CommandTreeItem extends vscode.TreeItem {
  constructor(combyCommand: string) {
    super(combyCommand, vscode.TreeItemCollapsibleState.Collapsed)
  }

  children = [
    new EditCommandTreeItem()
  ]

  iconPath = new vscode.ThemeIcon("terminal")
}

class EditCommandTreeItem extends vscode.TreeItem {
  constructor() {
    super('Edit Command', vscode.TreeItemCollapsibleState.None)
  }

  command = {
    command: 'comby-search.startSearch',
    arguments: [this],
    title: 'Search'
  };

  iconPath = new vscode.ThemeIcon("edit")
}

class FileTreeItem extends vscode.TreeItem {
  children: MatchTreeItem[]|undefined;

  constructor(filePath: string, children?: MatchTreeItem[]) {
    super(vscode.Uri.file(filePath), children === undefined ? vscode.TreeItemCollapsibleState.None :
      vscode.TreeItemCollapsibleState.Expanded);

    this.children = children;
  }

  iconPath = vscode.ThemeIcon.File;
}

export class MatchTreeItem extends vscode.TreeItem {
  command = {
    command: 'comby-search.gotoMatch',
    arguments: [this],
    title: 'Open'
  };

  filePath: string;
  match: CombyMatch;

  constructor(filePath: string, match: CombyMatch) {
    super(
      match.matched,
      vscode.TreeItemCollapsibleState.None,
    );

    this.match = match;
    this.filePath = filePath;
  }
}

interface CombyFileMatch {
  uri: string,
  matches: CombyMatch[]
}

interface CombyMatch {
  range: {
    start: CombyMatchRange,
    end: CombyMatchRange
  },
  matched: string,
}

interface CombyMatchRange {
  offset: number,
  line: number,
  column: number
}