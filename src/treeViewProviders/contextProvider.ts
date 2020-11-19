import vscode from 'vscode';
import { TheTask } from '../TheTask';
import { ItemForProvider } from '../types';
import { tasksToTreeItems, TaskTreeItem } from './taskProvider';

export class ContextTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

	constructor(
		readonly label: string,
		readonly tasks: TheTask[],
	) {
		super(label);
	}

	contextValue = 'project';
}

export class ContextProvider implements vscode.TreeDataProvider<ContextTreeItem | TaskTreeItem> {
	private readonly _onDidChangeTreeData: vscode.EventEmitter<ContextTreeItem | undefined> = new vscode.EventEmitter<ContextTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<ContextTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private contexts: ItemForProvider[],
	) { }

	refresh(newContexts: ItemForProvider[]): void {
		this.contexts = newContexts;
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: ContextTreeItem | TaskTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element: ContextTreeItem | TaskTreeItem | undefined): ContextTreeItem[] | TaskTreeItem[] {
		if (!element) {
			return this.contexts.map(context => new ContextTreeItem(`${context.title} [${context.tasks.length}]`, context.tasks));
		}
		if (element instanceof ContextTreeItem) {
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
