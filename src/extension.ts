import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import relativeTime from 'dayjs/plugin/relativeTime';
import throttle from 'lodash/throttle';
import { ConfigurationChangeEvent, Disposable, ExtensionContext, Range, TextDocument, TextEditorDecorationType, window, workspace } from 'vscode';
import { registerAllCommands } from './commands';
import { updateEditorDecorationStyle } from './decorations';
import { resetAllRecurringTasks } from './documentActions';
import { checkIfNeedResetRecurringTasks, onChangeActiveTextEditor } from './events';
import { parseDocument } from './parse';
import { StatusBar } from './statusBar';
import { TheTask } from './TheTask';
import { createAllTreeViews, groupAndSortTreeItems, updateAllTreeViews, updateArchivedTasks } from './treeViewProviders/treeViews';
import { ExtensionConfig, ItemForProvider, VscodeContext } from './types';
import { updateUserSuggestItems } from './userSuggestItems';
import { getActiveDocument, getDocumentForDefaultFile } from './utils/extensionUtils';
import { setContext } from './utils/vscodeUtils';
import { TasksWebviewViewProvider } from './webview/webviewView';

dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(isoWeek);
dayjs.extend(duration);
dayjs.Ls.en.weekStart = 1;
/**
 * Things extension keeps a global reference to and uses extensively
 */
export abstract class extensionState {
	/** All tasks (not as tree) */
	static tasks: TheTask[] = [];
	/** Tasks in a tree format (`task.subtasks` contains nested items) */
	static tasksAsTree: TheTask[] = [];
	/** All archived tasks */
	static archivedTasks: TheTask[] = [];
	/** All tags */
	static tags: string[] = [];
	/** All projects */
	static projects: string[] = [];
	/** All contexts */
	static contexts: string[] = [];
	static suggestTags: Record<string, string> = {};
	static suggestProjects: Record<string, string> = {};
	static suggestContexts: Record<string, string> = {};
	/** Tags sorted and grouped for tags Tree View */
	static tagsForTreeView: ItemForProvider[] = [];
	/** Projects sorted and grouped for projects Tree View */
	static projectsForTreeView: ItemForProvider[] = [];
	/** Contexts sorted and grouped for contexts Tree View */
	static contextsForTreeView: ItemForProvider[] = [];
	/** Comment line ranges */
	static commentLines: Range[] = [];
	/** If active text editor matches `activatePattern` config */
	static theRightFileOpened = false;
	/** Last time file was opened (for resetting completion of recurring tasks) */
	static lastVisitByFile: Record<string, Date> = {};
	/** Current filter value of tasks Tree View */
	static taskTreeViewFilterValue = '';
	/** Reference to the extension context for access beyond the `activate()` function */
	static extensionContext = {} as any as ExtensionContext;
	/** Reference to active document. */
	static activeDocument: TextDocument | undefined = undefined;
	/** Used in parsing of nested tasks. */
	static activeDocumentTabSize = 4;
}


export const enum Constants {
	EXTENSION_NAME = 'todomd',
	LAST_VISIT_BY_FILE_STORAGE_KEY = 'LAST_VISIT_BY_FILE_STORAGE_KEY',

	tagsTreeViewId = 'todomd.tags',
	projectsTreeViewId = 'todomd.projects',
	contextsTreeViewId = 'todomd.contexts',
	dueTreeViewId = 'todomd.due',
	tasksTreeViewId = 'todomd.tasks',
	archivedTreeViewId = 'todomd.archived',
	generic1TreeViewId = 'todomd.generic1',
	generic2TreeViewId = 'todomd.generic2',
	generic3TreeViewId = 'todomd.generic3',

	defaultFileSetting = 'todomd.defaultFile',
	defaultArchiveFileSetting = 'todomd.defaultArchiveFile',

	THROTTLE_EVERYTHING = 120,
}

export let extensionConfig = workspace.getConfiguration().get(Constants.EXTENSION_NAME) as ExtensionConfig;
export const statusBar = new StatusBar();
/**
 * Global vscode variables (mostly disposables)
 */
export class Global {
	static webviewProvider: TasksWebviewViewProvider;

	static tagAutocompleteDisposable: Disposable;
	static projectAutocompleteDisposable: Disposable;
	static contextAutocompleteDisposable: Disposable;
	static generalAutocompleteDisposable: Disposable;
	static specialTagsAutocompleteDisposable: Disposable;
	static setDueDateAutocompleteDisposable: Disposable;

	static hoverDisposable: Disposable;
	static documentHighlightsDisposable: Disposable;
	static renameProviderDisposable: Disposable;
	static referenceProviderDisposable: Disposable;
	static changeTextDocumentDisposable: Disposable;
	static changeActiveTextEditorDisposable: Disposable;

