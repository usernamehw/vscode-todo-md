import vscode, { ThemeColor, ThemeIcon } from 'vscode';
import { extensionConfig } from '../extension';
import { getTaskHover } from '../hover/getTaskHover';
import { defaultSortTasks } from '../sort';
import { TheTask } from '../TheTask';
import { CommandIds, SortNestedTasks } from '../types';

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
			if (task.isCollapsed) {
				this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			} else {
				this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
			}
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
		private readonly isArchived = false,
	) { }

	refresh(newTasks: TheTask[]): void {
		this.tasks = newTasks;
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: TaskTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element: TaskTreeItem | undefined): TaskTreeItem[] {
		let tasksToTransform: TheTask[] = [];
		if (element) {
			const subtasks = element.task.subtasks;
			if (subtasks.length) {
				return tasksToTreeItems(subtasks, true, this.isArchived);
			}
		} else {
			tasksToTransform = this.tasks;
		}
		return tasksToTreeItems(tasksToTransform, false, this.isArchived);
	}
}
/**
 * Transform tasks to be able to use in a Tree View
 */
export function tasksToTreeItems(tasks: TheTask[], tryToApplySort = false, isArchived = false) {
	if (tryToApplySort && extensionConfig.sortNestedTasks === SortNestedTasks.default) {
		tasks = defaultSortTasks(tasks);
	}
	const result = [];
	for (const task of tasks) {
		if (task.isHidden) {
			continue;
		}

		result.push(new TaskTreeItem(
			TheTask.formatTask(task, {
				ignoreDueDate: true,
			}),
			task,
			{
				command: isArchived ? CommandIds.goToLineInArchived : CommandIds.goToLine,
				title: 'Go To Line',
				arguments: [task.lineNumber],
			},
		));
	}
	return result;
}
