import { Range } from 'vscode';
import { DueDate } from './dueDate';
import { extensionConfig } from './extension';
import { OptionalExceptFor } from './types';

export type Priority = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L'|'M'|'N'|'O'|'P'|'Q'|'R'|'S'|'T'|'U'|'V'|'W'|'X'|'Y'|'Z';
export type TaskInit = OptionalExceptFor<TheTask, 'title' | 'lineNumber' | 'rawText' | 'specialTags' | 'indentLvl'>;
export interface SpecialTags {
	threshold?: string;
	isHidden?: boolean;
	collapsed?: boolean;
	count?: Count;
	/**
	 * Oldest overdue date string in `YYYY-MM-DD` (for recurring tasks)
	 */
	overdue?: string;
}
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
	children: TheTask[];
	tags: string[];
	projects: string[];
	due?: DueDate;
	links: Link[];
	specialTags: SpecialTags;
	priority: Priority;
	contexts: string[];
	contextRanges: Range[];
	priorityRange?: Range;
	specialTagRanges: Range[];
	projectRanges: Range[];
	tagsDelimiterRanges?: Range[];
	tagsRange?: Range[];
	dueRange?: Range;
	overdueRange?: Range;
	collapseRange?: Range;

	constructor(init: TaskInit) {
		this.title = init.title;
		this.lineNumber = init.lineNumber;
		this.indentLvl = init.indentLvl;
		this.children = init.children ?? [];
		this.rawText = init.rawText;
		this.done = init.done ?? false;
		this.tags = init.tags ?? [];
		this.projects = init.projects ?? [];
		this.priority = init.priority ?? extensionConfig.defaultPriority;
		this.links = init.links ?? [];
		this.due = init.due;
		this.dueRange = init.dueRange;
		this.specialTags = init.specialTags;
		this.contexts = init.contexts ?? [];
		this.specialTagRanges = init.specialTagRanges ?? [];
		this.contextRanges = init.contextRanges ?? [];
		this.projectRanges = init.projectRanges ?? [];
		this.priorityRange = init.priorityRange;
		this.tagsDelimiterRanges = init.tagsDelimiterRanges;
		this.tagsRange = init.tagsRange;
		this.overdueRange = init.overdueRange;
		this.collapseRange = init.collapseRange;
	}

	static formatTask(task: TheTask): string {
		return task.title + (task.specialTags.count ? ` ${task.specialTags.count.current}/${task.specialTags.count.needed}` : '');
	}
}
