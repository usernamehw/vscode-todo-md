import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../extension';
import type { TagForProvider } from '../types';

export class TagTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
	iconPath = vscode.ThemeIcon.Folder;

	constructor(
		readonly label: string,
		readonly items: LineTreeItem[]
	) {
		super(label);
	}

	get tooltip(): undefined {
		return undefined;
	}

	get description(): undefined {
		return undefined;
	}

	contextValue = 'tag';
}
export class LineTreeItem extends vscode.TreeItem {
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

export class TagProvider implements vscode.TreeDataProvider<TagTreeItem | LineTreeItem> {
	private readonly _onDidChangeTreeData: vscode.EventEmitter<TagTreeItem | undefined> = new vscode.EventEmitter<TagTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TagTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private tags: TagForProvider[]
	) { }

	refresh(newTags: TagForProvider[]): void {
		this.tags = newTags;
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: TagTreeItem | LineTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element: TagTreeItem | undefined): TagTreeItem[] | LineTreeItem[] {
		if (element) {
			return element.items;
		} else {
			return this.tags.map(tag => new TagTreeItem(`${tag.tag} [${tag.items.length}]`, tag.items.map(item => new LineTreeItem(
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
