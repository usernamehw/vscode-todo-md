import * as vscode from 'vscode';
import { Task } from './parse';
// combine the three into 1 interface ?
export interface TagForProvider {
	tag: string;
	items: Items[];
}
export interface ProjectForProvider {
	project: string;
	items: Items[];
}
export interface ContextForProvider {
	context: string;
	items: Items[];
}
export interface Items {
	lineNumber: number;
	title: string;
}

export interface State {
	tasks: Task[];
	tagsForProvider: TagForProvider[];
	projectsForProvider: ProjectForProvider[];
	contextsForProvider: ContextForProvider[];
	lastVisit?: Date;
	commentLines: vscode.Range[];

	theRightFileOpened: boolean;
	fileWasReset: boolean;
	newDayArrived: boolean;
	taskTreeViewFilterValue: string;
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
	sortTagsView: SortTags;
	addCompletionDate: boolean;
	completionDateIncludeTime: boolean;

	doneSymbol: string;
	/**
	 * Choose files that extension will operate on. By default any markdown file (`.md`).
	 */
	activatePattern: string;
	tags: string[];
	projects: string[];
	contexts: string[];
	defaultFile: string;
	defaultArchiveFile: string;
	autoArchiveTasks: boolean;
	useLocalDateTime: boolean;
}
