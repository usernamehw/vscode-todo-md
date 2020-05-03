import * as vscode from 'vscode';
import { TagProvider } from './tagProvider';
import { EXTENSION_NAME, state } from '../extension';
import { TaskProvider } from './taskProvider';
import { DueProvider } from './dueProvider';
import { ProjectProvider } from './projectProvider';
import { ContextProvider } from './contextProvider';
import { Task } from '../parse';

export const tagProvider = new TagProvider([]);
export const taskProvider = new TaskProvider([]);
export const dueProvider = new DueProvider([]);
export const projectProvider = new ProjectProvider([]);
export const contextProvider = new ContextProvider([]);
let tagsView: any;
let tasksView: any;
let dueView: any;
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

	dueView = vscode.window.createTreeView(`${EXTENSION_NAME}.due`, {
		treeDataProvider: dueProvider,
		showCollapseAll: true,
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
	const dueTasks = getDueTasks();
	dueProvider.refresh(dueTasks);
	dueView.title = `due (${dueTasks.length})`;

	tagProvider.refresh(state.tagsForProvider);
	tagsView.title = `tags (${state.tagsForProvider.length})`;

	const tasksForProvider = getTasksForTreeProvider();
	taskProvider.refresh(tasksForProvider);
	tasksView.title = `tasks (${tasksForProvider.length})`;

	projectProvider.refresh(state.projectsForProvider);
	projectView.title = `projects (${state.projectsForProvider.length})`;

	contextProvider.refresh(state.contextsForProvider);
	contextView.title = `contexts (${state.contextsForProvider.length})`;
}

function getDueTasks(): Task[] {
	return state.tasks.filter(task => task.isDue && !task.done);
}
function getTasksForTreeProvider(): Task[] {
	return state.tasks.filter(task => task);
}
