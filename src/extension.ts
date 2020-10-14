import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import relativeTime from 'dayjs/plugin/relativeTime';
import vscode, { window, workspace } from 'vscode';
import { registerAllCommands, updateArchivedTasks } from './commands';
import { updateDecorationStyle } from './decorations';
import { getDocumentForDefaultFile, resetAllRecurringTasks } from './documentActions';
import { checkIfNewDayArrived, onChangeActiveTextEditor, updateEverything } from './events';
import { parseDocument } from './parse';
import { StatusBar } from './statusBar';
import { TheTask } from './TheTask';
import { createAllTreeViews, updateAllTreeViews } from './treeViewProviders/treeViews';
import { IExtensionConfig, ItemForProvider, Items, SortTags, State, VscodeContext } from './types';
import { setContext } from './vscodeUtils';
import { TasksWebviewViewProvider } from './webview/webviewView';

dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(isoWeek);
dayjs.Ls.en.weekStart = 1;

export const state: State = {
	tasks: [],
	tags: [],
	projects: [],
	contexts: [],
	tagsForTreeView: [],
	projectsForTreeView: [],
	contextsForTreeView: [],
	archivedTasks: [],
	commentLines: [],
	theRightFileOpened: false,
	fileWasReset: false,
	newDayArrived: false,
	taskTreeViewFilterValue: '',
	// @ts-ignore
	extensionContext: undefined,
	activeDocument: undefined,
};

export const EXTENSION_NAME = 'todomd';
export const LAST_VISIT_STORAGE_KEY = 'LAST_VISIT_STORAGE_KEY';

export let extensionConfig = workspace.getConfiguration(EXTENSION_NAME) as any as IExtensionConfig;
export const statusBar = new StatusBar();
/**
 * Global vscode variables
 */
export class Global {
	static webviewProvider: TasksWebviewViewProvider;

	static tagAutocompleteDisposable: vscode.Disposable;
	static projectAutocompleteDisposable: vscode.Disposable;
	static contextAutocompleteDisposable: vscode.Disposable;
	static generalAutocompleteDisposable: vscode.Disposable;

	static changeTextDocumentDisposable: vscode.Disposable;

	static completedTaskDecorationType: vscode.TextEditorDecorationType;
	static commentDecorationType: vscode.TextEditorDecorationType;
	static priorityADecorationType: vscode.TextEditorDecorationType;
	static priorityBDecorationType: vscode.TextEditorDecorationType;
	static priorityCDecorationType: vscode.TextEditorDecorationType;
	static priorityDDecorationType: vscode.TextEditorDecorationType;
	static priorityEDecorationType: vscode.TextEditorDecorationType;
	static priorityFDecorationType: vscode.TextEditorDecorationType;
	static tagsDecorationType: vscode.TextEditorDecorationType;
	static specialTagDecorationType: vscode.TextEditorDecorationType;
	static tagsDelimiterDecorationType: vscode.TextEditorDecorationType;
	static projectDecorationType: vscode.TextEditorDecorationType;
	static contextDecorationType: vscode.TextEditorDecorationType;
	static notDueDecorationType: vscode.TextEditorDecorationType;
	static dueDecorationType: vscode.TextEditorDecorationType;
	static overdueDecorationType: vscode.TextEditorDecorationType;
	static invalidDueDateDecorationType: vscode.TextEditorDecorationType;
	static closestDueDateDecorationType: vscode.TextEditorDecorationType;
}

export async function activate(extensionContext: vscode.ExtensionContext) {
	state.extensionContext = extensionContext;

	updateDecorationStyle();
	registerAllCommands();
	createAllTreeViews();

	onChangeActiveTextEditor(window.activeTextEditor);
	await updateState();

	setTimeout(() => {
		const isNewDay = checkIfNewDayArrived();
		if (isNewDay) {
			resetAllRecurringTasks();
			updateEverything();
		}
	}, 1000);

	updateAllTreeViews();
	updateArchivedTasks();
	updateIsDevContext();

	Global.webviewProvider = new TasksWebviewViewProvider(state.extensionContext.extensionUri);
	state.extensionContext.subscriptions.push(
		vscode.window.registerWebviewViewProvider(TasksWebviewViewProvider.viewType, Global.webviewProvider),
	);

	window.onDidChangeActiveTextEditor(onChangeActiveTextEditor);

	function onConfigChange(e: vscode.ConfigurationChangeEvent): void {
		if (!e.affectsConfiguration(EXTENSION_NAME)) return;
		updateConfig();
	}

	function updateConfig(): void {
		extensionConfig = workspace.getConfiguration(EXTENSION_NAME) as any as IExtensionConfig;

		disposeEverything();
		updateDecorationStyle();
		updateEverything();
		updateIsDevContext();
	}
	function updateIsDevContext() {
		if (process.env.NODE_ENV === 'development' || extensionConfig.isDev) {
			setContext(VscodeContext.isDev, true);
		}
	}

	extensionContext.subscriptions.push(workspace.onDidChangeConfiguration(onConfigChange));
}
/**
 * Update primary `state` properties, such as `tasks` or `tags`, based on provided document or based on default file
 */
