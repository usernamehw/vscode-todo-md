import vscode from 'vscode';
import { TheTask } from '../TheTask';
import { ItemForProvider } from '../types';
import { tasksToTreeItems, TaskTreeItem } from './taskProvider';

export class ProjectTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

	constructor(
		readonly label: string,
		readonly tasks: TheTask[],
	) {
		super(label);
	}

	contextValue = 'project';
}

export class ProjectProvider implements vscode.TreeDataProvider<ProjectTreeItem | TaskTreeItem> {
	private readonly _onDidChangeTreeData: vscode.EventEmitter<ProjectTreeItem | undefined> = new vscode.EventEmitter<ProjectTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<ProjectTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private projects: ItemForProvider[],
	) { }

	refresh(newProjects: ItemForProvider[]): void {
		this.projects = newProjects;
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: ProjectTreeItem | TaskTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element: ProjectTreeItem | TaskTreeItem | undefined): ProjectTreeItem[] | TaskTreeItem[] {
		if (!element) {
			return this.projects.map(project => new ProjectTreeItem(`${project.title} [${project.tasks.length}]`, project.tasks));
		}
		let tasksToTransform: TheTask[] = [];
		if (element instanceof ProjectTreeItem) {
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
