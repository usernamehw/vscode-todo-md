import { TreeView, TreeViewExpansionEvent, Uri, WebviewView, window, workspace } from 'vscode';
import { Constants } from '../constants';
import { toggleTaskCollapse } from '../documentActions';
import { $config, $state, updateState } from '../extension';
import { filterTasks } from '../filter';
import { parseDocument } from '../parse';
import { defaultSortTasks } from '../sort';
import { showCompletedPercentage } from '../statusBar';
import { TheTask } from '../TheTask';
import { ContextProvider } from '../treeViewProviders/contextProvider';
import { ProjectProvider } from '../treeViewProviders/projectProvider';
import { TagProvider } from '../treeViewProviders/tagProvider';
import { TaskProvider } from '../treeViewProviders/taskProvider';
import { ItemForProvider, TreeItemSortType, VscodeContext } from '../types';
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

let tagsView: TreeView<any>;
let projectView: TreeView<any>;
let contextView: TreeView<any>;
export let tasksView: TreeView<any>;
let dueView: TreeView<any>;
let archivedView: TreeView<any>;
let generic1View: TreeView<any>;
let generic2View: TreeView<any>;
let generic3View: TreeView<any>;
/**
 * Create all Tree Views
 */
export function createAllTreeViews() {
	tagsView = window.createTreeView(Constants.TagsTreeViewId, {
		treeDataProvider: tagProvider,
		showCollapseAll: true,
	});

	projectView = window.createTreeView(Constants.ProjectsTreeViewId, {
		treeDataProvider: projectProvider,
		showCollapseAll: true,
	});

	contextView = window.createTreeView(Constants.ContextsTreeViewId, {
		treeDataProvider: contextProvider,
		showCollapseAll: true,
	});

	dueView = window.createTreeView(Constants.DueTreeViewId, {
		treeDataProvider: dueProvider,
		showCollapseAll: true,
	});

	dueView.onDidCollapseElement(onElementCollapseExpand);
	dueView.onDidExpandElement(onElementCollapseExpand);

	tasksView = window.createTreeView(Constants.TasksTreeViewId, {
		treeDataProvider: taskProvider,
		showCollapseAll: true,
	});
	tasksView.onDidCollapseElement(onElementCollapseExpand);
	tasksView.onDidExpandElement(onElementCollapseExpand);

	archivedView = window.createTreeView(Constants.ArchivedTreeViewId, {
		treeDataProvider: archivedProvider,
	});

	if ($config.treeViews.length) {
		const generic1 = $config.treeViews[0];
		if (generic1) {
			if (typeof generic1.filter !== 'string' || typeof generic1.title !== 'string') {
				window.showWarningMessage('Tree View must have filter and title and they must be strings.');
			} else {
				generic1View = window.createTreeView(Constants.Generic1TreeViewId, {
					treeDataProvider: generic1Provider,
					showCollapseAll: true,
				});
				generic1View.onDidCollapseElement(onElementCollapseExpand);
				generic1View.onDidExpandElement(onElementCollapseExpand);
				setContext(VscodeContext.Generic1FilterExists, true);
			}
		}

		const generic2 = $config.treeViews[1];
		if (generic2) {
			if (typeof generic2.filter !== 'string' || typeof generic2.title !== 'string') {
				window.showWarningMessage('Tree View must have filter and title and they must be strings.');
			} else {
				generic2View = window.createTreeView(Constants.Generic2TreeViewId, {
					treeDataProvider: generic2Provider,
					showCollapseAll: true,
				});
				generic2View.onDidCollapseElement(onElementCollapseExpand);
				generic2View.onDidExpandElement(onElementCollapseExpand);
				setContext(VscodeContext.Generic2FilterExists, true);
			}
		}

		const generic3 = $config.treeViews[2];
		if (generic3) {
			if (typeof generic3.filter !== 'string' || typeof generic3.title !== 'string') {
				window.showWarningMessage('Tree View must have filter and title and they must be strings.');
			} else {
				generic3View = window.createTreeView(Constants.Generic3TreeViewId, {
					treeDataProvider: generic3Provider,
					showCollapseAll: true,
				});
				generic3View.onDidCollapseElement(onElementCollapseExpand);
				generic3View.onDidExpandElement(onElementCollapseExpand);
				setContext(VscodeContext.Generic3FilterExists, true);
			}
		}
	} else {
		setContext(VscodeContext.Generic1FilterExists, false);
		setContext(VscodeContext.Generic2FilterExists, false);
		setContext(VscodeContext.Generic3FilterExists, false);
	}
}
/**
 * Update all tree views (excluding archived tasks)
 */
