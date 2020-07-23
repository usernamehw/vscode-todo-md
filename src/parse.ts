import dayjs from 'dayjs';
import * as vscode from 'vscode';
import { Range } from 'vscode';
import { extensionConfig } from './extension';
import { DueState } from './types';

export function parseLine(textLine: vscode.TextLine): TheTask | undefined | number {
	let line = textLine.text.trim();
	if (!line.length) {
		// Empty lines are ok and allowed to use to read the file easier
		return undefined;
	}
	const ln = textLine.lineNumber;
	if (line[0] === '#' && line[1] === ' ') {
		// Comment. Also, in markdown file a header and can be used for Go To Symbol
		return ln;
	}

	/** Offset of current word (Used to calculate ranges for decorations) */
	let index = textLine.firstNonWhitespaceCharacterIndex;

	let done = line.startsWith(extensionConfig.doneSymbol);
	if (done) {
		line = line.replace(extensionConfig.doneSymbol, '');
		index += extensionConfig.doneSymbol.length;
	}

	const words = line.split(' ');

	const rawText = textLine.text;
	const contexts = [];
	const contextRanges: Range[] = [];
	const projects = [];
	const projectRanges: Range[] = [];
	const specialTagRanges: Range[] = [];
	const text: string[] = [];
	let priority = '';
	let priorityRange: Range | undefined;
	const tags: string[] = [];
	const tagsDelimiterRanges: Range[] = [];
	const tagsRange: Range[] = [];
	const specialTags: SpecialTags = {};
	let due: DueDate | undefined;

	for (const word of words) {
		switch (word[0]) {
			case '{': {
				if (word[word.length - 1] !== '}') {
					text.push(word);
					break;
				}
				const [specialTag, value = ''] = word.slice(1, -1).split(':');
				const range = new Range(ln, index, ln, index + word.length);
				if (specialTag === 'due') {
					if (value.length) {
						due = new DueDate(value, range);
					}
				} else if (specialTag === 'cr') {
					specialTagRanges.push(range);
				} else if (specialTag === 'cm') {
					// Presence of completion date indicates that the task is done
					done = true;
					specialTagRanges.push(range);
				} else if (specialTag === 'count') {
					if (value === undefined) {
						break;
					}
					const [current, needed] = value.split('/');
					const currentValue = parseInt(current, 10);
					const neededValue = parseInt(needed, 10);
					if (!Number.isFinite(currentValue) || !Number.isFinite(neededValue)) {
						break;
					}
					specialTagRanges.push(range);
					if (currentValue === neededValue) {
						done = true;
					}
					specialTags.count = {
						range,
						current: currentValue,
						needed: neededValue,
					};
				} else if (specialTag === 't') {
					specialTags.threshold = value;
					specialTagRanges.push(range);
				} else if (specialTag === 'link') {
					specialTags.link = word.slice(6, -1);
					specialTagRanges.push(range);
				} else if (specialTag === 'h') {
					specialTags.isHidden = true;
					specialTagRanges.push(range);
				} else {
					text.push(word);
				}
				break;
			}
			case '#': {
				const tempTags = word.split('#').filter(tag => tag.length);
				let temp = index;
				for (const tag of tempTags) {
					tagsDelimiterRanges.push(new Range(ln, temp, ln, temp + 1));
					tagsRange.push(new Range(ln, temp + 1, ln, temp + 1 + tag.length));
					temp += tag.length + 1;
					tags.push(tag);
				}
				break;
			}
			case '@': {
				contexts.push(word.slice(1));
				contextRanges.push(new Range(ln, index, ln, index + word.length));
				break;
			}
			case '+': {
				if (word.length !== 1) {
					projects.push(word.slice(1));
					projectRanges.push(new Range(ln, index, ln, index + word.length));
				} else {
					text.push(word);
				}
				break;
			}
			case '(': {
				if (/^\([A-Z]\)$/.test(word)) {
					priority = word[1];
					priorityRange = new Range(ln, index, ln, index + word.length);
				} else {
					text.push(word);
				}
				break;
			}
			default: {
				text.push(word);
			}
		}
		index += word.length + 1;// 1 is space sign
	}

	return new TheTask({
		tags,
		rawText,
		tagsDelimiterRanges,
		tagsRange,
		projects,
		projectRanges,
		done,
		priority,
		priorityRange,
		specialTagRanges,
		due,
		specialTags,
		contexts,
		contextRanges,
		title: text.join(' '),
		ln,
	});
}
interface ParsedStuff {
	tasks: TheTask[];
	commentLines: Range[];
}

