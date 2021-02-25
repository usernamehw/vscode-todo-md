import dayjs from 'dayjs';
import vscode, { ThemeColor, ThemeIcon } from 'vscode';
import { EXTENSION_NAME } from '../extension';
import { getTaskHover } from '../hover/getTaskHover';
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
		if (task.subtasks.length) {
			this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
		}
		if (task.isCollapsed) {
			this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		}
		if (task.done) {
			this.iconPath = new ThemeIcon('pass', new ThemeColor('todomd.treeViewCompletedTaskIcon'));
		}
	}
	// @ts-ignore
	get tooltip() {
		return getTaskHover(this.task);
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
		return element;
	}

	getChildren(element: TaskTreeItem | undefined): TaskTreeItem[] {
		if (element) {
			const subtasks = element.task.subtasks;
			if (subtasks.length) {
				return tasksToTreeItems(subtasks);
			} else {
				return [];
			}
		} else {
			return tasksToTreeItems(this.tasks);
		}
	}
}
/**
 * Transform tasks to be able to use in a Tree View
 */
export function tasksToTreeItems(tasks: TheTask[]) {
	const result = [];
	for (const task of tasks) {
		if (task.isHidden) {
			continue;
		}
		if (task.threshold && dayjs().isAfter(new Date(task.threshold), 'date')) {
			continue;
		}
		result.push(new TaskTreeItem(
			TheTask.formatTask(task, {
				ignoreDueDate: true,
			}),
			task,
			{
				command: `${EXTENSION_NAME}.goToLine`,
				title: 'Go To Line',
				arguments: [task.lineNumber],
			},
		));
	}
	return result;
}
