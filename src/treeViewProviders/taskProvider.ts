import { Command, Event, EventEmitter, ThemeColor, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { extensionConfig } from '../extension';
import { getTaskHover } from '../hover/getTaskHover';
import { defaultSortTasks } from '../sort';
import { TheTask } from '../TheTask';
import { CommandIds, SortNestedTasks } from '../types';
import { formatTask } from '../utils/taskUtils';


export class TaskTreeItem extends TreeItem {
	collapsibleState = TreeItemCollapsibleState.None;
	contextValue = 'task';

	constructor(
		readonly label: string,
		readonly task: TheTask,
		readonly command: Command,
	) {
		super(label);
		if (task.links.length) {
			this.contextValue = 'link';
		}
		if (task.subtasks.length) {
			if (task.isCollapsed) {
				this.collapsibleState = TreeItemCollapsibleState.Collapsed;
			} else {
				this.collapsibleState = TreeItemCollapsibleState.Expanded;
			}
		}

		if (task.done) {
			this.iconPath = new ThemeIcon('pass', new ThemeColor('todomd.treeViewCompletedTaskIcon'));
		} else {
			// this.iconPath = new ThemeIcon('circle-large-outline');// TODO: maybe
		}
	}
}

export class TaskProvider implements TreeDataProvider<TaskTreeItem> {
	private readonly _onDidChangeTreeData: EventEmitter<TaskTreeItem | undefined> = new EventEmitter<TaskTreeItem | undefined>();
	readonly onDidChangeTreeData: Event<TaskTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private tasks: TheTask[],
		private readonly isArchived = false,
	) { }

	refresh(newTasks: TheTask[]) {
		this.tasks = newTasks;
		this._onDidChangeTreeData.fire(undefined);
	}
	/**
	 * Resolve `tooltip` only on hover
	 */
	resolveTreeItem(item: TaskTreeItem, el: TaskTreeItem) {
		el.tooltip = getTaskHover(el.task);
		return el;
	}

	getTreeItem(element: TaskTreeItem): TreeItem {
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
 * Transform tasks to be able to use in a Tree View. All nested tasks also included.
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
			formatTask(task, {
				ignoreDueDate: false,
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
