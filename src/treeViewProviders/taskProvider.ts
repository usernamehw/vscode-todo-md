import vscode, { MarkdownString } from 'vscode';
import { EXTENSION_NAME } from '../extension';
import { TheTask } from '../TheTask';

export class TaskTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.None;
	contextValue = 'task';

	constructor(
		readonly label: string,
		readonly task: TheTask,
		readonly command: vscode.Command,
	) {
		super(label);
		if (task.links.length) {
			this.contextValue = 'link';
		}
	}
	// @ts-ignore
	get tooltip() {
		return new MarkdownString(`${this.task.title}\n\n${this.task.done}`);
	}
	// @ts-ignore
	get description() {
		return undefined;
	}
}

export class TaskProvider implements vscode.TreeDataProvider<TaskTreeItem> {
	private readonly _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined> = new vscode.EventEmitter<TaskTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private tasks: TheTask[],
	) { }

	refresh(newTasks: TheTask[]): void {
		this.tasks = newTasks;
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: TaskTreeItem): vscode.TreeItem {
		// @ts-ignore
		return element;
	}

	getChildren(element: TaskTreeItem | undefined): TaskTreeItem[] | undefined {
		if (element) {
			return undefined;
		} else {
			return this.tasks.map(task => new TaskTreeItem(
				TheTask.formatTask(task),
				task,
				{
					command: `${EXTENSION_NAME}.goToLine`,
					title: 'Go To Line',
					arguments: [task.lineNumber],
				}));
		}
	}
}
