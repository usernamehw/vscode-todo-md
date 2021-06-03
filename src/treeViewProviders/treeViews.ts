import vscode, { TreeView, workspace } from 'vscode';
import { toggleTaskCollapse } from '../documentActions';
import { Constants, extensionConfig, extensionState } from '../extension';
import { filterItems } from '../filter';
import { parseDocument } from '../parse';
import { defaultSortTasks } from '../sort';
import { TheTask } from '../TheTask';
import { ContextProvider } from '../treeViewProviders/contextProvider';
import { ProjectProvider } from '../treeViewProviders/projectProvider';
import { TagProvider } from '../treeViewProviders/tagProvider';
import { TaskProvider } from '../treeViewProviders/taskProvider';
import { DueState, ItemForProvider, TreeItemSortType, VscodeContext } from '../types';
import { getActiveOrDefaultDocument } from '../utils/extensionUtils';
import { forEachTask } from '../utils/taskUtils';
import { setContext } from '../utils/vscodeUtils';
import { updateWebviewView } from '../webview/webviewView';

export const tagProvider = new TagProvider([]);
export const projectProvider = new ProjectProvider([]);
export const contextProvider = new ContextProvider([]);
export const taskProvider = new TaskProvider([]);
export const dueProvider = new TaskProvider([]);
export const archivedProvider = new TaskProvider([], true);

const generic1Provider = new TaskProvider([]);
const generic2Provider = new TaskProvider([]);
const generic3Provider = new TaskProvider([]);

let tagsView: vscode.TreeView<any>;
let projectView: vscode.TreeView<any>;
let contextView: vscode.TreeView<any>;
export let tasksView: vscode.TreeView<any>;
let dueView: vscode.TreeView<any>;
let archivedView: vscode.TreeView<any>;
let generic1View: vscode.TreeView<any>;
let generic2View: vscode.TreeView<any>;
let generic3View: vscode.TreeView<any>;
/**
 * Create all Tree Views
 */
