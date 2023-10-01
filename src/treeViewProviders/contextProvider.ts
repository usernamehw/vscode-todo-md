import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { TheTask } from '../TheTask';
import { getTasksHoverMd } from '../languageFeatures/getTaskHover';
import { ItemForProvider } from '../types';
import { TaskTreeItem, tasksToTreeItems } from './taskProvider';

export class ContextTreeItem extends TreeItem {
	readonly collapsibleState = TreeItemCollapsibleState.Collapsed;

	constructor(
		readonly label: string,
		readonly tasks: TheTask[],
	) {
		super(label);
	}

	contextValue = 'project';
}

export class ContextProvider implements TreeDataProvider<ContextTreeItem | TaskTreeItem> {
	private readonly _onDidChangeTreeData: EventEmitter<ContextTreeItem | undefined> = new EventEmitter<ContextTreeItem | undefined>();
	readonly onDidChangeTreeData: Event<ContextTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private contexts: ItemForProvider[],
	) { }

	refresh(newContexts: ItemForProvider[]) {
		this.contexts = newContexts;
		this._onDidChangeTreeData.fire(undefined);
	}
	/**
	 * Resolve `tooltip` only on hover
	 */
	resolveTreeItem(item: ContextTreeItem | TaskTreeItem, el: ContextTreeItem | TaskTreeItem) {
		if (el instanceof TaskTreeItem) {
			el.tooltip = getTasksHoverMd([el.task]);
			return el;
		}
		return undefined;
	}

	getTreeItem(element: ContextTreeItem | TaskTreeItem): TreeItem {
		return element;
	}

	getChildren(element: ContextTreeItem | TaskTreeItem | undefined): ContextTreeItem[] | TaskTreeItem[] {
		if (!element) {
			return this.contexts.map(context => new ContextTreeItem(`${context.title} [${context.tasks.length}]`, context.tasks));
		}
		let tasksToTransform: TheTask[] = [];
		if (element instanceof ContextTreeItem) {
			tasksToTransform = element.tasks;
		} else {
			const subtasks = element.task.subtasks;
			if (subtasks.length) {
				return tasksToTreeItems(subtasks, true);
			}
		}
		return tasksToTreeItems(tasksToTransform);
	}
}
