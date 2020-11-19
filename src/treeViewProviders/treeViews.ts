import vscode, { TreeView } from 'vscode';
import { getActiveDocument, toggleTaskCollapse } from '../documentActions';
import { extensionConfig, EXTENSION_NAME, state } from '../extension';
import { filterItems } from '../filter';
import { TheTask } from '../TheTask';
import { ContextProvider } from '../treeViewProviders/contextProvider';
import { ProjectProvider } from '../treeViewProviders/projectProvider';
import { TagProvider } from '../treeViewProviders/tagProvider';
import { TaskProvider } from '../treeViewProviders/taskProvider';
import { ItemForProvider, SortTags, VscodeContext } from '../types';
import { setContext } from '../vscodeUtils';
import { updateWebviewView } from '../webview/webviewView';

export const tagProvider = new TagProvider([]);
export const projectProvider = new ProjectProvider([]);
export const contextProvider = new ContextProvider([]);
export const taskProvider = new TaskProvider([]);
export const archivedProvider = new TaskProvider([]);

const generic1Provider = new TaskProvider([]);
const generic2Provider = new TaskProvider([]);
const generic3Provider = new TaskProvider([]);

let tagsView: vscode.TreeView<any>;
let projectView: vscode.TreeView<any>;
let contextView: vscode.TreeView<any>;
let tasksView: vscode.TreeView<any>;
let archivedView: vscode.TreeView<any>;
let generic1View: vscode.TreeView<any>;
let generic2View: vscode.TreeView<any>;
let generic3View: vscode.TreeView<any>;

export function createAllTreeViews() {
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
		showCollapseAll: true,
	});
	tasksView.onDidCollapseElement(async event => {
		toggleTaskCollapse(await getActiveDocument(), (event.element.task as TheTask).lineNumber);
	});
	tasksView.onDidExpandElement(async event => {
		toggleTaskCollapse(await getActiveDocument(), (event.element.task as TheTask).lineNumber);
	});

	archivedView = vscode.window.createTreeView(`${EXTENSION_NAME}.archived`, {
		treeDataProvider: archivedProvider,
	});

	if (extensionConfig.treeViews.length) {
		const generic1 = extensionConfig.treeViews[0];
		if (generic1) {
			if (typeof generic1.filter !== 'string' || typeof generic1.title !== 'string') {
				vscode.window.showWarningMessage('Tree View must have filter and title and they must be strings.');
			} else {
				generic1View = vscode.window.createTreeView('todomd.generic1', {
					treeDataProvider: generic1Provider,
					showCollapseAll: true,
				});
				generic1View.onDidCollapseElement(async event => {
					toggleTaskCollapse(await getActiveDocument(), (event.element.task as TheTask).lineNumber);
				});
				generic1View.onDidExpandElement(async event => {
					toggleTaskCollapse(await getActiveDocument(), (event.element.task as TheTask).lineNumber);
				});
				setContext(VscodeContext.generic1FilterExists, true);
			}
		}

		const generic2 = extensionConfig.treeViews[1];
		if (generic2) {
			if (typeof generic2.filter !== 'string' || typeof generic2.title !== 'string') {
				vscode.window.showWarningMessage('Tree View must have filter and title and they must be strings.');
			} else {
				generic2View = vscode.window.createTreeView('todomd.generic2', {
					treeDataProvider: generic2Provider,
					showCollapseAll: true,
				});
				generic2View.onDidCollapseElement(async event => {
					toggleTaskCollapse(await getActiveDocument(), (event.element.task as TheTask).lineNumber);
				});
				generic2View.onDidExpandElement(async event => {
					toggleTaskCollapse(await getActiveDocument(), (event.element.task as TheTask).lineNumber);
				});
				setContext(VscodeContext.generic2FilterExists, true);
			}
		}

		const generic3 = extensionConfig.treeViews[2];
		if (generic3) {
			if (typeof generic3.filter !== 'string' || typeof generic3.title !== 'string') {
				vscode.window.showWarningMessage('Tree View must have filter and title and they must be strings.');
			} else {
				generic3View = vscode.window.createTreeView('todomd.generic3', {
					treeDataProvider: generic3Provider,
					showCollapseAll: true,
				});
				generic3View.onDidCollapseElement(async event => {
					toggleTaskCollapse(await getActiveDocument(), (event.element.task as TheTask).lineNumber);
				});
				generic3View.onDidExpandElement(async event => {
					toggleTaskCollapse(await getActiveDocument(), (event.element.task as TheTask).lineNumber);
				});
				setContext(VscodeContext.generic3FilterExists, true);
			}
		}
	} else {
		setContext(VscodeContext.generic1FilterExists, false);
		setContext(VscodeContext.generic2FilterExists, false);
		setContext(VscodeContext.generic3FilterExists, false);
	}
}
/**
 * Update all tree views (excluding archived tasks) and webviews
 * Items are taken from `state`
 */
