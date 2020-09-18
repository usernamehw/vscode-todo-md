import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import relativeTime from 'dayjs/plugin/relativeTime';
import { registerAllCommands, resetAllRecurringTasks, updateArchivedTasks } from 'src/commands';
import { updateDecorationStyle } from 'src/decorations';
import { checkIfNewDayArrived, onChangeActiveTextEditor, updateEverything } from 'src/events';
import { parseDocument } from 'src/parse';
import { StatusBar } from 'src/statusBar';
import { TheTask } from 'src/TheTask';
import { createAllTreeViews, updateAllTreeViews } from 'src/treeViewProviders/treeViews';
import { IExtensionConfig, ItemForProvider, Items, SortTags, State } from 'src/types';
import { TasksWebviewViewProvider, updateWebviewView } from 'src/webview/webviewView';
import vscode, { window, workspace } from 'vscode';

dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(isoWeek);
dayjs.Ls.en.weekStart = 1;

export const state: State = {
	tasks: [],
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
};

export const EXTENSION_NAME = 'todomd';
export const LAST_VISIT_STORAGE_KEY = 'LAST_VISIT_STORAGE_KEY';

export let extensionConfig = workspace.getConfiguration(EXTENSION_NAME) as any as IExtensionConfig;
export const statusBar = new StatusBar();
/**
 * Global variables
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

	await updateState();

	const isNewDay = checkIfNewDayArrived();
	if (isNewDay && !state.theRightFileOpened) {
		resetAllRecurringTasks();
	}

	updateAllTreeViews();
	updateArchivedTasks();

	Global.webviewProvider = new TasksWebviewViewProvider(state.extensionContext.extensionUri);
	state.extensionContext.subscriptions.push(
		vscode.window.registerWebviewViewProvider(TasksWebviewViewProvider.viewType, Global.webviewProvider),
	);

	setTimeout(() => {
		updateWebviewView(state.tasks);
	}, 2000);

	onChangeActiveTextEditor(window.activeTextEditor);
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
	}

	extensionContext.subscriptions.push(workspace.onDidChangeConfiguration(onConfigChange));
}

export async function updateState(document?: vscode.TextDocument) {
	if (!document) {
		document = await getDocumentForDefaultFile();
	}
	const parsedDocument = await parseDocument(document);

	state.tasks = parsedDocument.tasks;
	state.commentLines = parsedDocument.commentLines;

	const treeItems = groupAndSortTreeItems(state.tasks);
	state.tagsForTreeView = treeItems.sortedTags;
	state.projectsForTreeView = treeItems.projects;
	state.contextsForTreeView = treeItems.contexts;

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

interface TreeItems {
	sortedTags: ItemForProvider[];
	projects: ItemForProvider[];
	contexts: ItemForProvider[];
}
interface TempItemsMap {
	[title: string]: Items[];
}
export function groupAndSortTreeItems(tasks: TheTask[]): TreeItems {
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
	const tags: ItemForProvider[] = [];
	for (const key in tagMap) {
		tags.push({
			title: key,
			items: tagMap[key],
		});
	}
	let sortedTags: ItemForProvider[];
	if (extensionConfig.sortTagsView === SortTags.alphabetic) {
		sortedTags = tags.sort((a, b) => a.title.localeCompare(b.title));
	} else {
		sortedTags = tags.sort((a, b) => b.items.length - a.items.length);
	}

	const projects: ItemForProvider[] = [];
	for (const key in projectMap) {
		projects.push({
			title: key,
			items: projectMap[key],
		});
	}
	const contexts: ItemForProvider[] = [];
	for (const key in contextMap) {
		contexts.push({
			title: key,
			items: contextMap[key],
		});
	}
	return {
		contexts,
		projects,
		sortedTags,
	};
}

export async function getDocumentForDefaultFile() {
	return await workspace.openTextDocument(vscode.Uri.file(extensionConfig.defaultFile));
}

export function deactivate(): void {
	disposeEverything();
}
