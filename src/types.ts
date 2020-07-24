import * as vscode from 'vscode';
import { TheTask } from './parse';

export interface ItemForProvider {
	title: string;
	items: Items[];
}

export interface Items {
	lineNumber: number;
	title: string;
}

export interface State {
	tasks: TheTask[];
	archivedTasks: TheTask[];
	tagsForProvider: ItemForProvider[];
	projectsForProvider: ItemForProvider[];
	contextsForProvider: ItemForProvider[];
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
}

export enum SortTags {
	alphabetic = 'alphabetic',
	frequency = 'frequency',
}
export interface IConfig {
	addCreationDate: boolean;
	addCompletionDate: boolean;
	completionDateIncludeTime: boolean;
	creationDateIncludeTime: boolean;
	defaultPriority: string;
	autoArchiveTasks: boolean;

	sortTagsView: SortTags;

	doneSymbol: string;
	activatePattern: string;

	tags: string[];
	projects: string[];
	contexts: string[];

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
}

export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;
