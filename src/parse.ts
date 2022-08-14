import { commands, DocumentLink, Range, TextDocument, TextLine } from 'vscode';
import { DueDate } from './dueDate';
import { $state } from './extension';
import { Count, Priority, TheTask } from './TheTask';
import { SpecialTagName } from './utils/extensionUtils';

interface ParseLineReturn {
	lineType: string;
	value?: unknown;
}
interface TaskReturn extends ParseLineReturn {
	lineType: 'task';
	value: TheTask;
}
interface CommentReturn extends ParseLineReturn {
	lineType: 'comment';
}
interface EmptyLineReturn extends ParseLineReturn {
	lineType: 'empty';
}
/**
 * Main parsing function. 1 Line - 1 Task.
 */
export function parseLine(textLine: TextLine): CommentReturn | EmptyLineReturn | TaskReturn {
	const line = textLine.text.trim();
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
	}

	let indent: string | undefined;
	if (textLine.firstNonWhitespaceCharacterIndex !== 0) {
		indent = textLine.text.slice(0, textLine.firstNonWhitespaceCharacterIndex);
	}
	const indentLvl = Math.floor(textLine.firstNonWhitespaceCharacterIndex / $state.activeDocumentTabSize);

	/** Offset of the current word (Used to calculate ranges for decorations) */
	let index = textLine.firstNonWhitespaceCharacterIndex;
	const words = line.split(' ');

	let done = false;
	let isFavorite = false;
	let noOverdue: boolean | undefined;
	const rawText = textLine.text;
	const contexts = [];
	const contextRanges: Range[] = [];
	const projects = [];
	const projectRanges: Range[] = [];
	const specialTagRanges: Range[] = [];
	const text: string[] = [];
	let priority: Priority | undefined;
	let priorityRange: Range | undefined;
	const tags: string[] = [];
	const tagsRange: Range[] = [];
	let count: Count | undefined;
	let completionDate: string | undefined;
	let creationDate: string | undefined;
	let start: string | undefined;
	let startRange: Range | undefined;
	let duration: string | undefined;
	let durationRange: Range | undefined;
	let overdue: string | undefined;
	let isHidden: boolean | undefined;
	let isCollapsed: boolean | undefined;
	let due: DueDate | undefined;
	let dueRange: Range | undefined;
	let overdueRange: Range | undefined;
	let collapseRange: Range | undefined;
	let completionDateRange: Range | undefined;
	let favoriteRange: Range | undefined;

	for (const word of words) {
		const wordRange = new Range(lineNumber, index, lineNumber, index + word.length);

		switch (word[0]) {
			case '{': {
				if (word[word.length - 1] !== '}') {
					text.push(word);
					break;
				}
				const firstColonIndex = word.indexOf(':');
				const specialTag = word.slice(1, firstColonIndex);
				const specialTagValue = word.slice(firstColonIndex + 1, -1);
				if (specialTag === SpecialTagName.Due) {
					if (specialTagValue.length) {
						due = new DueDate(specialTagValue);
						dueRange = wordRange;
					}
				} else if (specialTag === SpecialTagName.Overdue) {
					overdue = specialTagValue;
					overdueRange = wordRange;
				} else if (specialTag === SpecialTagName.CreationDate) {
					creationDate = specialTagValue;
					specialTagRanges.push(wordRange);
				} else if (specialTag === SpecialTagName.CompletionDate) {
					// Presence of completion date indicates that the task is done
					done = true;
					if (word !== '{cm}') {
						completionDate = specialTagValue;
					}
					completionDateRange = wordRange;
					specialTagRanges.push(wordRange);
				} else if (specialTag === SpecialTagName.Count) {
					if (specialTagValue === undefined) {
						break;
					}
					const [current, needed] = specialTagValue.split('/');
					const currentValue = parseInt(current, 10);
					const neededValue = parseInt(needed, 10);
					if (!Number.isFinite(currentValue) || !Number.isFinite(neededValue)) {
						break;
					}
					specialTagRanges.push(wordRange);
					if (currentValue === neededValue) {
						done = true;
					}
					count = {
						range: wordRange,
						current: currentValue,
						needed: neededValue,
					};
				} else if (specialTag === SpecialTagName.Hidden) {
					isHidden = true;
					specialTagRanges.push(wordRange);
				} else if (specialTag === SpecialTagName.Collapsed) {
					isCollapsed = true;
					collapseRange = wordRange;
					specialTagRanges.push(wordRange);
				} else if (specialTag === SpecialTagName.Favorite) {
					isFavorite = true;
					specialTagRanges.push(wordRange);
					favoriteRange = wordRange;
				} else if (specialTag === SpecialTagName.Started) {
					start = specialTagValue;
					startRange = wordRange;
					specialTagRanges.push(wordRange);
				} else if (specialTag === SpecialTagName.Duration) {
					duration = specialTagValue;
					durationRange = wordRange;
					specialTagRanges.push(wordRange);
				} else if (specialTag === SpecialTagName.NoOverdue) {
					noOverdue = true;
					specialTagRanges.push(wordRange);
				} else {
					text.push(word);
				}
				break;
			}
			case '#': {
				if (word.length !== 1) {
					tags.push(word.slice(1));
					tagsRange.push(wordRange);
				}
				text.push(word);
				break;
			}
			case '@': {
				if (word.length !== 1) {
					contexts.push(word.slice(1));
					contextRanges.push(wordRange);
				}
				text.push(word);
				break;
			}
			case '+': {
				if (word.length !== 1) {
					projects.push(word.slice(1));
					projectRanges.push(wordRange);
				}
				text.push(word);
				break;
			}
			case '(': {
				if (/^\([A-Z]\)$/.test(word)) {
					priority = word[1] as Priority;
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
			indent,
			tags,
			rawText,
			tagsRange,
			projects,
			projectRanges,
			done,
			favorite: isFavorite,
			favoriteRange,
			priority,
			start,
			startRange,
			duration,
			durationRange,
			completionDate,
			creationDate,
			priorityRange,
			specialTagRanges,
			due,
			dueRange,
			overdueRange,
			collapseRange,
			completionDateRange,
			count,
			overdue,
			isHidden,
			isCollapsed,
			contexts,
			contextRanges,
			title: text.join(' '),
			lineNumber,
			indentLvl,
			noOverdue,
		}),
	};
}

