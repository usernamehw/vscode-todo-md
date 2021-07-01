import { DecorationRenderOptions, ExtensionContext, Range, TextDocument } from 'vscode';
import { TheTask } from './TheTask';
/**
 * Object describing items for Tree View Provider
 */
export interface ItemForProvider {
	title: string;
	tasks: TheTask[];
}
/**
 * Things extension keeps a global reference to and uses extensively throughout the extension
 */
export interface ExtensionState {
	/**
	 * All tasks (not as tree)
	 */
	tasks: TheTask[];
	/**
	 * Tasks in a tree format (`task.subtasks` contains nested items)
	 */
	tasksAsTree: TheTask[];
	/**
	 * All archived tasks
	 */
	archivedTasks: TheTask[];
	/**
	 * All tags
	 */
	tags: string[];
	/**
	 * All projects
	 */
	projects: string[];
	/**
	 * All contexts
	 */
	contexts: string[];
	/**
	 * Last time file was opened (for resetting completion of recurring tasks)
	 */
	lastVisitByFile: {
		[filePath: string]: Date;
	};
	/**
	 * Tags sorted and grouped for tags Tree View
	 */
	tagsForTreeView: ItemForProvider[];
	/**
	 * Projects sorted and grouped for projects Tree View
	 */
	projectsForTreeView: ItemForProvider[];
	/**
	 * Contexts sorted and grouped for contexts Tree View
	 */
	contextsForTreeView: ItemForProvider[];
	/**
	 * Comment line ranges
	 */
	commentLines: Range[];
	/**
	 * If active text editor matches `activatePattern` config
	 */
	theRightFileOpened: boolean;
	/**
	 * Current filter value of tasks Tree View
	 */
	taskTreeViewFilterValue: string;
	/**
	 * Reference to extension context for access beyond the `activate()` function
	 */
	extensionContext: ExtensionContext;
	/**
	 * Reference to active document.
	 * TODO: use `getActiveDocument()` everywhere
	 */
	activeDocument: TextDocument | undefined;
	/**
	 * Used in parsing of nested tasks.
	 */
	activeDocumentTabSize: number;
}
/**
 * Due date possible values
 */
export const enum DueState {
	notDue,
	due,
	overdue,
	invalid,
}
/**
 * tags Tree View sorting options
 */
export const enum TreeItemSortType {
	alphabetic = 'alphabetic',
	count = 'count',
}
export const enum SortNestedTasks {
	default = 'default',
	none = 'none',
}
/**
 * Advanced decorations allowing to change any available editor decoration options (borders, outline, background, foreground, before, after...)
 *
 * https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions
 */
const enum AdvancedDecorations {
	project = 'project',
	context = 'context',
	comment = 'comment',
	notDue = 'notDue',
	due = 'due',
	overdue = 'overdue',
	invalidDue = 'invalidDue',
	priorityAForeground = 'priorityAForeground',
	priorityBForeground = 'priorityBForeground',
	priorityCForeground = 'priorityCForeground',
	priorityDForeground = 'priorityDForeground',
	priorityEForeground = 'priorityEForeground',
	priorityFForeground = 'priorityFForeground',
	completedTask = 'completedTask',
}
/**
 * Extension options available to user. Names should match **"configuration"** object properties in `package.json` file.
 */
