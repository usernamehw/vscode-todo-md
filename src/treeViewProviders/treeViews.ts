import * as vscode from 'vscode';
import { TagProvider } from './tagProvider';
import { EXTENSION_NAME, state, config, updateState } from '../extension';
import { TaskProvider } from './taskProvider';
import { ProjectProvider } from './projectProvider';
import { ContextProvider } from './contextProvider';
import { filterItems } from '../filter';
import { setContext } from '../vscodeUtils';

const GENERIC_1_CONTEXT_KEY = 'todomd:generic1FilterExists';
const GENERIC_2_CONTEXT_KEY = 'todomd:generic2FilterExists';
const GENERIC_3_CONTEXT_KEY = 'todomd:generic3FilterExists';

export const tagProvider = new TagProvider([]);
export const projectProvider = new ProjectProvider([]);
export const contextProvider = new ContextProvider([]);
export const taskProvider = new TaskProvider([]);
const generic1Provider = new TaskProvider([]);
const generic2Provider = new TaskProvider([]);
const generic3Provider = new TaskProvider([]);
let tagsView: vscode.TreeView<any>;
let projectView: vscode.TreeView<any>;
let contextView: vscode.TreeView<any>;
let tasksView: vscode.TreeView<any>;
let generic1View: vscode.TreeView<any>;
let generic2View: vscode.TreeView<any>;
let generic3View: vscode.TreeView<any>;

export function createTreeViews() {
	tagsView = vscode.window.createTreeView(`${EXTENSION_NAME}.tags`, {
		treeDataProvider: tagProvider,
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

	tasksView = vscode.window.createTreeView(`${EXTENSION_NAME}.tasks`, {
		treeDataProvider: taskProvider,
	});
	tasksView.onDidChangeVisibility(async e => {
		if (e.visible === true && !state.theRightFileOpened) {
			await updateState();
			updateTasksTreeView();
		}
	});

	if (config.treeViews.length) {
		const generic1 = config.treeViews[0];
		if (generic1) {
			if (typeof generic1.filter !== 'string' || typeof generic1.title !== 'string') {
				vscode.window.showWarningMessage('Tree View must have filter and title and they must be strings.');
			} else {
				generic1View = vscode.window.createTreeView('todomd.generic1', {
					treeDataProvider: generic1Provider,
				});
				setContext(GENERIC_1_CONTEXT_KEY, true);
			}
		}

		const generic2 = config.treeViews[1];
		if (generic2) {
			if (typeof generic2.filter !== 'string' || typeof generic2.title !== 'string') {
				vscode.window.showWarningMessage('Tree View must have filter and title and they must be strings.');
			} else {
				generic2View = vscode.window.createTreeView('todomd.generic2', {
					treeDataProvider: generic2Provider,
				});
				setContext(GENERIC_2_CONTEXT_KEY, true);
			}
		}

		const generic3 = config.treeViews[2];
		if (generic3) {
			if (typeof generic3.filter !== 'string' || typeof generic3.title !== 'string') {
				vscode.window.showWarningMessage('Tree View must have filter and title and they must be strings.');
			} else {
				generic3View = vscode.window.createTreeView('todomd.generic3', {
					treeDataProvider: generic3Provider,
				});
				setContext(GENERIC_3_CONTEXT_KEY, true);
			}
		}
	} else {
		setContext(GENERIC_1_CONTEXT_KEY, false);
		setContext(GENERIC_2_CONTEXT_KEY, false);
		setContext(GENERIC_3_CONTEXT_KEY, false);
	}
}

export function updateAllTreeViews(): void {
	tagProvider.refresh(state.tagsForProvider);
	tagsView.title = `tags (${state.tagsForProvider.length})`;

	updateTasksTreeView();

	projectProvider.refresh(state.projectsForProvider);
	projectView.title = `projects (${state.projectsForProvider.length})`;

	contextProvider.refresh(state.contextsForProvider);
	contextView.title = `contexts (${state.contextsForProvider.length})`;

	if (generic1View) {
		const filteredTasks = filterItems(getTasksForTreeView(), config.treeViews[0].filter);
		generic1Provider.refresh(filteredTasks);
		setTimeout(() => {
			generic1View.title = `${config.treeViews[0].title} (${filteredTasks.length})`;
		}, 0);
	}
	if (generic2View) {
		const filteredTasks = filterItems(getTasksForTreeView(), config.treeViews[1].filter);
		generic2Provider.refresh(filteredTasks);
		setTimeout(() => {
			generic2View.title = `${config.treeViews[1].title} (${filteredTasks.length})`;
		}, 0);
	}
	if (generic3View) {
		const filteredTasks = filterItems(getTasksForTreeView(), config.treeViews[2].filter);
		generic3Provider.refresh(filteredTasks);
		setTimeout(() => {
			generic3View.title = `${config.treeViews[2].title} (${filteredTasks.length})`;
		}, 0);
	}
}

export function updateTasksTreeView() {
	let tasksForProvider;
	if (state.taskTreeViewFilterValue) {
		tasksForProvider = filterItems(getTasksForTreeView(), state.taskTreeViewFilterValue);
	} else {
		tasksForProvider = getTasksForTreeView();
	}
	taskProvider.refresh(tasksForProvider);
	tasksView.title = `tasks (${tasksForProvider.length})`;
}

function getTasksForTreeView() {
	return state.tasks.filter(task => {
		if (task.specialTags.isHidden) {
			return false;
		}
		if (!task.specialTags.threshold) {
			return true;
		}
		return new Date(task.specialTags.threshold).getTime() < Date.now();
	});
}