interface ParsedDocument {
	tasks: TheTask[];
	tasksAsTree: TheTask[];
	commentLines: Range[];
}
/**
 * Some features require knowledge beyond 1 line.
 * Parsing links, for example, is taken from vscode api that runs on a document. This function maps it to each line.
 *
 * Also things that require information about other lines, like nested task needs to find a parent task.
 */
export async function parseDocument(document: TextDocument): Promise<ParsedDocument> {
	const tasks: TheTask[] = [];
	const commentLines: Range[] = [];
	let startLine = 0;

	const links = await commands.executeCommand<DocumentLink[]>('vscode.executeLinkProvider', document.uri) ?? [];

	// Ignore markdown yaml frontmatter
	const frontMatterHeaderRegex = /^---(?:.|\r|\n)*^---/m;
	const frontMatterHeaderMatch = frontMatterHeaderRegex.exec(document.getText());
	if (frontMatterHeaderMatch) {
		startLine = frontMatterHeaderMatch[0]?.split(/\r\n|\r|\n/).length || 0;
	}

	for (let i = startLine; i < document.lineCount; i++) {
		const parsedLine = parseLine(document.lineAt(i));
		switch (parsedLine.lineType) {
			case 'empty': continue;
			case 'comment': {
				commentLines.push(new Range(i, 0, i, 0));
				continue;
			}
			default: {
				// ──── Links ─────────────────────────────────────────────────
				const linksOnThisLine = links.filter(link => link.range.start.line === i && link.target !== undefined);
				if (linksOnThisLine.length !== 0) {
					parsedLine.value.links = linksOnThisLine.map(link => ({
						characterRange: [link.range.start.character, link.range.end.character],
						value: link.target!.toString(true),
						scheme: link.target!.scheme,
					}));
				}
				// ──── Overdue ───────────────────────────────────────────────
				if (parsedLine.value.overdue && parsedLine.value.due?.raw) {
					parsedLine.value.due = new DueDate(parsedLine.value.due.raw, {
						overdueStr: parsedLine.value.overdue,
					});
				}
				// ──── Handle nested tasks (find parent task lineNumber) ─────
				if (parsedLine.value.indentLvl) {
					for (let j = tasks.length - 1; j >= 0; j--) {
						if (tasks[j].indentLvl < parsedLine.value.indentLvl) {
							parsedLine.value.parentTaskLineNumber = tasks[j].lineNumber;
							break;
						}
					}
				}
				tasks.push(parsedLine.value);
			}
		}
	}
	// Move nested tasks inside the task
	const tasksMap: {
		[lineNumber: number]: TheTask;
	} = Object.create(null);
	for (const task of tasks) {
		tasksMap[task.lineNumber] = new TheTask({
			...task,
			subtasks: [],
		});
	}
	const tasksAsTree: TheTask[] = [];
	for (const task of tasks) {
		if (task.parentTaskLineNumber !== undefined) {
			tasksMap[task.parentTaskLineNumber].subtasks.push(tasksMap[task.lineNumber]);
		} else {
			tasksAsTree.push(tasksMap[task.lineNumber]);
		}
	}

	return {
		tasksAsTree,
		tasks,
		commentLines,
	};
}


