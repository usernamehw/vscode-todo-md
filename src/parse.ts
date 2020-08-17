import vscode, { Range } from 'vscode';
import { DueDate } from './dueDate';
import { extensionConfig } from './extension';
import { OptionalExceptFor } from './types';

interface ParseLineReturn {
	lineType: string;
	value?: unknown;
}
interface TaskReturn extends ParseLineReturn {
	lineType: 'task';
	value: TheTask;
}
interface SpecialCommentReturn extends ParseLineReturn {
	lineType: 'specialComment';
	value: string[];
}
interface CommentReturn extends ParseLineReturn {
	lineType: 'comment';
}
interface EmptyLineReturn extends ParseLineReturn {
	lineType: 'empty';
}

export function parseLine(textLine: vscode.TextLine): TaskReturn | SpecialCommentReturn | CommentReturn | EmptyLineReturn {
	let line = textLine.text.trim();
	if (!line.length) {
		return {
			lineType: 'empty',
		};
	}

	const lineNumber = textLine.lineNumber;
	if (line.startsWith('# ')) {
		return {
			lineType: 'comment',
		};
	} else if (line.startsWith('## ')) {
		const tags = [];
		const tempLine = line.slice(3).trim().split(' ');
		for (const word of tempLine) {
			if (word.startsWith('#')) {
				tags.push(...word.split('#').filter(tag => tag.length));
			}
		}
		return {
			lineType: 'specialComment',
			value: tags,
		};
	}

	/** Offset of the current word (Used to calculate ranges for decorations) */
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
	let priority: string | undefined;
	let priorityRange: Range | undefined;
	const tags: string[] = [];
	const tagsDelimiterRanges: Range[] = [];
	const tagsRange: Range[] = [];
	const specialTags: SpecialTags = {};
	let due: DueDate | undefined;
	let dueRange: Range | undefined;

	for (const word of words) {
		switch (word[0]) {
			case '{': {
				if (word[word.length - 1] !== '}') {
					text.push(word);
					break;
				}
				const [specialTag, value = ''] = word.slice(1, -1).split(':');
				const range = new Range(lineNumber, index, lineNumber, index + word.length);
				if (specialTag === 'due') {
					if (value.length) {
						due = new DueDate(value);
						dueRange = range;
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
					tagsDelimiterRanges.push(new Range(lineNumber, temp, lineNumber, temp + 1));
					tagsRange.push(new Range(lineNumber, temp + 1, lineNumber, temp + 1 + tag.length));
					temp += tag.length + 1;
					tags.push(tag);
				}
				break;
			}
			case '@': {
				contexts.push(word.slice(1));
				contextRanges.push(new Range(lineNumber, index, lineNumber, index + word.length));
				break;
			}
			case '+': {
				if (word.length !== 1) {
					projects.push(word.slice(1));
					projectRanges.push(new Range(lineNumber, index, lineNumber, index + word.length));
				} else {
					text.push(word);
				}
				break;
			}
			case '(': {
				if (/^\([A-Z]\)$/.test(word)) {
					priority = word[1];
					priorityRange = new Range(lineNumber, index, lineNumber, index + word.length);
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

	return {
		lineType: 'task',
		value: new TheTask({
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
			dueRange,
			specialTags,
			contexts,
			contextRanges,
			title: text.join(' '),
			lineNumber,
		}),
	};
}

interface ParsedDocument {
	tasks: TheTask[];
	commentLines: Range[];
}

export function parseDocument(document: vscode.TextDocument): ParsedDocument {
	const tasks = [];
	const commentLines = [];
	let additionalTags: string[] = [];

	for (let i = 0; i < document.lineCount; i++) {
		const parsedLine = parseLine(document.lineAt(i));
		switch (parsedLine.lineType) {
			case 'empty': continue;
			case 'comment': {
				commentLines.push(new Range(i, 0, i, 0));
				additionalTags = [];
				continue;
			}
			case 'specialComment': {
				commentLines.push(new Range(i, 0, i, 0));
				additionalTags = parsedLine.value;
				continue;
			}
			default: {
				if (additionalTags.length !== 0) {
					parsedLine.value.tags.push(...additionalTags);
				}
				tasks.push(parsedLine.value);
			}
		}
	}

	return {
		tasks,
		commentLines,
	};
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
/**
 * Grouped special tags.
 */
interface SpecialTags {
	threshold?: string;
	isHidden?: boolean;
	count?: Count;
	link?: string;
}

export type TaskInit = OptionalExceptFor<TheTask, 'title' | 'lineNumber' | 'rawText' | 'specialTags'>;
/**
 * `The` prefix because of auto import conflict with vscode `Task`
 */
export class TheTask {
	title: string;
	done: boolean;
	rawText: string;
	lineNumber: number;
	tags: string[];
	projects: string[];
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
	dueRange?: Range;

	constructor(init: TaskInit) {
		this.title = init.title;
		this.lineNumber = init.lineNumber;
		this.rawText = init.rawText;
		this.done = init.done ?? false;
		this.tags = init.tags ?? [];
		this.projects = init.projects ?? [];
		this.priority = init.priority ?? extensionConfig.defaultPriority;
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
	}
}

