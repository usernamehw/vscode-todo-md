import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import relativeTime from 'dayjs/plugin/relativeTime';
import vscode, { ExtensionContext, window, workspace } from 'vscode';
import { registerAllCommands, updateArchivedTasks } from './commands';
import { updateDecorationStyle } from './decorations';
import { getDocumentForDefaultFile, resetAllRecurringTasks } from './documentActions';
import { checkIfNeedResetRecurringTasks, onChangeActiveTextEditor, updateEverything } from './events';
import { parseDocument } from './parse';
import { StatusBar } from './statusBar';
import { createAllTreeViews, groupAndSortTreeItems, updateAllTreeViews } from './treeViewProviders/treeViews';
import { IExtensionConfig, State, VscodeContext } from './types';
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
	lastVisitByFile: {},
	taskTreeViewFilterValue: '',
	extensionContext: undefined as any as ExtensionContext,
	activeDocument: undefined,
};


export const EXTENSION_NAME = 'todomd';
export const LAST_VISIT_BY_FILE_STORAGE_KEY = 'LAST_VISIT_BY_FILE_STORAGE_KEY';

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

	static hoverDisposable: vscode.Disposable;

	static changeTextDocumentDisposable: vscode.Disposable;
	static changeActiveTextEditorDisposable: vscode.Disposable;

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
	const lastVisitByFile = extensionContext.globalState.get<State['lastVisitByFile'] | undefined>(LAST_VISIT_BY_FILE_STORAGE_KEY);
	state.lastVisitByFile = lastVisitByFile ? lastVisitByFile : {};

	updateDecorationStyle();
	registerAllCommands();
	createAllTreeViews();

	const defaultFileDocument = await getDocumentForDefaultFile();
	if (defaultFileDocument) {
		const filePath = defaultFileDocument.uri.toString();
		const needReset = checkIfNeedResetRecurringTasks(filePath);
		if (needReset) {
			await resetAllRecurringTasks(defaultFileDocument, needReset.lastVisit);
			state.lastVisitByFile[filePath] = new Date();
			await updateLastVisitGlobalState();
		}
	}

	onChangeActiveTextEditor(window.activeTextEditor);
	await updateState();

	Global.webviewProvider = new TasksWebviewViewProvider(state.extensionContext.extensionUri);
	state.extensionContext.subscriptions.push(
		vscode.window.registerWebviewViewProvider(TasksWebviewViewProvider.viewType, Global.webviewProvider),
	);

	updateAllTreeViews();
	updateArchivedTasks();
	updateIsDevContext();

	Global.changeActiveTextEditorDisposable = window.onDidChangeActiveTextEditor(onChangeActiveTextEditor);

	function onConfigChange(e: vscode.ConfigurationChangeEvent): void {
		if (!e.affectsConfiguration(EXTENSION_NAME)) return;
		updateConfig();
	}

	function updateConfig(): void {
		extensionConfig = workspace.getConfiguration(EXTENSION_NAME) as any as IExtensionConfig;

		disposeEditorDisposables();
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
export async function updateState() {
	let document = state.activeDocument;
	if (!document) {
		document = await getDocumentForDefaultFile();
	}
	if (!document) {
		state.activeDocument = undefined;
		state.theRightFileOpened = false;
		state.tasks = [];
		state.tags = [];
		state.contexts = [];
		state.projects = [];
		state.commentLines = [];
		state.projectsForTreeView = [];
		state.tagsForTreeView = [];
		state.contextsForTreeView = [];
		return;
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
}
function disposeEditorDisposables(): void {
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
export async function updateLastVisitGlobalState() {
	return await state.extensionContext.globalState.update(LAST_VISIT_BY_FILE_STORAGE_KEY, state.lastVisitByFile);
}

export function deactivate(): void {
	disposeEditorDisposables();
	Global.tagAutocompleteDisposable.dispose();
	Global.projectAutocompleteDisposable.dispose();
	Global.contextAutocompleteDisposable.dispose();
	Global.generalAutocompleteDisposable.dispose();
	Global.changeTextDocumentDisposable.dispose();
	Global.hoverDisposable.dispose();
	Global.changeActiveTextEditorDisposable.dispose();
}