interface ParsedWordText {
	type: 'text';
	value: string;
}
interface ParsedWordPriority {
	type: 'priority';
	range: Range;
	value: Priority;
}
export interface ParsedWordProject {
	type: 'project';
	range: Range;
	value: string;
}
export interface ParsedWordContext {
	type: 'context';
	range: Range;
	value: string;
}
export interface ParsedWordTags {
	type: 'tags';
	range: Range;
	delimiterRange: Range;
	value: string;
}
interface ParsedWordDue {
	type: 'due';
	range: Range;
	value: DueDate;
}
interface ParsedWordOverdue {
	type: 'overdue';
	range: Range;
	value: string;
}
interface ParsedWordCreationDate {
	type: 'creationDate';
	range: Range;
	value: string;
}
interface ParsedWordCompletionDate {
	type: 'completionDate';
	range: Range;
	value: string;
	done: boolean;
}
interface ParsedWordCount {
	type: 'count';
	range: Range;
	current: number;
	needed: number;
	done: boolean;
}
interface ParsedWordHidden {
	type: 'hidden';
	range: Range;
	isHidden: boolean;
}
interface ParsedWordCollapsed {
	type: 'collapsed';
	range: Range;
	isCollapsed: boolean;
}
interface ParsedWordStart {
	type: 'start';
	range: Range;
	value: string;
}
interface ParsedWordDuration {
	type: 'duration';
	range: Range;
	value: string;
}

type ParsedWord = ParsedWordCollapsed | ParsedWordCompletionDate | ParsedWordContext | ParsedWordCount | ParsedWordCreationDate | ParsedWordDue | ParsedWordDuration | ParsedWordHidden | ParsedWordOverdue | ParsedWordPriority | ParsedWordProject | ParsedWordStart | ParsedWordTags | ParsedWordText;
// TODO: duplicated code with `parseLine`
export function parseWord(word: string, lineNumber: number, index: number): ParsedWord {
	if (word.length === 1) {
		return {
			type: 'text',
			value: word,
		};
	}
	switch (word[0]) {
		case '{': {
			if (word[word.length - 1] !== '}') {
				return {
					type: 'text',
					value: word,
				};
			}
			const firstColonIndex = word.indexOf(':');
			const specialTag = word.slice(1, firstColonIndex);
			const specialTagValue = word.slice(firstColonIndex + 1, -1);
			const range = new Range(lineNumber, index, lineNumber, index + word.length);
			if (specialTag === SpecialTagName.Due) {
				if (specialTagValue.length) {
					return {
						type: 'due',
						value: new DueDate(specialTagValue),
						range,
					};
				}
			} else if (specialTag === SpecialTagName.Overdue) {
				return {
					type: 'overdue',
					value: specialTagValue,
					range,
				};
			} else if (specialTag === SpecialTagName.CreationDate) {
				return {
					type: 'creationDate',
					value: specialTagValue,
					range,
				};
				// specialTagRanges.push(range);
			} else if (specialTag === SpecialTagName.CompletionDate) {
				// Presence of completion date indicates that the task is done
				return {
					type: 'completionDate',
					done: true,
					value: specialTagValue,
					range,
				};
				// specialTagRanges.push(range);
			} else if (specialTag === SpecialTagName.Count) {
				if (specialTagValue === undefined) {
					break;
				}
				const [current, needed] = specialTagValue.split('/');
				const currentValue = parseInt(current, 10);
				const neededValue = parseInt(needed, 10);
				if (!Number.isFinite(currentValue) || !Number.isFinite(neededValue)) {
					break;
				}
				let done = false;
				if (currentValue === neededValue) {
					done = true;
				}
				return {
					type: 'count',
					done,
					current: currentValue,
					needed: neededValue,
					range,
				};
				// specialTagRanges.push(range);
			} else if (specialTag === SpecialTagName.Hidden) {
				return {
					type: 'hidden',
					isHidden: true,
					range,
				};
				// specialTagRanges.push(range);
			} else if (specialTag === SpecialTagName.Collapsed) {
				return {
					type: 'collapsed',
					isCollapsed: true,
					range,
				};
				// specialTagRanges.push(range);
			} else if (specialTag === SpecialTagName.Started) {
				return {
					type: 'start',
					value: specialTagValue,
					range,
				};
				// specialTagRanges.push(range);
			} else if (specialTag === SpecialTagName.Duration) {
				return {
					type: 'duration',
					value: specialTagValue,
					range,
				};
				// specialTagRanges.push(range);
			} else {
				return {
					type: 'text',
					value: word,
				};
			}
			break;
		}
		case '#': {
			return {
				type: 'tags',
				delimiterRange: new Range(lineNumber, index, lineNumber, index + 1),
				range: new Range(lineNumber, index + 1, lineNumber, index + word.length),
				value: word.slice(1),
			};
		}
		case '@': {
			return {
				type: 'context',
				value: word.slice(1),
				range: new Range(lineNumber, index, lineNumber, index + word.length),
			};
		}
		case '+': {
			return {
				type: 'project',
				value: word.slice(1),
				range: new Range(lineNumber, index, lineNumber, index + word.length),
			};
		}
		case '(': {
			if (/^\([A-Z]\)$/.test(word)) {
				return {
					type: 'priority',
					value: word[1] as Priority,
					range: new Range(lineNumber, index, lineNumber, index + word.length),
				};
			} else {
				return {
					type: 'text',
					value: word,
				};
			}
		}
		default: {
			return {
				type: 'text',
				value: word,
			};
		}
	}
	return {
		type: 'text',
		value: word,
	};
}
