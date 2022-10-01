import * as vscode from 'vscode';

import CombyResultsDataProvider, { MatchTreeItem } from './comby_results_data_provider';
import { getCombyLanguage } from './utils';

export function activate(context: vscode.ExtensionContext) {
	let dataProvider = new CombyResultsDataProvider();

	let lastSearchedCommand: string|undefined;
	let disposable = vscode.commands.registerCommand('comby-search.startSearch', () => {
		vscode.window.showInputBox({
			title: "Enter Comby Search",
			value: lastSearchedCommand
		}).then((res) => {
			vscode.window.activeTextEditor?.document.fileName

			if (res) {
				vscode.window.withProgress(
					{ 
						location: vscode.ProgressLocation.Notification,
						title: 'Running Comby Search'
					}, 
					async (progress) => {
						await dataProvider.runCombySearch(res, getCombyLanguage());
						lastSearchedCommand = res;
					}
				);
			}
		})
	});

	vscode.commands.registerCommand('comby-search.gotoMatch', (node: MatchTreeItem) => {
		const path = vscode.Uri.file(node.filePath)

		const start = node.match.range.start;
		const end = node.match.range.end;
		vscode.window.showTextDocument(
			path,
			{ 
				selection: new vscode.Range(
					new vscode.Position(start.line-1, start.column-1),
					new vscode.Position(end.line-1, end.column-1),
				)
			}
		)
	});

	vscode.window.registerTreeDataProvider('comby-search-view', dataProvider)

	context.subscriptions.push(disposable);
	// context.subscriptions.push(disposable2);
}

// this method is called when your extension is deactivated
export function deactivate() {}
