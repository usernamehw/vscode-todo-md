import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../extension';
import type { ContextForProvider } from '../types';

export class ContextTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

	constructor(
		readonly label: string,
		readonly items: LineTreeItem[]
	) {
		super(label);
	}

	get tooltip(): string | undefined {
		return undefined;
	}

	get description(): undefined {
		return undefined;
	}

	contextValue = 'project';
}

class LineTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.None;

	constructor(
		readonly label: string,
		readonly command: vscode.Command
	) {
		super(label);
	}

	get tooltip(): undefined {
		return undefined;
	}

	get description(): undefined {
		return undefined;
	}

	contextValue = 'line';
}

export class ContextProvider implements vscode.TreeDataProvider<ContextTreeItem | LineTreeItem> {
	private readonly _onDidChangeTreeData: vscode.EventEmitter<ContextTreeItem | undefined> = new vscode.EventEmitter<ContextTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<ContextTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private contexts: ContextForProvider[]
	) { }

	refresh(newContexts: ContextForProvider[]): void {
		this.contexts = newContexts;
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: ContextTreeItem | LineTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element: ContextTreeItem | undefined): ContextTreeItem[] | LineTreeItem[] {
		if (element) {
			return element.items;
		} else {
			return this.contexts.map(context => new ContextTreeItem(`${context.context} [${context.items.length}]`, context.items.map(item => new LineTreeItem(
				item.title,
				{
					command: `${EXTENSION_NAME}.goToLine`,
					title: 'Go To Line',
					arguments: [item.lineNumber],
				}
			))));
		}
	}
}
