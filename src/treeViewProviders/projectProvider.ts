import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../extension';
import type { ProjectForProvider } from '../types';

export class ProjectTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
	iconPath = vscode.ThemeIcon.Folder;

	constructor(
		readonly label: string,
		readonly items: LineTreeItem[]
	) {
		super(label);
	}

	get tooltip(): string | undefined {
		return undefined;
	}

	get description(): undefined {
		return undefined;
	}

	contextValue = 'project';
}

class LineTreeItem extends vscode.TreeItem {
	readonly collapsibleState = vscode.TreeItemCollapsibleState.None;

	constructor(
		readonly label: string,
		readonly command: vscode.Command
	) {
		super(label);
	}

	get tooltip(): undefined {
		return undefined;
	}

	get description(): undefined {
		return undefined;
	}

	contextValue = 'line';
}

export class ProjectProvider implements vscode.TreeDataProvider<ProjectTreeItem | LineTreeItem> {
	private readonly _onDidChangeTreeData: vscode.EventEmitter<ProjectTreeItem | undefined> = new vscode.EventEmitter<ProjectTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<ProjectTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private projects: ProjectForProvider[]
	) { }

	refresh(newProjects: ProjectForProvider[]): void {
		this.projects = newProjects;
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: ProjectTreeItem | LineTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element: ProjectTreeItem | undefined): ProjectTreeItem[] | LineTreeItem[] {
		if (element) {
			return element.items;
		} else {
			return this.projects.map(project => new ProjectTreeItem(`${project.project} [${project.items.length}]`, project.items.map(item => new LineTreeItem(
				item.title,
				{
					command: `${EXTENSION_NAME}.goToLine`,
					title: 'Go To Line',
					arguments: [item.lineNumber],
				}
			))));
		}
	}
}
