import vscode from 'vscode';
import { TheTask } from '../TheTask';
import { ItemForProvider } from '../types';
import { tasksToTreeItems, TaskTreeItem } from './taskProvider';

export class TagTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

	constructor(
		readonly label: string,
		readonly tasks: TheTask[],
	) {
		super(label);
	}

	contextValue = 'tag';
}

export class TagProvider implements vscode.TreeDataProvider<TagTreeItem | TaskTreeItem> {
	private readonly _onDidChangeTreeData: vscode.EventEmitter<TagTreeItem | undefined> = new vscode.EventEmitter<TagTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TagTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private tags: ItemForProvider[],
	) { }

	refresh(newTags: ItemForProvider[]): void {
		this.tags = newTags;
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: TagTreeItem | TaskTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element: TagTreeItem | TaskTreeItem | undefined): TagTreeItem[] | TaskTreeItem[] {
		if (!element) {
			return this.tags.map(tag => new TagTreeItem(`${tag.title} [${tag.tasks.length}]`, tag.tasks));
		}
		if (element instanceof TagTreeItem) {
			return tasksToTreeItems(element.tasks);
		} else {
			const subtasks = element.task.subtasks;
			if (subtasks.length) {
				return tasksToTreeItems(subtasks);
			} else {
				return [];
			}
		}
	}
}