export async function updateState(document?: vscode.TextDocument) { // TODO: should it even require argument?
	if (!document) {
		document = state.activeDocument;
	}
	if (!document) {
		document = await getDocumentForDefaultFile();
	}
	if (!document) {
		return undefined;
	}
	const parsedDocument = await parseDocument(document);

	state.tasks = parsedDocument.tasks;
	state.commentLines = parsedDocument.commentLines;

	const treeItems = groupAndSortTreeItems(state.tasks);
	state.tagsForTreeView = treeItems.sortedTagsForProvider;
	state.projectsForTreeView = treeItems.projectsForProvider;
	state.contextsForTreeView = treeItems.contextsForProvider;
	state.tags = treeItems.tags;
	state.projects = treeItems.projects;
	state.contexts = treeItems.contexts;

	return document;
}
function disposeEverything(): void {
	if (Global.completedTaskDecorationType) {
		// if one set - that means that all decorations are set
		Global.completedTaskDecorationType.dispose();
		Global.commentDecorationType.dispose();
		Global.priorityADecorationType.dispose();
		Global.priorityBDecorationType.dispose();
		Global.priorityCDecorationType.dispose();
		Global.priorityDDecorationType.dispose();
		Global.priorityEDecorationType.dispose();
		Global.priorityFDecorationType.dispose();
		Global.tagsDecorationType.dispose();
		Global.specialTagDecorationType.dispose();
		Global.tagsDelimiterDecorationType.dispose();
		Global.projectDecorationType.dispose();
		Global.contextDecorationType.dispose();
		Global.notDueDecorationType.dispose();
		Global.dueDecorationType.dispose();
		Global.overdueDecorationType.dispose();
		Global.invalidDueDateDecorationType.dispose();
		Global.closestDueDateDecorationType.dispose();
	}
	if (Global.changeTextDocumentDisposable) {
		Global.changeTextDocumentDisposable.dispose();
	}
}

interface ParsedItems {
	tags: string[];
	contexts: string[];
	projects: string[];
	sortedTagsForProvider: ItemForProvider[];
	projectsForProvider: ItemForProvider[];
	contextsForProvider: ItemForProvider[];
}
interface TempItemsMap {
	[title: string]: Items[];
}
export function groupAndSortTreeItems(tasks: TheTask[]): ParsedItems {
	const tagMap: TempItemsMap = {};
	const projectMap: TempItemsMap = {};
	const contextMap: TempItemsMap = {};
	for (const task of tasks) {
		// Tags grouping
		for (const tag of task.tags) {
			if (!tagMap[tag]) {
				tagMap[tag] = [];
			}
			tagMap[tag].push({
				lineNumber: task.lineNumber,
				title: task.title,
			});
		}
		// Projects grouping
		if (task.projects.length) {
			for (const project of task.projects) {
				if (!projectMap[project]) {
					projectMap[project] = [];
				}
				projectMap[project].push({
					lineNumber: task.lineNumber,
					title: task.title,
				});
			}
		}
		// Contexts grouping
		if (task.contexts.length) {
			for (const context of task.contexts) {
				if (!contextMap[context]) {
					contextMap[context] = [];
				}
				contextMap[context].push({
					lineNumber: task.lineNumber,
					title: task.title,
				});
			}
		}
	}
	const tagsForProvider: ItemForProvider[] = [];
	for (const key in tagMap) {
		tagsForProvider.push({
			title: key,
			items: tagMap[key],
		});
	}
	let sortedTagsForProvider: ItemForProvider[];
	if (extensionConfig.sortTagsView === SortTags.alphabetic) {
		sortedTagsForProvider = tagsForProvider.sort((a, b) => a.title.localeCompare(b.title));
	} else {
		sortedTagsForProvider = tagsForProvider.sort((a, b) => b.items.length - a.items.length);
	}

	const projectsForProvider: ItemForProvider[] = [];
	for (const key in projectMap) {
		projectsForProvider.push({
			title: key,
			items: projectMap[key],
		});
	}
	const contextsForProvider: ItemForProvider[] = [];
	for (const key in contextMap) {
		contextsForProvider.push({
			title: key,
			items: contextMap[key],
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

export function deactivate(): void {
	disposeEverything();
}