export function parseDocument(document: vscode.TextDocument): ParsedStuff {
	const tasks = [];
	const commentLines = [];
	for (let i = 0; i < document.lineCount; i++) {
		const parsedLine = parseLine(document.lineAt(i));
		if (parsedLine === undefined) {
			continue;
		}
		if (typeof parsedLine === 'number') {
			commentLines.push(new Range(parsedLine, 0, parsedLine, 0));
			continue;
		}
		tasks.push(parsedLine);
	}

	return {
		tasks,
		commentLines,
	};
}

export interface Count {
	range: Range;
	needed: number;
	current: number;
}
interface SpecialTags {
	threshold?: string;
	isHidden?: boolean;
	count?: Count;
	link?: string;
}

export interface TaskInit {
	title: string;
	ln: number;
	rawText: string;

	done?: boolean;
	tags?: string[];
	projects?: string[];
	priority?: string;
	due?: DueDate;
	specialTags: SpecialTags;
	contexts?: string[];
	priorityRange?: Range;
	specialTagRanges?: Range[];
	contextRanges?: Range[];
	projectRanges?: Range[];
	tagsDelimiterRanges?: Range[];
	tagsRange?: Range[];
}
export class TheTask {
	title: string;
	done: boolean;
	rawText: string;
	/** Line number. */
	ln: number;
	tags: string[];
	projects: string[];
	/** Due string. Example: `2020-03-27|e30d` */
	due?: DueDate;
	specialTags: SpecialTags;
	priority: string;
	contexts: string[];
	contextRanges: Range[];
	priorityRange?: Range;
	specialTagRanges: Range[];
	projectRanges: Range[];
	tagsDelimiterRanges?: Range[];
	tagsRange?: Range[];
	/**
	 * name `TheTask` because of conflict with vscode `Task`
	 */
	constructor(init: TaskInit) {
		this.title = init.title;
		this.ln = init.ln;
		this.rawText = init.rawText;
		this.done = init.done || false;
		this.tags = init.tags || [];
		this.projects = init.projects || [];
		this.priority = init.priority || extensionConfig.defaultPriority;
		this.due = init.due;
		this.specialTags = init.specialTags;
		this.contexts = init.contexts || [];
		this.specialTagRanges = init.specialTagRanges || [];
		this.contextRanges = init.contextRanges || [];
		this.projectRanges = init.projectRanges || [];
		this.priorityRange = init.priorityRange;
		this.tagsDelimiterRanges = init.tagsDelimiterRanges;
		this.tagsRange = init.tagsRange;
	}
}

export class DueDate {
	private readonly dueWithDateRegexp = /^(\d\d\d\d)-(\d\d)-(\d\d)(\|(\w+))?$/;
	/** Unmodified value of due date */
	raw: string;
	range: Range;
	isRecurring = false;
	isDue = DueState.notDue;
	closestDueDateInTheFuture: string | undefined;

	constructor(dueString: string, range: Range) {
		this.raw = dueString;
		this.range = range;

		const result = this.parseDue(dueString);
		this.isRecurring = result.isRecurring;
		this.isDue = result.isDue;
		if (result.isDue === DueState.notDue) {
			this.closestDueDateInTheFuture = this.calcClosestDueDateInTheFuture();
		}
	}

