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
import { CounterStatusBar, MainStatusBar } from './statusBar';
import { TheTask } from './TheTask';
import { createAllTreeViews, groupAndSortTreeItems, updateAllTreeViews, updateArchivedTasks } from './treeViewProviders/treeViews';
import { ExtensionConfig, ItemForProvider, VscodeContext } from './types';
import { updateUserSuggestItems } from './userSuggestItems';
import { getActiveDocument, getDocumentForDefaultFile } from './utils/extensionUtils';
import { getEditorLineHeight, setContext } from './utils/vscodeUtils';
import { TasksWebviewViewProvider } from './webview/webviewView';

dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(isoWeek);
dayjs.extend(duration);
dayjs.Ls.en.weekStart = 1;
/**
 * Things extension keeps a global reference to and uses extensively
 */
export abstract class $state {
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
	/** Editor line height (in px) */
	static editorLineHeight = 20;
}


export const enum Constants {
	extensionSettingsPrefix = 'todomd',
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

	extensionMenuPrefix = 'Todo MD:',

	THROTTLE_EVERYTHING = 120,
}

export let $config = workspace.getConfiguration().get(Constants.extensionSettingsPrefix) as ExtensionConfig;
export const counterStatusBar = new CounterStatusBar();
export const mainStatusBar = new MainStatusBar();
mainStatusBar.show();
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
	static tagWithDelimiterDecorationType: TextEditorDecorationType;
	static tagsDelimiterDecorationType: TextEditorDecorationType;
	static specialTagDecorationType: TextEditorDecorationType;
	static projectDecorationType: TextEditorDecorationType;
	static contextDecorationType: TextEditorDecorationType;
	static notDueDecorationType: TextEditorDecorationType;
	static dueDecorationType: TextEditorDecorationType;
	static overdueDecorationType: TextEditorDecorationType;
	static invalidDueDateDecorationType: TextEditorDecorationType;
	static closestDueDateDecorationType: TextEditorDecorationType;
	static nestedTasksCountDecorationType: TextEditorDecorationType;
	static nestedTasksPieDecorationType: TextEditorDecorationType;

	static userSpecifiedAdvancedTagDecorations: boolean;
}

export async function activate(extensionContext: ExtensionContext) {
	$state.extensionContext = extensionContext;
	const lastVisitByFile = extensionContext.globalState.get<typeof $state['lastVisitByFile'] | undefined>(Constants.LAST_VISIT_BY_FILE_STORAGE_KEY);
	$state.lastVisitByFile = lastVisitByFile ? lastVisitByFile : {};

	$state.editorLineHeight = getEditorLineHeight();
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

	// setTimeout(() => {
	onChangeActiveTextEditor(window.activeTextEditor);// Trigger on change event at activation
	// });
	await updateState();

	Global.webviewProvider = new TasksWebviewViewProvider($state.extensionContext.extensionUri);
	$state.extensionContext.subscriptions.push(
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
		if (!e.affectsConfiguration(Constants.extensionSettingsPrefix)) {
			return;
		}
		updateConfig();
	}

	function updateConfig() {
		$config = workspace.getConfiguration().get(Constants.extensionSettingsPrefix) as ExtensionConfig;

		disposeEditorDisposables();
		$state.editorLineHeight = getEditorLineHeight();
		updateEditorDecorationStyle();
		updateUserSuggestItems();
		mainStatusBar.show();
		onChangeActiveTextEditor(window.activeTextEditor);
		updateIsDevContext();
	}
	function updateIsDevContext() {
		if (process.env.NODE_ENV === 'development' || $config.isDev) {
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
		$state.tasks = [];
		$state.tasksAsTree = [];
		$state.tags = [];
		$state.projects = [];
		$state.contexts = [];
		$state.tagsForTreeView = [];
		$state.projectsForTreeView = [];
		$state.contextsForTreeView = [];
		$state.commentLines = [];
		$state.theRightFileOpened = false;
		$state.activeDocument = undefined;
		return;
	}
	const parsedDocument = await parseDocument(document);

	$state.tasks = parsedDocument.tasks;
	$state.tasksAsTree = parsedDocument.tasksAsTree;
	$state.commentLines = parsedDocument.commentLines;

	const treeItems = groupAndSortTreeItems($state.tasksAsTree);
	$state.tagsForTreeView = treeItems.tagsForProvider;
	$state.projectsForTreeView = treeItems.projectsForProvider;
	$state.contextsForTreeView = treeItems.contextsForProvider;
	$state.tags = treeItems.tags;
	$state.projects = treeItems.projects;
	$state.contexts = treeItems.contexts;
}
function disposeEditorDisposables() {
	Global.completedTaskDecorationType?.dispose();
	Global.commentDecorationType?.dispose();
	Global.priorityADecorationType?.dispose();
	Global.priorityBDecorationType?.dispose();
	Global.priorityCDecorationType?.dispose();
	Global.priorityDDecorationType?.dispose();
	Global.priorityEDecorationType?.dispose();
	Global.priorityFDecorationType?.dispose();
	Global.tagsDecorationType?.dispose();
	Global.tagWithDelimiterDecorationType?.dispose();
	Global.tagsDelimiterDecorationType?.dispose();
	Global.specialTagDecorationType?.dispose();
	Global.projectDecorationType?.dispose();
	Global.contextDecorationType?.dispose();
	Global.notDueDecorationType?.dispose();
	Global.dueDecorationType?.dispose();
	Global.overdueDecorationType?.dispose();
	Global.invalidDueDateDecorationType?.dispose();
	Global.closestDueDateDecorationType?.dispose();
	Global.nestedTasksCountDecorationType?.dispose();
	Global.nestedTasksPieDecorationType?.dispose();
	Global.changeTextDocumentDisposable?.dispose();
}
/**
 * Update global storage value of last visit by file
 */
export async function updateLastVisitGlobalState(stringUri: string, date: Date) {
	$state.lastVisitByFile[stringUri] = date;
	await $state.extensionContext.globalState.update(Constants.LAST_VISIT_BY_FILE_STORAGE_KEY, $state.lastVisitByFile);
}

export function deactivate() {
	disposeEditorDisposables();
	Global.tagAutocompleteDisposable?.dispose();
	Global.projectAutocompleteDisposable?.dispose();
	Global.contextAutocompleteDisposable?.dispose();
	Global.generalAutocompleteDisposable?.dispose();
	Global.specialTagsAutocompleteDisposable?.dispose();
	Global.setDueDateAutocompleteDisposable?.dispose();
	Global.changeTextDocumentDisposable?.dispose();
	Global.hoverDisposable?.dispose();
	Global.documentHighlightsDisposable?.dispose();
	Global.renameProviderDisposable?.dispose();
	Global.referenceProviderDisposable?.dispose();
	Global.changeActiveTextEditorDisposable?.dispose();
}