export interface ExtensionConfig {
	/**
	 * When true - shows more items in Command Palette.
	 */
	isDev: boolean;
	/**
	 * When creating a task add creation date to it: `{cr:2020-04-30}`
	 */
	addCreationDate: boolean;
	/**
	 * When completing a task add date and time: `{cm:2020-04-30T09:11:17}`
	 */
	completionDateIncludeTime: boolean;
	/**
	 * When creating a task add date and time: `{cr:2020-04-30T09:11:17}`
	 */
	creationDateIncludeTime: boolean;
	/**
	 * When enabled - will move tasks to archive file (on completion).
	 */
	autoArchiveTasks: boolean;
	/**
	 * Show confirmation when deleting task from Tree View or Webview.
	 */
	confirmTaskDelete: 'always' | 'hasNestedTasks' | 'never';
	/**
	 * Controls visibility of status bar task progress item `1/3 33%`
	 */
	statusBarCounterEnabled: boolean;
	/**
	 * Controls tags Tree View sorting.
	 */
	sortTagsView: TreeItemSortType;
	/**
	 * Controls projects Tree View sorting.
	 */
	sortProjectsView: TreeItemSortType;
	/**
	 * Controls contexts Tree View sorting.
	 */
	sortContextsView: TreeItemSortType;
	/**
	 * Controls task sorting in tags/projects/contexts Tree Views.
	 */
	sortNestedTasks: SortNestedTasks;
	/**
	 * Choose files that extension will operate on (Glob).
	 */
	activatePattern: string;
	/**
	 * When enabled - duration (editor, hover) includes seconds.
	 */
	durationIncludeSeconds: boolean;
	/**
	 * Tags added to autocomplete.
	 */
	tags: string[];
	/**
	 * Projects added to autocomplete.
	 */
	projects: string[];
	/**
	 * Contexts added to autocomplete.
	 */
	contexts: string[];
	/**
	 * Advanced decorations allowing to change any available editor decoration options (borders, outline, background, foreground, before, after...)
	 */
	decorations: {
		[key in AdvancedDecorations]: DecorationRenderOptions;
	};
	/**
	 * Number used for parsing nested tasks when indentation cannot be guessed (file is not opened in editor).
	 */
	tabSize: number;
	/**
	 * Filters that you can pick when applying a filter.
	 */
	savedFilters: {
		title: string;
		filter: string;
	}[];
	/**
	 * Absolute file path to default file. (Used for webview or TreeView when no active file is opened)
	 */
	defaultFile: string;
	/**
	 * Absolute file path to archive file
	 */
	defaultArchiveFile: string;
	/**
	 * Add more tree views with predefined filters.
	 */
	treeViews: {
		title: string;
		filter: string;
	}[];
	/**
	 * Number of tasks returned by `getFewNextTasks` command.
	 */
	getNextNumberOfTasks: number;
	/**
	 * Options only applied to webview
	 */
	webview: {
		/**
		 * Show autocomplete when typing. (When disabled suggest can be called by `Ctrl`+`Space`)
		 */
		autoShowSuggest: boolean;
		/**
		 * If `true` - show transparent scrollbar on top of items.
		 */
		scrollbarOverflow: boolean;
		/**
		 * Whether completed tasks are shown or not in the webview.
		 */
		showCompleted: boolean;
		/**
		 * Whether recurring not due tasks are shown or not in the webview.
		 */
		showRecurringUpcoming: boolean;
		/**
		 * Whether recurring completed tasks are shown or not in the webview.
		 */
		showRecurringCompleted: boolean;
		/**
		 * Whether completed tasks should have a line drawn on them in the webview.
		 */
		completedStrikeThrough: boolean;
		/**
		 * When true - show box on the bottom of the webview with selected task details.
		 */
		showTaskDetails: boolean;
		/**
		 * Controls whether priority is shown in the webview.
		 */
		showPriority: boolean;
		/**
		 * Controls whether checkbox is shown in the webview.
		 */
		showCheckbox: boolean;
		/**
		 * When true - show notification after completing a task.
		 */
		notificationsEnabled: boolean;
		/**
		* Controls font size in the webview.
		*/
		fontSize: string;
		/**
		 * Controls font family in the webview.
		 */
		fontFamily: string;
		/**
		 * Controls line height in the webview.
		 */
		lineHeight: number;
		/**
		 * Whether checkbox is rendered as native input element or a custom styled element.
		 */
		customCheckboxEnabled: boolean;
		/**
		 * Controls spacing between items in a list.
		 */
		padding: string;
		/**
		 * Visual distance of nested items.
		 */
		indentSize: string;
		/**
		 * Set different color for any tag in a webview.
		 */
		tagStyles: {
			[tagName: string]: {
				color: string;
				backgroundColor: string;
			};
		};
		/**
		 * Absolute path to custom CSS for the webview.
		 */
		customCSSPath: string;
	};
}
/**
 * This extension context names
 */
export const enum VscodeContext {
	isExtensionActivated = 'todomd.isExtensionActivated',
	isActive = 'todomd:isActive',
	isDev = 'todomd:isDev',
	filterActive = 'todomd:filterActive',
	generic1FilterExists = 'todomd:generic1FilterExists',
	generic2FilterExists = 'todomd:generic2FilterExists',
	generic3FilterExists = 'todomd:generic3FilterExists',
}
/**
 * Helper type makes all properties optional with exceptions of required ones
 */
export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;

interface WebviewMessageBase {
	type: string;
	value: unknown;
}
// From extension to webview
interface WebviewMessageUpdateEverything extends WebviewMessageBase {
	type: 'updateEverything';
	value: {
		tasksAsTree: TheTask[];
		tags: string[];
		projects: string[];
		contexts: string[];
		defaultFileSpecified: boolean;
		activeDocumentOpened: boolean;
		config: ExtensionConfig['webview'];
	};
}
interface WebviewMessageFocusFilterInput {
	type: 'focusFilterInput';
}
// From webview to extension
interface WebviewMessageToggleDone extends WebviewMessageBase {
	type: 'toggleDone';
	value: number;
}
interface WebviewMessageToggleCollapse extends WebviewMessageBase {
	type: 'toggleTaskCollapse';
	value: number;
}
interface WebviewMessageToggleTaskCollapseRecursive extends WebviewMessageBase {
	type: 'toggleTaskCollapseRecursive';
	value: number;
}
interface WebviewMessageShowNotification extends WebviewMessageBase {
	type: 'showNotification';
	value: string;
}
interface WebviewMessageGoToTask extends WebviewMessageBase {
	type: 'goToTask';
	value: number;
}
interface WebviewMessageIncrementCount extends WebviewMessageBase {
	type: 'incrementCount';
	value: number;
}
interface WebviewMessageDecrementCount extends WebviewMessageBase {
	type: 'decrementCount';
	value: number;
}
interface WebviewMessageDeleteTask extends WebviewMessageBase {
	type: 'deleteTask';
	value: number;
}
interface WebviewMessageUpdateTitle extends WebviewMessageBase {
	type: 'updateWebviewTitle';
	value: number;
}
interface WebviewMessageOpenFileByPath extends WebviewMessageBase {
	type: 'openFileByPath';
	value: string;
}
interface WebviewMessageOpenFileInDefaultApp extends WebviewMessageBase {
	type: 'openInDefaultApp';
	value: string;
}
interface WebviewMessageEditTaskRawText extends WebviewMessageBase {
	type: 'editTaskRawText';
	value: {
		lineNumber: number;
		newRawText: string;
	};
}
interface WebviewMessageEditTask extends WebviewMessageBase {
	type: 'editTask';
	value: TheTask;
}
interface WebviewMessageSetDueDate extends WebviewMessageBase {
	type: 'setDueDate';
	value: number;
}
interface WebviewMessageStartTask extends WebviewMessageBase {
	type: 'startTask';
	value: number;
}
/**
 * Messages that can only be sent from webview to extension.
 */
