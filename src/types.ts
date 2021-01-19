import vscode, { DecorationRenderOptions } from 'vscode';
import { Priority, TheTask } from './TheTask';

export interface ItemForProvider {
	title: string;
	tasks: TheTask[];
}

export interface State {
	tasks: TheTask[];
	tasksAsTree: TheTask[];
	archivedTasks: TheTask[];
	tags: string[];
	projects: string[];
	contexts: string[];
	lastVisitByFile: {
		[filePath: string]: Date;
	};
	tagsForTreeView: ItemForProvider[];
	projectsForTreeView: ItemForProvider[];
	contextsForTreeView: ItemForProvider[];
	commentLines: vscode.Range[];

	theRightFileOpened: boolean;
	taskTreeViewFilterValue: string;
	extensionContext: vscode.ExtensionContext;
	activeDocument: vscode.TextDocument | undefined;
	activeDocumentTabSize: number;
}

export const enum DueState {
	notDue,
	due,
	overdue,
	invalid,
}

export enum SortTags {
	alphabetic = 'alphabetic',
	frequency = 'frequency',
}
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
}
export interface IExtensionConfig {
	isDev: boolean;
	addCreationDate: boolean;
	addCompletionDate: boolean;
	completionDateIncludeTime: boolean;
	creationDateIncludeTime: boolean;
	defaultPriority: Priority;
	autoArchiveTasks: boolean;
	confirmTaskDelete: 'always' | 'hasNestedTasks' | 'never';
	statusBarCounterEnabled: boolean;

	sortTagsView: SortTags;

	doneSymbol: string;
	activatePattern: string;

	tags: string[];
	projects: string[];
	contexts: string[];

	decorations: {
		[key in AdvancedDecorations]: DecorationRenderOptions;
	};

	tabSize: number;

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

	treeViews: {
		title: string;
		filter: string;
	}[];
	getNextNumberOfTasks: number;

	webview: {
		autoShowSuggest: boolean;
		showCompleted: boolean;
		showRecurringNotDue: boolean;
		showRecurringCompleted: boolean;
		completedStrikeThrough: boolean;
		showPriority: boolean;
		fontSize: string;
		fontFamily: string;
		customCheckboxEnabled: boolean;
		checkboxStyle: string;
		padding: string;
		tagStyles: {
			[tagName: string]: {
				color: string;
				backgroundColor: string;
			};
		};
	};
}

export const enum VscodeContext {
	isActive = 'todomd:isActive',
	isDev = 'todomd:isDev',
	filterActive = 'todomd:filterActive',
	generic1FilterExists = 'todomd:generic1FilterExists',
	generic2FilterExists = 'todomd:generic2FilterExists',
	generic3FilterExists = 'todomd:generic3FilterExists',
}

export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;

interface WebviewMessageBase {
	type: string;
	value: unknown;
}
// From extension to webview
interface WebviewMessageUpdateEverything extends WebviewMessageBase {
	type: 'updateEverything';
	value: {
		tasks: TheTask[];
		tags: string[];
		projects: string[];
		contexts: string[];
		defaultFileSpecified: boolean;
		activeDocumentOpened: boolean;
		config: IExtensionConfig['webview'];
	};
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
	type: 'updateTitle';
	value: number;
}
export type WebviewMessage = WebviewMessageDecrementCount | WebviewMessageDeleteTask | WebviewMessageGoToTask | WebviewMessageIncrementCount | WebviewMessageShowNotification | WebviewMessageToggleCollapse | WebviewMessageToggleDone | WebviewMessageUpdateEverything | WebviewMessageUpdateTitle;