export function createAllTreeViews() {
	tagsView = vscode.window.createTreeView(Constants.tagsTreeViewId, {
		treeDataProvider: tagProvider,
		showCollapseAll: true,
	});

	projectView = vscode.window.createTreeView(Constants.projectsTreeViewId, {
		treeDataProvider: projectProvider,
		showCollapseAll: true,
	});

	contextView = vscode.window.createTreeView(Constants.contextsTreeViewId, {
		treeDataProvider: contextProvider,
		showCollapseAll: true,
	});

	dueView = vscode.window.createTreeView(Constants.dueTreeViewId, {
		treeDataProvider: dueProvider,
		showCollapseAll: true,
	});

	tasksView = vscode.window.createTreeView(Constants.tasksTreeViewId, {
		treeDataProvider: taskProvider,
		showCollapseAll: true,
	});
	tasksView.onDidCollapseElement(async event => {
		toggleTaskCollapse(await getActiveOrDefaultDocument(), (event.element.task as TheTask).lineNumber);
	});
	tasksView.onDidExpandElement(async event => {
		toggleTaskCollapse(await getActiveOrDefaultDocument(), (event.element.task as TheTask).lineNumber);
	});

	archivedView = vscode.window.createTreeView(Constants.archivedTreeViewId, {
		treeDataProvider: archivedProvider,
	});

	if (extensionConfig.treeViews.length) {
		const generic1 = extensionConfig.treeViews[0];
		if (generic1) {
			if (typeof generic1.filter !== 'string' || typeof generic1.title !== 'string') {
				vscode.window.showWarningMessage('Tree View must have filter and title and they must be strings.');
			} else {
				generic1View = vscode.window.createTreeView(Constants.generic1TreeViewId, {
					treeDataProvider: generic1Provider,
					showCollapseAll: true,
				});
				generic1View.onDidCollapseElement(async event => {
					toggleTaskCollapse(await getActiveOrDefaultDocument(), (event.element.task as TheTask).lineNumber);
				});
				generic1View.onDidExpandElement(async event => {
					toggleTaskCollapse(await getActiveOrDefaultDocument(), (event.element.task as TheTask).lineNumber);
				});
				setContext(VscodeContext.generic1FilterExists, true);
			}
		}

		const generic2 = extensionConfig.treeViews[1];
		if (generic2) {
			if (typeof generic2.filter !== 'string' || typeof generic2.title !== 'string') {
				vscode.window.showWarningMessage('Tree View must have filter and title and they must be strings.');
			} else {
				generic2View = vscode.window.createTreeView(Constants.generic2TreeViewId, {
					treeDataProvider: generic2Provider,
					showCollapseAll: true,
				});
				generic2View.onDidCollapseElement(async event => {
					toggleTaskCollapse(await getActiveOrDefaultDocument(), (event.element.task as TheTask).lineNumber);
				});
				generic2View.onDidExpandElement(async event => {
					toggleTaskCollapse(await getActiveOrDefaultDocument(), (event.element.task as TheTask).lineNumber);
				});
				setContext(VscodeContext.generic2FilterExists, true);
			}
		}

		const generic3 = extensionConfig.treeViews[2];
		if (generic3) {
			if (typeof generic3.filter !== 'string' || typeof generic3.title !== 'string') {
				vscode.window.showWarningMessage('Tree View must have filter and title and they must be strings.');
			} else {
				generic3View = vscode.window.createTreeView(Constants.generic3TreeViewId, {
					treeDataProvider: generic3Provider,
					showCollapseAll: true,
				});
				generic3View.onDidCollapseElement(async event => {
					toggleTaskCollapse(await getActiveOrDefaultDocument(), (event.element.task as TheTask).lineNumber);
				});
				generic3View.onDidExpandElement(async event => {
					toggleTaskCollapse(await getActiveOrDefaultDocument(), (event.element.task as TheTask).lineNumber);
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
 * Update all tree views (excluding archived tasks)
 */
export function updateAllTreeViews(): void {
	tagProvider.refresh(extensionState.tagsForTreeView);
	setViewTitle(tagsView, 'tags', extensionState.tagsForTreeView.length);

	updateTasksTreeView();

	const dueTasks = extensionState.tasksAsTree.filter(task => task.due?.isDue === DueState.due || task.due?.isDue === DueState.overdue);
	dueProvider.refresh(defaultSortTasks(dueTasks));
	setViewTitle(dueView, 'due', dueTasks.length);

	projectProvider.refresh(extensionState.projectsForTreeView);
	setViewTitle(projectView, 'projects', extensionState.projectsForTreeView.length);

	contextProvider.refresh(extensionState.contextsForTreeView);
	setViewTitle(contextView, 'contexts', extensionState.contextsForTreeView.length);

	if (generic1View) {
		const filteredTasks = filterItems(extensionState.tasksAsTree, extensionConfig.treeViews[0].filter);
		generic1Provider.refresh(filteredTasks);
		setViewTitle(generic1View, extensionConfig.treeViews[0].title, filteredTasks.length);
	}
	if (generic2View) {
		const filteredTasks = filterItems(extensionState.tasksAsTree, extensionConfig.treeViews[1].filter);
		generic2Provider.refresh(filteredTasks);
		setViewTitle(generic2View, extensionConfig.treeViews[1].title, filteredTasks.length);
	}
	if (generic3View) {
		const filteredTasks = filterItems(extensionState.tasksAsTree, extensionConfig.treeViews[2].filter);
		generic3Provider.refresh(filteredTasks);
		setViewTitle(generic3View, extensionConfig.treeViews[2].title, filteredTasks.length);
	}
	// ──────────────────────────────────────────────────────────────────────
	updateWebviewView();
}
/**
 * Update only Tasks Tree View
 */
export function updateTasksTreeView() {
	let tasksForProvider;
	if (extensionState.taskTreeViewFilterValue) {
		tasksForProvider = filterItems(extensionState.tasksAsTree, extensionState.taskTreeViewFilterValue);
	} else {
		tasksForProvider = extensionState.tasksAsTree;
	}
	taskProvider.refresh(tasksForProvider);
	setViewTitle(tasksView, 'tasks', tasksForProvider.length);
}
/**
 * Update archived Tasks Tree View (since it's only changing on archiving of the task, which is rare)
 */
export function updateArchivedTasksTreeView() {
	const archivedTasks = extensionState.archivedTasks;
	archivedProvider.refresh(archivedTasks);
	setViewTitle(archivedView, 'archived', archivedTasks.length);
}
/**
 * Set tree view title
 */
function setViewTitle(view: TreeView<any>, title: string, counter: number, filterValue = '') {
	view.title = `${title} (${counter}) ${filterValue}`;
}

export interface ParsedItems {
	tags: string[];
	contexts: string[];
	projects: string[];
	tagsForProvider: ItemForProvider[];
	projectsForProvider: ItemForProvider[];
	contextsForProvider: ItemForProvider[];
}
interface TempTitleLineNumberMap {
	[title: string]: TheTask[];
}
/**
 * Prepare tags/projects/context for Tree View
 */
export function groupAndSortTreeItems(tasks: TheTask[]): ParsedItems {
	const tagMap: TempTitleLineNumberMap = {};
	const projectMap: TempTitleLineNumberMap = {};
	const contextMap: TempTitleLineNumberMap = {};
	forEachTask(task => {
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
	});
	const tagsForProvider: ItemForProvider[] = [];
	for (const key in tagMap) {
		tagsForProvider.push({
			title: key,
			tasks: tagMap[key],
		});
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

	sortItemsForProvider(tagsForProvider, extensionConfig.sortTagsView);
	sortItemsForProvider(projectsForProvider, extensionConfig.sortProjectsView);
	sortItemsForProvider(contextsForProvider, extensionConfig.sortContextsView);

	return {
		contextsForProvider,
		projectsForProvider,
		tagsForProvider,
		tags: Object.keys(tagMap),
		projects: Object.keys(projectMap),
		contexts: Object.keys(contextMap),
	};
}
/**
 * Sort future Tree items. (Only first level).
 */
function sortItemsForProvider(items: ItemForProvider[], sortType: TreeItemSortType) {
	if (sortType === TreeItemSortType.alphabetic) {
		items.sort((a, b) => a.title.localeCompare(b.title));
	} else {
		items.sort((a, b) => b.tasks.length - a.tasks.length);
	}
}

/**
 * Updates state and Tree View for archived tasks
 */
export async function updateArchivedTasks() {
	if (!extensionConfig.defaultArchiveFile) {
		return;
	}
	const archivedDocument = await getArchivedDocument();
	const parsedArchiveTasks = await parseDocument(archivedDocument);
	extensionState.archivedTasks = parsedArchiveTasks.tasks;
	updateArchivedTasksTreeView();
}

export async function getArchivedDocument() {
	return await workspace.openTextDocument(vscode.Uri.file(extensionConfig.defaultArchiveFile));
}
