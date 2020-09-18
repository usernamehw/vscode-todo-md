import { EXTENSION_NAME } from 'src/extension';
import { ItemForProvider } from 'src/types';
import vscode from 'vscode';

export class TagTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

	constructor(
		readonly label: string,
		readonly items: LineTreeItem[],
	) {
		super(label);
	}
	// @ts-ignore
	get tooltip(): undefined {
		return undefined;
	}
	// @ts-ignore
	get description(): undefined {
		return undefined;
	}

	contextValue = 'tag';
}
export class LineTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.None;

	constructor(
		readonly label: string,
		readonly command: vscode.Command,
	) {
		super(label);
	}
	// @ts-ignore
	get tooltip(): undefined {
		return undefined;
	}
	// @ts-ignore
	get description(): undefined {
		return undefined;
	}

	contextValue = 'line';
}

export class TagProvider implements vscode.TreeDataProvider<TagTreeItem | LineTreeItem> {
	private readonly _onDidChangeTreeData: vscode.EventEmitter<TagTreeItem | undefined> = new vscode.EventEmitter<TagTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TagTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private tags: ItemForProvider[],
	) { }

	refresh(newTags: ItemForProvider[]): void {
		this.tags = newTags;
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: TagTreeItem | LineTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element: TagTreeItem | undefined): TagTreeItem[] | LineTreeItem[] {
		if (element) {
			return element.items;
		} else {
			return this.tags.map(tag => new TagTreeItem(`${tag.title} [${tag.items.length}]`, tag.items.map(item => new LineTreeItem(
				item.title,
				{
					command: `${EXTENSION_NAME}.goToLine`,
					title: 'Go To Line',
					arguments: [item.lineNumber],
				},
			))));
		}
	}
}
