import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../extension';
import { Task } from '../parse';

export class TaskTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.None;
	readonly contextValue = 'task';

	constructor(
		readonly label: string,
		readonly task: Task,
		readonly command: vscode.Command
	) {
		super(label);
	}

	get tooltip(): string | undefined {
		return `TITLE: ${this.task.title}\nDONE: ${this.task.done}\nPRIORITY: ${this.task.priority}`;
	}

	get description() {
		return undefined;
	}
}

export class TaskProvider implements vscode.TreeDataProvider<TaskTreeItem> {
	private readonly _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined> = new vscode.EventEmitter<TaskTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private tasks: Task[]
	) { }

	refresh(newTasks: Task[]): void {
		this.tasks = newTasks;
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: TaskTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element: TaskTreeItem | undefined): TaskTreeItem[] | undefined {
		if (element) {
			return undefined;
		} else {
			return this.tasks.map(task => new TaskTreeItem(
				task.title,
				task,
				{
					command: `${EXTENSION_NAME}.goToLine`,
					title: 'Go To Line',
					arguments: [task.ln],
				}));
		}
	}
}
