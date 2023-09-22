import { DecorationRenderOptions } from 'vscode';
import { TheTask } from './TheTask';

/**
 * Object describing items for Tree View Provider
 */
export interface ItemForProvider {
	title: string;
	tasks: TheTask[];
}
/**
 * Due date possible values
 */
export const enum IsDue {
	NotDue,
	Due,
	Overdue,
	Invalid,
}
/**
 * tags Tree View sorting options
 */
export const enum TreeItemSortType {
	Alphabetic = 'alphabetic',
	Count = 'count',
}
export const enum SortNestedTasks {
	Default = 'default',
	None = 'none',
}
/**
 * Advanced decorations allowing to change any available editor decoration options (borders, outline, background, foreground, before, after...)
 *
 * https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions
 */
const enum AdvancedDecorations {
	Project = 'project',
	Context = 'context',
	Tag = 'tag',
	Comment = 'comment',
	NotDue = 'notDue',
	Due = 'due',
	Overdue = 'overdue',
	InvalidDue = 'invalidDue',
	Favorite = 'favorite',
	PriorityA = 'priorityA',
	PriorityB = 'priorityB',
	PriorityC = 'priorityC',
	PriorityD = 'priorityD',
	PriorityE = 'priorityE',
	PriorityF = 'priorityF',
	CompletedTask = 'completedTask',
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
	 * Whether to include date when completing a task: `{cm}` vs `{cm:2020-04-30}`
	 */
	completionDateIncludeDate: boolean;
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
	 * Configure appearance/behavior of main status bar item (shows next task to complete).
	 */
	mainStatusBarItem: {
		enabled: boolean;
		hoverEnabled: boolean;
		alignment: 'left' | 'right';
		priority: number;
		onClick: 'completeTask' | 'nothing' | 'revealTask';
		targetTasks: 'all' | 'due';
	};
	/**
	 * Configure appearance/behavior of the counter status bar item (shows only when active text editor matches `#todomd.activatePattern#`) with text format: `1/3 33%`.
	 */
	progressStatusBarItem: {
		enabled: boolean;
		alignment: 'left' | 'right';
		priority: number;
	};
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
	 * Add items to autocomplete and optional description on hover.
	 */
	suggestItems: Record<string, string>;
	/**
	 * Shows small badge to show a number of times the tag/project/context is present in the active document.
	 */
	counterBadgeEnabled: boolean;
	/**
	 * Controls whether editor nested task decoration (pie chart) is shown or not.
	 */
	progressChartEnabled: boolean;
	/**
	 * Editor decoration for nested tasks progress (pie chart) background.
	 */
	progressBackground: string;
	/**
	 * Editor decoration for nested tasks progress (pie chart) foreground.
	 */
	progressForeground: string;
	/**
	 * Advanced decorations allowing to change any available editor decoration options (borders, outline, background, foreground, before, after...)
	 */
	decorations: Record<LiteralUnion<AdvancedDecorations>, DecorationRenderOptions>;
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
	 * Absolute path to file that is used as a \"someday\" file.
	 */
	defaultSomedayFile: string;
	/**
	 * Add more tree views with predefined filters.
	 */
	treeViews: {
		title: string;
		filter: string;
	}[];
	treeView: {
		/**
		 * Whether or not to show due tasks counter badge for tree view container.
		 */
		showBadge: boolean;
		/**
		 * When checked - will use vscode api to show checkboxes https://github.com/microsoft/vscode/issues/116141.
		 */
		useVscodeCheckboxApi: boolean;
	};
	/**
	 * Number of tasks returned by `getFewNextTasks` command.
	 */
	getNextNumberOfTasks: number;
	/**
	 * Prefix for task that is due in labels (tree view, notification, modal, quick pick).
	 */
	labelDueSymbol: string;
	/**
	 * Prefix for task that that is not due in labels (tree view, notification, modal, quick pick).
	 */
	labelNotDueSymbol: string;
	/**
	 * Prefix for task that is overdue in labels (tree view, notification, modal, quick pick).
	 */
	labelOverdueSymbol: string;
	/**
	 * Prefix for task that has invalid due date in labels (tree view, notification, modal, quick pick).
	 */
	labelInvalidDueSymbol: string;
	/**
	 * Label shown when task has favorite `{f}` special tag.
	 */
	labelFavorite: string;
	/**
	 * Show projects/tags/contexts in labels (tree view, notification, modal, quick pick).
	 */
	labelShowItems: boolean;
	/**
	 * Show projects/tags/contexts in labels in **BOLD**.
	 */
	useBoldTextInLabels: boolean;
	/**
	 * When enabled - editor decoration that shows number of days to the due date adds the weekday name.
	 */
	closestDueDateIncludeWeekday: boolean;
	/**
	 * When completing overdue recurring task - replace the starting date with today's date.
	 */
	autoBumpRecurringOverdueDate: boolean;
	/**
	 * Week day when using set due date command or suggest `SET_DUE_THIS_WEEK`.
	 */
	setDueDateThisWeekDay: 'Friday' | 'Sunday';
	/**
	 * Week day when using set due date command or suggest `SET_DUE_NEXT_WEEK`.
	 */
	setDueDateNextWeekDay: 'Friday' | 'Monday' | 'Sunday';
	/**
	 * Show strike-through text decoration for completed tasks in editor.
	 */
	completedStrikeThrough: boolean;
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
		 * Controls whether nested tasks indicator (like 0/10) is shown in the webview.
		 */
		showNestedTaskCount: boolean;
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
		 * Focus filter input after clicking(selecting) any task.
		 */
		focusFilterInputOnClick: boolean;
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
	IsActive = 'todomd:isActive',
	IsDev = 'todomd:isDev',
	FilterActive = 'todomd:filterActive',
	Generic1FilterExists = 'todomd:generic1FilterExists',
	Generic2FilterExists = 'todomd:generic2FilterExists',
	Generic3FilterExists = 'todomd:generic3FilterExists',
	ArchivedFileNotSpecified = 'todomd:archivedFileNotSpecified',
}
/**
 * Helper type makes all properties optional with exceptions of required ones
 */
