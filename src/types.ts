import { Priority, TheTask } from 'src/TheTask';
import vscode, { DecorationRenderOptions } from 'vscode';

export interface ItemForProvider {
	title: string;
	items: Items[];
}

export interface Items {// TODO: rename
	lineNumber: number;
	title: string;
}

export interface State {
	tasks: TheTask[];
	archivedTasks: TheTask[];
	tagsForTreeView: ItemForProvider[];
	projectsForTreeView: ItemForProvider[];
	contextsForTreeView: ItemForProvider[];
	lastVisit?: Date;
	commentLines: vscode.Range[];

	theRightFileOpened: boolean;
	fileWasReset: boolean;
	newDayArrived: boolean;
	taskTreeViewFilterValue: string;
	extensionContext: vscode.ExtensionContext;
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
}
export interface IExtensionConfig {
	addCreationDate: boolean;
	addCompletionDate: boolean;
	completionDateIncludeTime: boolean;
	creationDateIncludeTime: boolean;
	defaultPriority: Priority;
	autoArchiveTasks: boolean;

	sortTagsView: SortTags;

	doneSymbol: string;
	activatePattern: string;

	tags: string[];
	projects: string[];
	contexts: string[];

	decorations: {
		[key in AdvancedDecorations]: DecorationRenderOptions;
	};

	savedFilters: {
		title: string;
		filter: string;
	}[];

	defaultFile: string;
	defaultArchiveFile: string;

	treeViews: {
		title: string;
		filter: string;
	}[];
	getNextNumberOfTasks: number;

	webview: {
		showCompleted: boolean;
	};
}

export const enum VscodeContext {
	isActive = 'todomd:isActive',
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
interface WebviewMessageUpdateTasks extends WebviewMessageBase {
	type: 'updateTasks';
	value: TheTask[];
}
interface WebviewMessageUpdateConfig extends WebviewMessageBase {
	type: 'updateConfig';
	value: IExtensionConfig['webview'];
}
// From webview to extension
interface WebviewMessageToggleDone extends WebviewMessageBase {
	type: 'toggleDone';
	value: number;
}
interface WebviewMessageShowNotification extends WebviewMessageBase {
	type: 'showNotification';
	value: string;
}
export type WebviewMessage = WebviewMessageUpdateTasks | WebviewMessageUpdateConfig | WebviewMessageToggleDone | WebviewMessageShowNotification;
