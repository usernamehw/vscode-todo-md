import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { TheTask } from '../TheTask';
import { ItemForProvider } from '../types';
import { tasksToTreeItems, TaskTreeItem } from './taskProvider';

export class TagTreeItem extends TreeItem {
	readonly collapsibleState = TreeItemCollapsibleState.Collapsed;

	constructor(
		readonly label: string,
		readonly tasks: TheTask[],
	) {
		super(label);
	}

	contextValue = 'tag';
}

export class TagProvider implements TreeDataProvider<TagTreeItem | TaskTreeItem> {
	private readonly _onDidChangeTreeData: EventEmitter<TagTreeItem | undefined> = new EventEmitter<TagTreeItem | undefined>();
	readonly onDidChangeTreeData: Event<TagTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private tags: ItemForProvider[],
	) { }

	refresh(newTags: ItemForProvider[]): void {
		this.tags = newTags;
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: TagTreeItem | TaskTreeItem): TreeItem {
		return element;
	}

	getChildren(element: TagTreeItem | TaskTreeItem | undefined): TagTreeItem[] | TaskTreeItem[] {
		if (!element) {
			return this.tags.map(tag => new TagTreeItem(`${tag.title} [${tag.tasks.length}]`, tag.tasks));
		}
		let tasksToTransform: TheTask[] = [];
		if (element instanceof TagTreeItem) {
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
