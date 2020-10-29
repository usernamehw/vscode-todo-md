import dayjs from 'dayjs';
import vscode from 'vscode';
import { EXTENSION_NAME } from '../extension';
import { TheTask } from '../TheTask';

export class TaskTreeItem extends vscode.TreeItem {
	collapsibleState = vscode.TreeItemCollapsibleState.None;
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
		if (task.children.length) {
			this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		}
		if (task.specialTags.collapsed) {
			this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		}
	}
	// @ts-ignore
	get tooltip() {
		return undefined;
		// return new MarkdownString(`${this.task.title}\n\n${this.task.done}`);
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
	// @ts-ignore
	getChildren(element: TaskTreeItem | undefined): (TaskTreeItem | undefined)[] | undefined {
		if (element) {
			const children = element.task.children;
			if (children.length) {
				return children.map(task => taskToTreeItem(task));
			} else {
				return undefined;
			}
		} else {
			return this.tasks.map(task => taskToTreeItem(task));
		}
	}
}

function taskToTreeItem(task: TheTask) {
	if (task.specialTags.isHidden) {
		return undefined;
	}
	if (task.specialTags.threshold && dayjs().isAfter(new Date(task.specialTags.threshold), 'date')) {
		return undefined;
	}
	return new TaskTreeItem(
		TheTask.formatTask(task),
		task,
		{
			command: `${EXTENSION_NAME}.goToLine`,
			title: 'Go To Line',
			arguments: [task.lineNumber],
		},
	);
}