export type MessageFromWebview = WebviewMessageDecrementCount | WebviewMessageDeleteTask | WebviewMessageEditTask | WebviewMessageEditTaskRawText | WebviewMessageGoToTask | WebviewMessageIncrementCount | WebviewMessageOpenFileByPath | WebviewMessageOpenFileInDefaultApp | WebviewMessageSetDueDate | WebviewMessageShowNotification | WebviewMessageStartTask | WebviewMessageToggleCollapse | WebviewMessageToggleDone | WebviewMessageToggleTaskCollapseRecursive | WebviewMessageUpdateTitle;
/**
 * Messages that can only be sent from extension to webview.
 */
export type MessageToWebview = WebviewMessageFocusFilterInput | WebviewMessageUpdateEverything;

export const enum CommandIds {
	toggleDone = 'todomd.toggleDone',
	hideTask = 'todomd.hideTask',
	collapseAllNestedTasks = 'todomd.collapseAllNestedTasks',
	expandAllTasks = 'todomd.expandAllTasks',
	focusTasksWebviewAndInput = 'todomd.focusTasksWebviewAndInput',
	deleteTask = 'todomd.deleteTask',
	archiveCompletedTasks = 'todomd.archiveCompletedTasks',
	archiveSelectedCompletedTasks = 'todomd.archiveSelectedCompletedTasks',
	startTask = 'todomd.startTask',
	sortByPriority = 'todomd.sortByPriority',
	sortByDefault = 'todomd.sortByDefault',
	createSimilarTask = 'todomd.createSimilarTask',
	getNextTask = 'todomd.getNextTask',
	getFewNextTasks = 'todomd.getFewNextTasks',
	getRandomTask = 'todomd.getRandomTask',
	addTaskToDefaultFile = 'todomd.addTaskToDefaultFile',
	addTaskToActiveFile = 'todomd.addTaskToActiveFile',
	setDueDate = 'todomd.setDueDate',
	setDueDateWithArgs = 'todomd.setDueDateWithArgs',
	openDefaultArchiveFile = 'todomd.openDefaultArchiveFile',
	openDefaultFile = 'todomd.openDefaultFile',
	specifyDefaultFile = 'todomd.specifyDefaultFile',
	specifyDefaultArchiveFile = 'todomd.specifyDefaultArchiveFile',
	completeTask = 'todomd.completeTask',
	filter = 'todomd.filter',
	clearFilter = 'todomd.clearFilter',
	clearGlobalState = 'todomd.clearGlobalState',
	showGlobalState = 'todomd.showGlobalState',
	removeAllOverdue = 'todomd.removeAllOverdue',
	goToLine = 'todomd.goToLine',
	goToLineInArchived = 'todomd.goToLineInArchived',
	resetAllRecurringTasks = 'todomd.resetAllRecurringTasks',
	followLink = 'todomd.followLink',
	setLastVisit = 'todomd.setLastVisit',
	incrementPriority = 'todomd.incrementPriority',
	decrementPriority = 'todomd.decrementPriority',
	showWebviewSettings = 'todomd.showWebviewSettings',
	webviewToggleShowRecurringUpcoming = 'todomd.webview.toggleShowRecurringUpcoming',
	toggleComment = 'todomd.toggleComment',
	toggleTagsTreeViewSorting = 'todomd.toggleTagsTreeViewSorting',
	toggleProjectsTreeViewSorting = 'todomd.toggleProjectsTreeViewSorting',
	toggleContextsTreeViewSorting = 'todomd.toggleContextsTreeViewSorting',
	sortTaskParts = 'todomd.sortTaskParts',
	// ──── Dev ───────────────────────────────────────────────────
	replaceWithToday = 'todomd.dev.replaceDateWithToday',
}
