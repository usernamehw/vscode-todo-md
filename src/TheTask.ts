import { Range } from 'vscode';
import { DueDate } from './dueDate';
import { extensionConfig } from './extension';
import { DueState, OptionalExceptFor } from './types';

export type Priority = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L'|'M'|'N'|'O'|'P'|'Q'|'R'|'S'|'T'|'U'|'V'|'W'|'X'|'Y'|'Z';
export type TaskInit = OptionalExceptFor<TheTask, 'indentLvl' | 'lineNumber' | 'rawText' | 'title'>;
/**
 * Modifier for task completion.
 * Instead of completing the task increases count by 1.
 * When the number matches the goal - the task is considered completed.
 */
export interface Count {
	range: Range;
	needed: number;
	current: number;
}

export interface Link {
	value: string;
	scheme: string;
	characterRange: [number, number];
}
/**
 * `The` prefix because of auto import conflict with vscode `Task`
 */
export class TheTask {
	title: string;
	done: boolean;
	rawText: string;
	lineNumber: number;
	indentLvl: number;
	parentTaskLineNumber: number | undefined;
	subtasks: TheTask[];
	tags: string[];
	projects: string[];
	due?: DueDate;
	links: Link[];
	/**
	 * Special tag `{count:1/2}`. Used for tasks that require multiple iterations.
	 */
	count?: Count;
	/**
	 * Special tag `{t:2020-05-20}`. Used for hiding item from Tree View up to a certain date.
	 */
	threshold?: string;
	priority: Priority;
	/**
	 * Special tag `{h}`. Used for hiding items from Tree View.
	 */
	isHidden?: boolean;
	/**
	 * Special tag `{c}`. Used for webview and Tree View to store state of nested tasks.
	 */
	isCollapsed?: boolean;
	/**
	 * Special tag `{}` Oldest overdue date string in `YYYY-MM-DD` (for recurring tasks)
	 */
	overdue?: string;
	contexts: string[];
	contextRanges: Range[];
	priorityRange?: Range;
	specialTagRanges: Range[];
	projectRanges: Range[];
	tagsDelimiterRanges?: Range[];
	tagsRange?: Range[];
	dueRange?: Range;
	overdueRange?: Range;
	completionDateRange?: Range;
	collapseRange?: Range;

	constructor(init: TaskInit) {
		this.title = init.title;
		this.lineNumber = init.lineNumber;
		this.indentLvl = init.indentLvl;
		this.subtasks = init.subtasks ?? [];
		this.rawText = init.rawText;
		this.done = init.done ?? false;
		this.tags = init.tags ?? [];
		this.projects = init.projects ?? [];
		this.priority = init.priority ?? extensionConfig.defaultPriority;
		this.links = init.links ?? [];
		this.due = init.due;
		this.dueRange = init.dueRange;
		this.count = init.count;
		this.threshold = init.threshold;
		this.isHidden = init.isHidden;
		this.isCollapsed = init.isCollapsed;
		/**
		 * Oldest overdue date string in `YYYY-MM-DD` (for recurring tasks)
		 */
		this.overdue = init.overdue;
		this.parentTaskLineNumber = init.parentTaskLineNumber;
		this.contexts = init.contexts ?? [];
		this.specialTagRanges = init.specialTagRanges ?? [];
		this.contextRanges = init.contextRanges ?? [];
		this.projectRanges = init.projectRanges ?? [];
		this.priorityRange = init.priorityRange;
		this.tagsDelimiterRanges = init.tagsDelimiterRanges;
		this.tagsRange = init.tagsRange;
		this.overdueRange = init.overdueRange;
		this.collapseRange = init.collapseRange;
		this.completionDateRange = init.completionDateRange;
	}
	/**
	 * Gets all nested task line numbers (recursive)
	 */
	getNestedTasksLineNumbers(tasks = this.subtasks): number[] {
		const ids = [];
		for (const task of tasks) {
			ids.push(task.lineNumber);
			if (task.subtasks) {
				ids.push(...this.getNestedTasksLineNumbers(task.subtasks));
			}
		}
		return ids;
	}
	// TODO: use this helper function
	isRoot() {
		return this.parentTaskLineNumber !== undefined;
	}

	hasNestedTasks() {
		return this.subtasks.length !== 0;
	}

	static formatTask(task: TheTask): string {
		let result = '';
		if (task.due?.isDue === DueState.due) {
			result += '🟩 ';
		} else if (task.due?.isDue === DueState.overdue) {
			result += '🟥 ';
		}
		result += task.title;
		if (task.count) {
			result += ` ${task.count.current}/${task.count.needed}`;
		}
		return result;
	}
}