export function updateAllTreeViews() {
	tagProvider.refresh($state.tagsForTreeView);
	setViewTitle(tagsView, 'tags', $state.tagsForTreeView.length);

	updateTasksTreeView();

	const notCompletedDueTasks = filterTasks($state.tasksAsTree, '$due -$done').tasks;
	dueProvider.refresh(defaultSortTasks(notCompletedDueTasks));
	setViewTitle(dueView, 'due', notCompletedDueTasks.length);
	setViewBadge(dueView, notCompletedDueTasks.length, 'Number of due tasks.');

	projectProvider.refresh($state.projectsForTreeView);
	setViewTitle(projectView, 'projects', $state.projectsForTreeView.length);

	contextProvider.refresh($state.contextsForTreeView);
	setViewTitle(contextView, 'contexts', $state.contextsForTreeView.length);

	if (generic1View) {
		const filteredTasks = filterTasks($state.tasksAsTree, $config.treeViews[0].filter).tasks;
		generic1Provider.refresh(filteredTasks);
		setViewTitle(generic1View, $config.treeViews[0].title, filteredTasks.length);
	}
	if (generic2View) {
		const filteredTasks = filterTasks($state.tasksAsTree, $config.treeViews[1].filter).tasks;
		generic2Provider.refresh(filteredTasks);
		setViewTitle(generic2View, $config.treeViews[1].title, filteredTasks.length);
	}
	if (generic3View) {
		const filteredTasks = filterTasks($state.tasksAsTree, $config.treeViews[2].filter).tasks;
		generic3Provider.refresh(filteredTasks);
		setViewTitle(generic3View, $config.treeViews[2].title, filteredTasks.length);
	}
	// ──────────────────────────────────────────────────────────────────────
	updateWebviewView();
}
/**
 * Update only Tasks Tree View
 */
export function updateTasksTreeView() {
	const tasksForProvider = filterTasks($state.tasksAsTree, $state.taskTreeViewFilterValue).tasks;
	let tasksCount = 0;
	let completedTasksCount = 0;
	forEachTask((task => {
		tasksCount++;
		if (task.done) {
			completedTasksCount++;
		}
	}), tasksForProvider);
	taskProvider.refresh(tasksForProvider);
	tasksView.title = `tasks ${showCompletedPercentage(tasksCount, completedTasksCount)}`;
}
/**
 * Update archived Tasks Tree View (since it's only changing on archiving of the task, which is rare)
 */
export function updateArchivedTasksTreeView() {
	const archivedTasks = $state.archivedTasks;
	archivedProvider.refresh(archivedTasks);
	setViewTitle(archivedView, 'archived', archivedTasks.length);
}
/**
 * Set tree view title.
 */
function setViewTitle(view: TreeView<any>, title: string, counter: number) {
	view.title = `${title} (${counter})`;
}
/**
 * Set webview view or tree view numerical badge that is shown for
 * the view container.
 */
export function setViewBadge(view: TreeView<any> | WebviewView | undefined, value: number, tooltip: string): void {
	if (!view) {
		return;
	}
	if ($config.treeView.showBadge) {
		view.badge = {
			value,
			tooltip: value ? tooltip : '',
		};
	} else {
		view.badge = {
			tooltip: '',
			value: 0,
		};
	}
}
/**
 * Tags/Projects/Contexts grouped and sorted for Tree Views.
 */
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

	sortItemsForProvider(tagsForProvider, $config.sortTagsView);
	sortItemsForProvider(projectsForProvider, $config.sortProjectsView);
	sortItemsForProvider(contextsForProvider, $config.sortContextsView);

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
	if (sortType === TreeItemSortType.Alphabetic) {
		items.sort((a, b) => a.title.localeCompare(b.title));
	} else {
		items.sort((a, b) => b.tasks.length - a.tasks.length);
	}
}

/**
 * Updates state and Tree View for archived tasks
 */
export async function updateArchivedTasks() {
	if (!$config.defaultArchiveFile) {
		return;
	}
	const archivedDocument = await getArchivedDocument();
	const parsedArchiveTasks = await parseDocument(archivedDocument);
	$state.archivedTasks = parsedArchiveTasks.tasks;
	updateArchivedTasksTreeView();
}
/**
 * Open and return `TextDocument` for archived file.
 */
export async function getArchivedDocument() {
	return await workspace.openTextDocument(Uri.file($config.defaultArchiveFile));
}

async function onElementCollapseExpand(event: TreeViewExpansionEvent<any>) {
	await toggleTaskCollapse(await getActiveOrDefaultDocument(), (event.element.task as TheTask)?.lineNumber);
	await updateState();
	// TODO: doesn't work for tree views ...
	updateAllTreeViews();
}
