import * as vscode from 'vscode';
import { TagProvider } from './tagProvider';
import { EXTENSION_NAME, state } from '../extension';
import { TaskProvider } from './taskProvider';
import { ProjectProvider } from './projectProvider';
import { ContextProvider } from './contextProvider';
import { Task } from '../parse';
import { filterItems } from '../filter';

export const tagProvider = new TagProvider([]);
export const taskProvider = new TaskProvider([]);
export const projectProvider = new ProjectProvider([]);
export const contextProvider = new ContextProvider([]);
let tagsView: any;
let tasksView: any;
let projectView: any;
let contextView: any;

export function createTreeViews() {
	tagsView = vscode.window.createTreeView(`${EXTENSION_NAME}.tags`, {
		treeDataProvider: tagProvider,
		showCollapseAll: true,
	});

	tasksView = vscode.window.createTreeView(`${EXTENSION_NAME}.tasks`, {
		treeDataProvider: taskProvider,
	});

	projectView = vscode.window.createTreeView(`${EXTENSION_NAME}.projects`, {
		treeDataProvider: projectProvider,
		showCollapseAll: true,
	});

	contextView = vscode.window.createTreeView(`${EXTENSION_NAME}.contexts`, {
		treeDataProvider: contextProvider,
		showCollapseAll: true,
	});
}

export function updateAllTreeViews(): void {
	tagProvider.refresh(state.tagsForProvider);
	tagsView.title = `tags (${state.tagsForProvider.length})`;

	let tasksForProvider;
	if (state.taskTreeViewFilterValue) {
		tasksForProvider = filterItems(state.tasks, state.taskTreeViewFilterValue);
	} else {
		tasksForProvider = state.tasks;
	}
	taskProvider.refresh(tasksForProvider);
	tasksView.title = `tasks (${tasksForProvider.length})`;

	projectProvider.refresh(state.projectsForProvider);
	projectView.title = `projects (${state.projectsForProvider.length})`;

	contextProvider.refresh(state.contextsForProvider);
	contextView.title = `contexts (${state.contextsForProvider.length})`;
}

