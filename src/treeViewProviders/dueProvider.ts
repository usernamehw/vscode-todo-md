import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../extension';
import { Task } from '../parse';

export class DueTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.None;
	contextValue = 'task';

	constructor(
		readonly label: string,
		readonly parsedLine: Task,
		readonly command: vscode.Command
	) {
		super(label);
	}

	get tooltip(): string | undefined {
		return undefined;
	}

	get description(): string {
		return String(this.parsedLine.done);
	}
}

export class DueProvider implements vscode.TreeDataProvider<DueTreeItem> {
	private readonly _onDidChangeTreeData: vscode.EventEmitter<DueTreeItem | undefined> = new vscode.EventEmitter<DueTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<DueTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private tasks: Task[]
	) { }

	refresh(newTasks: Task[]): void {
		this.tasks = newTasks;
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: DueTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element: DueTreeItem | undefined): DueTreeItem[] | undefined {
		if (element) {
			return undefined;
		} else {
			return this.tasks.map(task => new DueTreeItem(
				task.title,
				task,
				{
					command: `${EXTENSION_NAME}.goToLine`,
					title: 'Go To Line',
					arguments: [task.ln],
				}
			));
		}
	}
}