export function updateAllTreeViews(): void {
	tagProvider.refresh(state.tagsForTreeView);
	setViewTitle(tagsView, 'tags', state.tagsForTreeView.length);

	updateTasksTreeView();

	projectProvider.refresh(state.projectsForTreeView);
	setViewTitle(projectView, 'projects', state.projectsForTreeView.length);

	contextProvider.refresh(state.contextsForTreeView);
	setViewTitle(contextView, 'contexts', state.contextsForTreeView.length);

	if (generic1View) {
		const filteredTasks = filterItems(state.tasksAsTree, extensionConfig.treeViews[0].filter);
		generic1Provider.refresh(filteredTasks);
		setViewTitle(generic1View, extensionConfig.treeViews[0].title, filteredTasks.length);
	}
	if (generic2View) {
		const filteredTasks = filterItems(state.tasksAsTree, extensionConfig.treeViews[1].filter);
		generic2Provider.refresh(filteredTasks);
		setViewTitle(generic2View, extensionConfig.treeViews[1].title, filteredTasks.length);
	}
	if (generic3View) {
		const filteredTasks = filterItems(state.tasksAsTree, extensionConfig.treeViews[2].filter);
		generic3Provider.refresh(filteredTasks);
		setViewTitle(generic3View, extensionConfig.treeViews[2].title, filteredTasks.length);
	}
	// ──────────────────────────────────────────────────────────────────────
	updateWebviewView();
}

export function updateTasksTreeView() {
	let tasksForProvider;
	if (state.taskTreeViewFilterValue) {
		tasksForProvider = filterItems(state.tasksAsTree, state.taskTreeViewFilterValue);
	} else {
		tasksForProvider = state.tasksAsTree;
	}
	taskProvider.refresh(tasksForProvider);
	setViewTitle(tasksView, 'tasks', tasksForProvider.length, state.taskTreeViewFilterValue);
}

export function updateArchivedTasksTreeView() {
	const archivedTasks = state.archivedTasks;
	archivedProvider.refresh(archivedTasks);
	setViewTitle(archivedView, 'archived', archivedTasks.length);
}

function setViewTitle(view: TreeView<any>, title: string, counter: number, filterValue = '') {
	view.title = `${title} (${counter}) ${filterValue}`;
}

export interface ParsedItems {
	tags: string[];
	contexts: string[];
	projects: string[];
	sortedTagsForProvider: ItemForProvider[];
	projectsForProvider: ItemForProvider[];
	contextsForProvider: ItemForProvider[];
}
interface TempTitleLineNumberMap {
	[title: string]: TheTask[];
}
export function groupAndSortTreeItems(tasks: TheTask[]): ParsedItems {
	const tagMap: TempTitleLineNumberMap = {};
	const projectMap: TempTitleLineNumberMap = {};
	const contextMap: TempTitleLineNumberMap = {};
	for (const task of tasks) {
		// Tags grouping
		for (const tag of task.tags) {
			if (!tagMap[tag]) {
				tagMap[tag] = [];
			}
			tagMap[tag].push(task);
		}
		// Projects grouping
		if (task.projects.length) {
			for (const project of task.projects) {
				if (!projectMap[project]) {
					projectMap[project] = [];
				}
				projectMap[project].push(task);
			}
		}
		// Contexts grouping
		if (task.contexts.length) {
			for (const context of task.contexts) {
				if (!contextMap[context]) {
					contextMap[context] = [];
				}
				contextMap[context].push(task);
			}
		}
	}
	const tagsForProvider: ItemForProvider[] = [];
	for (const key in tagMap) {
		tagsForProvider.push({
			title: key,
			tasks: tagMap[key],
		});
	}
	let sortedTagsForProvider: ItemForProvider[];
	if (extensionConfig.sortTagsView === SortTags.alphabetic) {
		sortedTagsForProvider = tagsForProvider.sort((a, b) => a.title.localeCompare(b.title));
	} else {
		sortedTagsForProvider = tagsForProvider.sort((a, b) => b.tasks.length - a.tasks.length);
	}

	const projectsForProvider: ItemForProvider[] = [];
	for (const key in projectMap) {
		projectsForProvider.push({
			title: key,
			tasks: projectMap[key],
		});
	}
	const contextsForProvider: ItemForProvider[] = [];
	for (const key in contextMap) {
		contextsForProvider.push({
			title: key,
			tasks: contextMap[key],
		});
	}
	return {
		contextsForProvider,
		projectsForProvider,
		sortedTagsForProvider,
		tags: Object.keys(tagMap),
		projects: Object.keys(projectMap),
		contexts: Object.keys(contextMap),
	};
}