export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;

interface WebviewMessageBase {
	type: string;
	value: unknown;
}
export interface ItemWithCount {
	title: string;
	count: number;
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
		config: ExtensionConfig;
		projectsWithCount: ItemWithCount[];
		tagsWithCount: ItemWithCount[];
		contextsWithCount: ItemWithCount[];
	};
}
interface WebviewMessageFocusFilterInput {
	type: 'focusFilterInput';
}
interface WebviewMessageShowAddNewTaskModal {
	type: 'showAddNewTaskModal';
}
// ────────────────────────────────────────────────────────────
// ──── From webview to extension ─────────────────────────────
// ────────────────────────────────────────────────────────────
interface WebviewMessageToggleDone extends WebviewMessageBase {
	type: 'toggleDone';
	value: number;
}
interface WebviewMessageToggleDoneOrIncrementCount extends WebviewMessageBase {
	type: 'toggleDoneOrIncrementCount';
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
interface WebviewMessageRevealTask extends WebviewMessageBase {
	type: 'revealTask';
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
	value: {
		numberOfTasks: number;
		numberOfCompletedTasks: number;
	};
}
interface WebviewMessageFollowLink extends WebviewMessageBase {
	type: 'followLink';
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
interface WebviewMessageToggleFavorite extends WebviewMessageBase {
	type: 'toggleFavorite';
	value: number;
}
interface WebviewMessageToggleHidden extends WebviewMessageBase {
	type: 'toggleHidden';
	value: number;
}
interface WebviewMessageLoaded extends WebviewMessageBase {
	type: 'webviewLoaded';
	value: true;
}
interface WebviewAddNewTask extends WebviewMessageBase {
	type: 'addNewTask';
	value: {
		rawTaskText: string;
		parentTaskLineNumber: number | undefined;
	};
}
/**
 * Messages that can only be sent from webview to extension.
 */
export type MessageFromWebview = WebviewAddNewTask | WebviewMessageDecrementCount | WebviewMessageDeleteTask | WebviewMessageEditTask | WebviewMessageEditTaskRawText | WebviewMessageFollowLink | WebviewMessageLoaded | WebviewMessageRevealTask | WebviewMessageSetDueDate | WebviewMessageShowNotification | WebviewMessageStartTask | WebviewMessageToggleCollapse | WebviewMessageToggleDone | WebviewMessageToggleDoneOrIncrementCount | WebviewMessageToggleFavorite | WebviewMessageToggleHidden | WebviewMessageToggleTaskCollapseRecursive | WebviewMessageUpdateTitle;
/**
 * Messages that can only be sent from extension to webview.
 */
export type MessageToWebview = WebviewMessageFocusFilterInput | WebviewMessageShowAddNewTaskModal | WebviewMessageUpdateEverything;

/**
 * Keep autocomplete for the union type with `| string`.
 * https://github.com/microsoft/TypeScript/issues/29729
 */
export type LiteralUnion<T extends U, U = string> = T | (Record<never, never> & U);