	static completedTaskDecorationType: TextEditorDecorationType;
	static commentDecorationType: TextEditorDecorationType;
	static priorityADecorationType: TextEditorDecorationType;
	static priorityBDecorationType: TextEditorDecorationType;
	static priorityCDecorationType: TextEditorDecorationType;
	static priorityDDecorationType: TextEditorDecorationType;
	static priorityEDecorationType: TextEditorDecorationType;
	static priorityFDecorationType: TextEditorDecorationType;
	static tagsDecorationType: TextEditorDecorationType;
	static specialTagDecorationType: TextEditorDecorationType;
	static tagsDelimiterDecorationType: TextEditorDecorationType;
	static projectDecorationType: TextEditorDecorationType;
	static contextDecorationType: TextEditorDecorationType;
	static notDueDecorationType: TextEditorDecorationType;
	static dueDecorationType: TextEditorDecorationType;
	static overdueDecorationType: TextEditorDecorationType;
	static invalidDueDateDecorationType: TextEditorDecorationType;
	static closestDueDateDecorationType: TextEditorDecorationType;
}

export async function activate(extensionContext: ExtensionContext) {
	extensionState.extensionContext = extensionContext;
	const lastVisitByFile = extensionContext.globalState.get<typeof extensionState['lastVisitByFile'] | undefined>(Constants.LAST_VISIT_BY_FILE_STORAGE_KEY);
	extensionState.lastVisitByFile = lastVisitByFile ? lastVisitByFile : {};

	updateEditorDecorationStyle();
	updateUserSuggestItems();
	registerAllCommands();
	createAllTreeViews();

	const defaultFileDocument = await getDocumentForDefaultFile();
	if (defaultFileDocument) {
		const filePath = defaultFileDocument.uri.toString();
		const needReset = checkIfNeedResetRecurringTasks(filePath);
		if (needReset) {
			await resetAllRecurringTasks(defaultFileDocument, needReset.lastVisit);
			await updateLastVisitGlobalState(filePath, new Date());
		}
	}

	onChangeActiveTextEditor(window.activeTextEditor);// Trigger on change event at activation
	await updateState();

	Global.webviewProvider = new TasksWebviewViewProvider(extensionState.extensionContext.extensionUri);
	extensionState.extensionContext.subscriptions.push(
		window.registerWebviewViewProvider(TasksWebviewViewProvider.viewType, Global.webviewProvider),
	);

	updateAllTreeViews();
	updateArchivedTasks();
	updateIsDevContext();

	/**
	 * The event is fired twice quickly when closing an editor, also when swtitching to untitled file ???
	 */
	Global.changeActiveTextEditorDisposable = window.onDidChangeActiveTextEditor(throttle(onChangeActiveTextEditor, 20, {
		leading: false,
	}));

	function onConfigChange(e: ConfigurationChangeEvent) {
		if (!e.affectsConfiguration(Constants.EXTENSION_NAME)) {
			return;
		}
		updateConfig();
	}

	function updateConfig() {
		extensionConfig = workspace.getConfiguration().get(Constants.EXTENSION_NAME) as ExtensionConfig;

		disposeEditorDisposables();
		updateEditorDecorationStyle();
		updateUserSuggestItems();
		onChangeActiveTextEditor(window.activeTextEditor);
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
	let document = await getActiveDocument();
	if (!document) {
		document = await getDocumentForDefaultFile();
	}
	if (!document) {
		extensionState.tasks = [];
		extensionState.tasksAsTree = [];
		extensionState.tags = [];
		extensionState.projects = [];
		extensionState.contexts = [];
		extensionState.tagsForTreeView = [];
		extensionState.projectsForTreeView = [];
		extensionState.contextsForTreeView = [];
		extensionState.commentLines = [];
		extensionState.theRightFileOpened = false;
		extensionState.activeDocument = undefined;
		return;
	}
	const parsedDocument = await parseDocument(document);

	extensionState.tasks = parsedDocument.tasks;
	extensionState.tasksAsTree = parsedDocument.tasksAsTree;
	extensionState.commentLines = parsedDocument.commentLines;

	const treeItems = groupAndSortTreeItems(extensionState.tasksAsTree);
	extensionState.tagsForTreeView = treeItems.tagsForProvider;
	extensionState.projectsForTreeView = treeItems.projectsForProvider;
	extensionState.contextsForTreeView = treeItems.contextsForProvider;
	extensionState.tags = treeItems.tags;
	extensionState.projects = treeItems.projects;
	extensionState.contexts = treeItems.contexts;
}
function disposeEditorDisposables() {
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
/**
 * Update global storage value of last visit by file
 */
export async function updateLastVisitGlobalState(stringUri: string, date: Date) {
	extensionState.lastVisitByFile[stringUri] = date;
	await extensionState.extensionContext.globalState.update(Constants.LAST_VISIT_BY_FILE_STORAGE_KEY, extensionState.lastVisitByFile);
}

export function deactivate() {
	disposeEditorDisposables();
	Global.tagAutocompleteDisposable.dispose();
	Global.projectAutocompleteDisposable.dispose();
	Global.contextAutocompleteDisposable.dispose();
	Global.generalAutocompleteDisposable.dispose();
	Global.specialTagsAutocompleteDisposable.dispose();
	Global.setDueDateAutocompleteDisposable.dispose();
	Global.changeTextDocumentDisposable.dispose();
	Global.hoverDisposable.dispose();
	Global.documentHighlightsDisposable.dispose();
	Global.renameProviderDisposable.dispose();
	Global.referenceProviderDisposable.dispose();
	Global.changeActiveTextEditorDisposable.dispose();
}