	calcClosestDueDateInTheFuture() {
		for (let i = 1; i < 100; i++) {
			const date = dayjs().add(i, 'day');
			const { isDue } = this.parseDue(this.raw, date.toDate());
			if (isDue) {
				return dayjs().to(date);
			}
		}
		return 'More than 100 days';
	}
	parseDue(due: string, targetDate = new Date()): DueReturn {
		const dueDates = due.split(',').filter(d => d.length);
		const result = dueDates.map(dueDate => this.parseDueDate(dueDate, targetDate));

		const isRecurring = result.some(r => r.isRecurring);
		const hasOverdue = result.some(r => r.isDue === DueState.overdue);
		const hasDue = result.some(r => r.isDue === DueState.due);
		const isDue = hasOverdue ? DueState.overdue : hasDue ? DueState.due : DueState.notDue;
		return {
			isDue,
			isRecurring,
		};
	}
	private parseDueDate(due: string, targetDate: Date): DueReturn {
		if (due === 'today') {
			return {
				isRecurring: false,
				isDue: DueState.due,
			};
		}
		const tryAsRange = due.split('..');
		if (tryAsRange.length > 1) {
			return this.isDueBetween(tryAsRange[0], tryAsRange[1]);
		}
		let isRecurring = false;
		let isDue = DueState.notDue;
		const match = this.dueWithDateRegexp.exec(due);
		if (match) {
			const year = Number(match[1]);
			const month = Number(match[2]) - 1;
			const date = Number(match[3]);
			const dateObject = new Date(year, month, date);
			const dueRecurringPart = match[5];

			if (!dueRecurringPart) {
				isDue = this.isDueExactDate(dateObject, targetDate);
				isRecurring = false;
			} else {
				isRecurring = true;
				isDue = this.isDueWithDate(dueRecurringPart, dateObject, targetDate);
			}
		} else {
		// Due date without starting date
			isRecurring = true;
			isDue = this.isDueToday(due, targetDate);
		}
		return {
			isDue,
			isRecurring,
		};
	}
	private isDueExactDate(date: Date, targetDate: Date): DueState {
		if (dayjs(targetDate).isBefore(date)) {
			return DueState.notDue;
		}
		const diffInDays = dayjs(date).diff(dayjs(targetDate), 'day');
		return diffInDays === 0 ? DueState.due : DueState.overdue;
	}
	private isDueBetween(d1: string, d2: string): DueReturn {
		const now = dayjs();
		const date1 = dayjs(d1);
		const date2 = dayjs(d2);
		let isDue;
		if (date1.isBefore(now, 'day') && date2.isBefore(now, 'day')) {
			isDue = DueState.overdue;
		} else {
			isDue = dayjs().isBetween(d1, dayjs(d2), 'day', '[]') ? DueState.due : DueState.notDue;
		}
		return {
			isRecurring: false,
			isDue,
		};
	}

	private isDueToday(dueString: string, targetDate: Date): DueState {
		const value = dueString.toLowerCase();
		if (value === 'ed') {
			return DueState.due;
		}

		switch (targetDate.getDay()) {
			case 0: {
				if (value === 'sun' || value === 'sunday') {
					return DueState.due;
				}
				break;
			}
			case 1: {
				if (value === 'mon' || value === 'monday') {
					return DueState.due;
				}
				break;
			}
			case 2: {
				if (value === 'tue' || value === 'tuesday') {
					return DueState.due;
				}
				break;
			}
			case 3: {
				if (value === 'wed' || value === 'wednesday') {
					return DueState.due;
				}
				break;
			}
			case 4: {
				if (value === 'thu' || value === 'thursday') {
					return DueState.due;
				}
				break;
			}
			case 5: {
				if (value === 'fri' || value === 'friday') {
					return DueState.due;
				}
				break;
			}
			case 6: {
				if (value === 'sat' || value === 'saturday') {
					return DueState.due;
				}
				break;
			}
		}
		return DueState.notDue;
	}
	private isDueWithDate(dueString: string, dueDateStart: number | Date | undefined, targetDate = new Date()): DueState {
		if (dueDateStart === undefined) {
			throw new Error('dueDate was specified, but dueDateStart is missing');
		}
		const match = /(?!every|e)\s?(\d+)?\s?(d|days?)/.exec(dueString);
		if (match) {
			const interval = match[1] ? +match[1] : 1;
			const unit = match[2];
			if (/^(d|days?)$/.test(unit)) {
				const diffInDays = dayjs(targetDate).diff(dueDateStart, 'day');

				if (diffInDays % interval === 0) return DueState.due;
			}
		}

		return DueState.notDue;
	}
}

interface DueReturn {
	isRecurring: boolean;
	isDue: DueState;
	// isRange: boolean;
}
