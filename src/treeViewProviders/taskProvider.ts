import vscode from 'vscode';
import { formatTask } from '../commands';
import { EXTENSION_NAME } from '../extension';
import { TheTask } from '../parse';

export class TaskTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.None;
	contextValue = 'task';

	constructor(
		readonly label: string,
		readonly task: TheTask,
		readonly command: vscode.Command
	) {
		super(label);
		if (task.specialTags.link) {
			this.contextValue = 'link';
		}
	}

	get tooltip(): string | undefined {
		return `TITLE: ${this.task.title}\nDONE: ${this.task.done}\nPRIORITY: ${this.task.priority}`;// TODO: make nice markdown hover
	}

	get description() {
		return undefined;
	}
}

export class TaskProvider implements vscode.TreeDataProvider<TaskTreeItem> {
	private readonly _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined> = new vscode.EventEmitter<TaskTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private tasks: TheTask[]
	) { }

	refresh(newTasks: TheTask[]): void {
		this.tasks = newTasks;
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: TaskTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element: TaskTreeItem | undefined): TaskTreeItem[] | undefined {
		if (element) {
			return undefined;
		} else {
			return this.tasks.map(task => new TaskTreeItem(
				formatTask(task),
				task,
				{
					command: `${EXTENSION_NAME}.goToLine`,
					title: 'Go To Line',
					arguments: [task.lineNumber],
				}));
		}
	}
}
