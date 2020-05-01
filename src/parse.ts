import * as vscode from 'vscode';
import { Range } from 'vscode';
import { Items, TagForProvider, SortTags, ProjectForProvider, DueState, ContextForProvider } from './types';
import { config } from './extension';
import { parseDue } from './utils';

export function parseLine(textLine: vscode.TextLine): Task | undefined {
	let line = textLine.text.trim();
	const ln = textLine.lineNumber;
	if (!line.length) {
		// Empty lines are ok and allowed to use to read file easier
		return undefined;
	}
	if (line[0] === '#' && line[1] === ' ') {
		// Comment. Also, in markdown file a header and can be used for Go To Symbol
		return undefined;
	}

	/** Offset of current word (Used to calculate ranges for decorations) */
	let index = textLine.firstNonWhitespaceCharacterIndex;

	const done = line.startsWith(config.doneSymbol);
	line = line.replace(config.doneSymbol, '');
	if (done) {
		index += config.doneSymbol.length;
	}

	const words = line.split(' ');

	const contexts = [];
	const contextRanges: Range[] = [];
	const projects = [];
	const projectRanges: Range[] = [];
	const specialTagRanges: Range[] = [];
	const text: string[] = [];
	let priority = 'Z';
	let priorityRange: Range | undefined;
	let tags: string[] = [];
	const tagsDelimiterRanges: Range[] = [];
	const tagsRange: Range[] = [];
	let due;
	let dueRange: Range | undefined;
	let isDue = DueState.notDue;
	let isRecurring = false;
	for (const word of words) {
		switch (word[0]) {
			case '{': {
				if (word.slice(-1) !== '}') {
					text.push(word);
					break;
				}
				const [specialTag, value] = word.slice(1, -1).split(':');
				const range = new Range(ln, index, ln, index + word.length);
				if (specialTag === 'due') {
					dueRange = range;
					const result = parseDue(value);
					isDue = result.isDue;
					isRecurring = result.isRecurring;
				} else if (specialTag === 'cr') {
					specialTagRanges.push(range);
				} else if (specialTag === 'cm') {
					specialTagRanges.push(range);
				} else {
					text.push(word);
				}
				break;
			}
			case '#': {
				tags = word.split('#').filter(t => t.length);
				let temp = index;
				for (const tag of tags) {
					tagsDelimiterRanges.push(new Range(ln, temp, ln, temp + 1));
					tagsRange.push(new Range(ln, temp + 1, ln, temp + 1 + tag.length));
					temp += tag.length + 1;
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

	return new Task({
		tags,
		tagsDelimiterRanges,
		tagsRange,
		projects,
		projectRanges,
		done,
		priority,
		priorityRange,
		specialTagRanges,
		due,
		dueRange,
		isRecurring,
		isDue,
		contexts,
		contextRanges,
		title: text.join(' '),
		ln,
	});
}
interface ParsedStuff {
	tasks: Task[];
	sortedTags: TagForProvider[];
	projects: ProjectForProvider[];
	contexts: ContextForProvider[];
}
export function parseDocument(document: vscode.TextDocument): ParsedStuff {
	const tasks = [];
	for (let i = 0; i < document.lineCount; i++) {
		const parsedLine = parseLine(document.lineAt(i));
		if (!parsedLine) {
			continue;
		}
		tasks.push(parsedLine);
	}

	const tagMap: {
		[tag: string]: Items[];
	} = {};
	const projectMap: {
		[key: string]: Items[];
	} = {};
	const contextMap: {
		[key: string]: Items[];
	} = {};
	for (const task of tasks) {
		// Tags grouping
		for (const tag of task.tags) {
			if (!tagMap[tag]) {
				tagMap[tag] = [];
			}
			tagMap[tag].push({
				lineNumber: task.ln,
				title: task.title,
			});
		}
		// Projects grouping
		if (task.projects.length) {
			for (const project of task.projects) {
				if (!projectMap[project]) {
					projectMap[project] = [];
				}
				projectMap[project].push({
					lineNumber: task.ln,
					title: task.title,
				});
			}
		}
		// Contexts grouping
		if (task.contexts.length) {
			for (const context of task.contexts) {
				if (!contextMap[context]) {
					contextMap[context] = [];
				}
				contextMap[context].push({
					lineNumber: task.ln,
					title: task.title,
				});
			}
		}
	}
	const tags = [];
	for (const key in tagMap) {
		tags.push({
			tag: key,
			items: tagMap[key],
		});
	}
	let sortedTags: TagForProvider[];
	if (config.sortTagsView === SortTags.alphabetic) {
		sortedTags = tags.sort((a, b) => a.tag.localeCompare(b.tag));
	} else {
		sortedTags = tags.sort((a, b) => b.items.length - a.items.length);
	}

	const projects = [];
	for (const key in projectMap) {
		projects.push({
			project: key,
			items: projectMap[key],
		});
	}
	const contexts = [];
	for (const key in contextMap) {
		contexts.push({
			context: key,
			items: contextMap[key],
		});
	}
	return {
		tasks,
		sortedTags,
		projects,
		contexts,
	};
}

export class Task {
	title: string;
	done: boolean;
	/** Line number. */
	ln: number;
	isDue: DueState;
	isRecurring: boolean;
	tags: string[];
	projects: string[];
	/** Due string. Example: `2020-03-27-e30d` */
	due?: string;
	priority: string;
	contexts: string[];
	contextRanges: Range[];
	priorityRange?: Range;
	specialTagRanges: Range[];
	projectRanges: Range[];
	dueRange?: Range;
	tagsDelimiterRanges?: Range[];
	tagsRange?: Range[];

	constructor(init: Task) {
		this.title = init.title;
		this.done = init.done;
		this.ln = init.ln;
		this.tags = init.tags;
		this.isDue = init.isDue;
		this.isRecurring = init.isRecurring;
		this.projects = init.projects;
		this.priority = init.priority;
		this.due = init.due;
		this.contexts = init.contexts;
		this.specialTagRanges = init.specialTagRanges;
		this.contextRanges = init.contextRanges;
		this.projectRanges = init.projectRanges;
		this.priorityRange = init.priorityRange;
		this.dueRange = init.dueRange;
		this.tagsDelimiterRanges = init.tagsDelimiterRanges;
		this.tagsRange = init.tagsRange;
	}
}
