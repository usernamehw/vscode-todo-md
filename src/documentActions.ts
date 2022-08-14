import dayjs from 'dayjs';
import { Position, Range, Selection, TextDocument, TextEditorRevealType, TextLine, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { DueDate } from './dueDate';
import { $config } from './extension';
import { parseDocument } from './parse';
import { Count, TheTask } from './TheTask';
import { dateWithoutTime, DATE_FORMAT, durationTo, getDateInISOFormat } from './time/timeUtils';
import { updateArchivedTasks } from './treeViewProviders/treeViews';
import { IsDue } from './types';
import { applyEdit, checkArchiveFileAndNotify, getActiveOrDefaultDocument, helpCreateSpecialTag, SpecialTagName, taskToString } from './utils/extensionUtils';
import { forEachTask, getNestedTasksLineNumbers, getTaskAtLineExtension } from './utils/taskUtils';
import { unique } from './utils/utils';

// This file contains 2 types of functions:
// 1) Performs an action on the document and applies an edit (saves the document)
// 2) Has a `WorkspaceEdit` suffix that accepts an edit and performs actions(insert/replace/delete) without applying

// ────────────────────────────────────────────────────────────
// ──── Apply Edit ────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
/**
 * Replace entire line range with new text. (transform task to its string version).
 */
export async function editTask(document: TextDocument, task: TheTask) {
	const edit = new WorkspaceEdit();
	const newTaskAsText = taskToString(task);
	const line = document.lineAt(task.lineNumber);
	edit.replace(document.uri, line.range, newTaskAsText);
	return applyEdit(edit, document);
}
/**
 * Add `{h}` special tag
 */
export async function hideTaskAtLine(document: TextDocument, lineNumber: number) {
	const edit = new WorkspaceEdit();
	const line = document.lineAt(lineNumber);
	const task = getTaskAtLineExtension(lineNumber);
	if (!task) {
		return undefined;
	}
	if (!task.isHidden) {
		insertEditAtTheEndOfLine(edit, document, line.range.end, helpCreateSpecialTag(SpecialTagName.Hidden));
	}
	return applyEdit(edit, document);
}
/**
 * Replace entire line range with new text.
 */
export async function editTaskRawText(document: TextDocument, lineNumber: number, newRawText: string) {
	const edit = new WorkspaceEdit();
	const line = document.lineAt(lineNumber);
	edit.replace(document.uri, line.range, newRawText);
	return applyEdit(edit, document);
}
/**
 * Toggle `{c}` special tag
 */
export async function toggleTaskCollapse(document: TextDocument, lineNumber: number) {
	const edit = new WorkspaceEdit();
	toggleTaskCollapseWorkspaceEdit(edit, document, lineNumber);
	return applyEdit(edit, document);
}
/**
 * Recursively expand/collapse all nested tasks
 */
export async function toggleTaskCollapseRecursive(document: TextDocument, lineNumber: number) {
	const parentTask = getTaskAtLineExtension(lineNumber);
	if (!parentTask) {
		return undefined;
	}
	const edit = new WorkspaceEdit();

	if (parentTask.isCollapsed) {
		forEachTask(task => {
			if (task.isCollapsed && task.subtasks.length) {
				toggleTaskCollapseWorkspaceEdit(edit, document, task.lineNumber);
			}
		}, parentTask.subtasks);
	} else {
		forEachTask(task => {
			if (!task.isCollapsed && task.subtasks.length) {
				toggleTaskCollapseWorkspaceEdit(edit, document, task.lineNumber);
			}
		}, parentTask.subtasks);
	}
	toggleTaskCollapseWorkspaceEdit(edit, document, lineNumber);
	return await applyEdit(edit, document);
}
/**
 * Insert/Replace due date
 */
export async function setDueDateAtLine(document: TextDocument, lineNumber: number, newDueDate: string) {
	const edit = new WorkspaceEdit();
	setDueDateWorkspaceEdit(edit, document, lineNumber, newDueDate);
	return await applyEdit(edit, document);
}
/**
 * Delete the task. Show confirmation dialog if necessary. Modal dialog shows all the tasks that will be deleted.
 */
export async function tryToDeleteTask(document: TextDocument, lineNumber: number) {
	const task = getTaskAtLineExtension(lineNumber);
	if (!task) {
		return undefined;
	}
	const edit = new WorkspaceEdit();

	let numberOfTasksToBeDeleted = '';
	let deletedTasksAsText = '';
	let showConfirmationDialog = false;

	const taskLineNumbersToDelete = [lineNumber];
	if (task.subtasks.length) {
		taskLineNumbersToDelete.push(...getNestedTasksLineNumbers(task.subtasks));
	}

	for (const ln of taskLineNumbersToDelete) {
		const taskAtLine = getTaskAtLineExtension(ln);
		if (!taskAtLine) {
			continue;
		}
		deletedTasksAsText += `${taskAtLine.rawText.replace(/\s\s/g, '┄')}\n`;
	}
	numberOfTasksToBeDeleted = `❗ [ ${taskLineNumbersToDelete.length} ] task${taskLineNumbersToDelete.length > 1 ? 's' : ''} will be deleted.`;

	if ($config.confirmTaskDelete === 'always') {
		showConfirmationDialog = true;
	} else if ($config.confirmTaskDelete === 'hasNestedTasks') {
		if (task.subtasks.length) {
			showConfirmationDialog = true;
		}
	}

	if (showConfirmationDialog) {
		const confirmBtnName = 'Delete';
		const button = await window.showWarningMessage(`${numberOfTasksToBeDeleted}\n${deletedTasksAsText}`, {
			modal: true,
		}, confirmBtnName);
		if (button !== confirmBtnName) {
			return undefined;
		}
	}

	for (const ln of taskLineNumbersToDelete) {
		deleteTaskWorkspaceEdit(edit, document, ln);
	}

	return applyEdit(edit, document);
}
/**
 *
 */
export async function toggleDoneOrIncrementCountAtLines(document: TextDocument, lineNumbers: number[]): Promise<void> {
	const activeFileEdit = new WorkspaceEdit();
	const tasksToArchive: TheTask[] = [];

	for (const lineNumber of lineNumbers) {
		const task = getTaskAtLineExtension(lineNumber);
		if (!task) {
			continue;
		}
		if (task.count) {
			incrementCountForTaskWorkspaceEdit(activeFileEdit, document, task);
		} else {
			toggleDoneAtLineWorkspaceEdit(activeFileEdit, document, task);
		}

		if (task.count) {
			if (task.count.needed - task.count.current === 1) {
				tasksToArchive.push(task);
			}
		} else {
			if (!task.done) {
				tasksToArchive.push(task);
			}
		}
	}

	await applyEdit(activeFileEdit, document);

	if ($config.autoArchiveTasks) {
		await archiveTasks(tasksToArchive, document);
	}
}
/**
 * Decrement count special tag. If alredy min `0/3` then do nothing.
 */
export async function decrementCountForTask(document: TextDocument, lineNumber: number, task: TheTask) {
	const edit = new WorkspaceEdit();
	const count = task.count;
	if (!count) {
		return undefined;
	}
	if (count.current === 0) {
		return undefined;
	} else if (count.current === count.needed) {
		removeCompletionDateWorkspaceEdit(edit, document, task);
	}
	setCountCurrentValueWorkspaceEdit(edit, document.uri, count, String(count.current - 1));
	return applyEdit(edit, document);
}
/**
 * Toggle task completion. Handle what to insert/delete.
 */
export async function toggleDoneAtLine(document: TextDocument, lineNumber: number) {
	const task = getTaskAtLineExtension(lineNumber);
	if (!task) {
		return;
	}
	const edit = new WorkspaceEdit();
	toggleDoneAtLineWorkspaceEdit(edit, document, task);
	await applyEdit(edit, document);

	if ($config.autoArchiveTasks) {
		await archiveTasks([task], document);
	}
}
/**
 * - Warning and noop when default archive file path is not specified
 * - Archive only works for completed tasks
 * - When the task is non-root (has parent task) - noop
 * - When the task has subtasks -> archive them too
 */
export async function archiveTasks(tasks: TheTask[], document: TextDocument) {
	const isDefaultArchiveFileSpecified = await checkArchiveFileAndNotify();
	if (!isDefaultArchiveFileSpecified) {
		return undefined;
	}

	const fileEdit = new WorkspaceEdit();
	const archiveFileEdit = new WorkspaceEdit();
	const archiveFileUri = Uri.file($config.defaultArchiveFile);
	const archiveDocument = await workspace.openTextDocument(archiveFileUri);
	let taskLineNumbersToArchive = [];

	// TODO: use getLineNumbersThatCanBeMovedToAnotherFile()
	for (const task of tasks) {
		// Only root tasks provided will be archived
		if (task.parentTaskLineNumber !== undefined) {
			continue;
		}
		// Recurring tasks cannot be archived
		if (task.due?.isRecurring) {
			continue;
		}
		taskLineNumbersToArchive.push(task.lineNumber);
		if (task.subtasks.length) {
			taskLineNumbersToArchive.push(...getNestedTasksLineNumbers(task.subtasks));
		}
	}

	taskLineNumbersToArchive = unique(taskLineNumbersToArchive);
	for (const lineNumber of taskLineNumbersToArchive) {
		const task = getTaskAtLineExtension(lineNumber);
		if (!task) {
			continue;
		}
		const line = document.lineAt(lineNumber);
		archiveTaskWorkspaceEdit(fileEdit, archiveFileEdit, archiveDocument, document.uri, line, true);
	}

	await applyEdit(fileEdit, document);
	await applyEdit(archiveFileEdit, archiveDocument);
	updateArchivedTasks();
	return undefined;
}
/**
 * Reveal the line/task in the file.
 *
 * Move cursor, reveal range, highlight the line for a moment
 */
export async function revealTask(lineNumber: number, document?: TextDocument) {
	const documentToReveal = document ?? await getActiveOrDefaultDocument();
	const editor = await window.showTextDocument(documentToReveal);
	const range = new Range(lineNumber, 0, lineNumber, 0);
	editor.selection = new Selection(range.start, range.end);
	editor.revealRange(range, TextEditorRevealType.Default);
	// Highlight for a short time revealed range
	const lineHighlightDecorationType = window.createTextEditorDecorationType({
		backgroundColor: '#ffa30468',
		isWholeLine: true,
	});
	editor.setDecorations(lineHighlightDecorationType, [range]);
	setTimeout(() => {
		editor.setDecorations(lineHighlightDecorationType, []);
	}, 700);
}
/**
 * Recurring tasks completion state should reset every day.
 * This function goes through all tasks in a document and resets their completion/count, adds `{overdue}` tag when needed
 */
export async function resetAllRecurringTasks(document: TextDocument, lastVisit: Date | string = new Date()) {
	if (typeof lastVisit === 'string') {
		lastVisit = new Date(lastVisit);
	}
	const edit = new WorkspaceEdit();
	const tasks = (await parseDocument(document)).tasks;
	const now = new Date();
	const nowWithoutTime = dateWithoutTime(now);

	for (const task of tasks) {
		if (task.due?.isRecurring) {
			const line = document.lineAt(task.lineNumber);
			if (task.done) {
				removeCompletionDateWorkspaceEdit(edit, document, task);
				removeStartWorkspaceEdit(edit, document, task);
				removeDurationWorkspaceEdit(edit, document, task);
			} else {
				if (!task.overdue && !dayjs().isSame(lastVisit, 'day')) {
					const lastVisitWithoutTime = dateWithoutTime(lastVisit);
					const daysSinceLastVisit = dayjs(nowWithoutTime).diff(lastVisitWithoutTime, 'day');
					for (let i = daysSinceLastVisit; i > 0; i--) {
						const date = dayjs().subtract(i, 'day');
						const res = new DueDate(task.due.raw, {
							targetDate: date.toDate(),
						});
						if (res.isDue === IsDue.Due || res.isDue === IsDue.Overdue) {
							if (!task.noOverdue) {
								addOverdueSpecialTagWorkspaceEdit(edit, document, line, date.format(DATE_FORMAT));
							}
							break;
						}
					}
				}
			}

			const count = task.count;
			if (count) {
				setCountCurrentValueWorkspaceEdit(edit, document.uri, count, '0');
			}
		}
	}
	return applyEdit(edit, document);
}
/**
 * Insert line break `\n` and some text to the file
 */
export async function appendTaskToFile(text: string, filePath: string) {
	const uri = Uri.file(filePath);
	const document = await workspace.openTextDocument(uri);
	const edit = new WorkspaceEdit();
	const eofPosition = document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end;
	edit.insert(uri, eofPosition, `\n${text}`);
	return applyEdit(edit, document);
}
export async function startTaskAtLine(lineNumber: number, document: TextDocument) {
	const edit = new WorkspaceEdit();
	startTaskAtLineWorkspaceEdit(edit, document, lineNumber);
	return await applyEdit(edit, document);
}
export async function toggleFavoriteAtLine(lineNumber: number, document: TextDocument) {
	const edit = new WorkspaceEdit();
	toggleFavoriteWorkspaceEdit(edit, document, lineNumber);
	return await applyEdit(edit, document);
}
// ────────────────────────────────────────────────────────────
// ──── Do not apply edit ─────────────────────────────────────
// ────────────────────────────────────────────────────────────
export function toggleTaskCollapseWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, lineNumber: number) {
	const line = document.lineAt(lineNumber);
	const task = getTaskAtLineExtension(lineNumber);
	if (task?.collapseRange) {
		deleteEdit(edit, document, task.collapseRange);
	} else {
		insertEditAtTheEndOfLine(edit, document, line.range.end, helpCreateSpecialTag(SpecialTagName.Collapsed));
	}
}
export function deleteTaskWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, lineNumber: number) {
	edit.delete(document.uri, document.lineAt(lineNumber).rangeIncludingLineBreak);
}
export function removeOverdueWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, task: TheTask) {
	if (task.overdueRange) {
		deleteEdit(edit, document, task.overdueRange);
	}
}
export function insertCompletionDateWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, line: TextLine, task: TheTask, forceIncludeTime = false) {
	const dateInIso = getDateInISOFormat(new Date(), forceIncludeTime || $config.completionDateIncludeTime);
	const newCompletionDate = helpCreateSpecialTag(SpecialTagName.CompletionDate, $config.completionDateIncludeDate ? dateInIso : undefined);
	if (task.completionDateRange) {
		edit.replace(document.uri, task.completionDateRange, newCompletionDate);
	} else {
		insertEditAtTheEndOfLine(edit, document, new Position(line.lineNumber, line.range.end.character), newCompletionDate);
	}
	if (task.start) {
		insertDurationWorkspaceEdit(edit, document, line, task);
	}
}
export function insertDurationWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, line: TextLine, task: TheTask) {
	if (!task.start) {
		return;
	}

	const newDurationDate = helpCreateSpecialTag(SpecialTagName.Duration, durationTo(task, true, $config.durationIncludeSeconds));
	if (task.durationRange) {
		edit.replace(document.uri, task.durationRange, newDurationDate);
	} else {
		insertEditAtTheEndOfLine(edit, document, line.range.end, newDurationDate);
	}
}
export function removeCompletionDateWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, task: TheTask) {
	if (task.completionDateRange) {
		deleteEdit(edit, document, task.completionDateRange);
	}
}
export function replaceRecurringDateWithTodayWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, uri: Uri, task: TheTask) {
	const dueText = document.getText(task.dueRange);
	if (!task.dueRange || !dueText) {
		return;
	}
	edit.replace(uri, task.dueRange, dueText.replace(/\d{4}-\d{2}-\d{2}/, getDateInISOFormat()));
}
export function removeDurationWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, task: TheTask) {
	if (task.durationRange) {
		deleteEdit(edit, document, task.durationRange);
	}
}
export function removeStartWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, task: TheTask) {
	if (task.startRange) {
		deleteEdit(edit, document, task.startRange);
	}
}
// TODO: this should be 2 functions
export function archiveTaskWorkspaceEdit(edit: WorkspaceEdit, archiveFileEdit: WorkspaceEdit, archiveDocument: TextDocument, uri: Uri, line: TextLine, shouldDelete: boolean) {
	appendTaskToFileWorkspaceEdit(archiveFileEdit, archiveDocument, line.text);// Add task to archive file
	if (shouldDelete) {
		edit.delete(uri, line.rangeIncludingLineBreak);// Delete task from active file
	}
}
function addOverdueSpecialTagWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, line: TextLine, overdueDateString: string) {
	insertEditAtTheEndOfLine(edit, document, new Position(line.lineNumber, line.range.end.character), helpCreateSpecialTag(SpecialTagName.Overdue, overdueDateString));
}
export function setCountCurrentValueWorkspaceEdit(edit: WorkspaceEdit, uri: Uri, count: Count, value: string) {
	const charIndexWithOffset = count.range.start.character + 'count:'.length + 1;
	const currentRange = new Range(count.range.start.line, charIndexWithOffset, count.range.start.line, charIndexWithOffset + String(count.current).length);
	edit.replace(uri, currentRange, String(value));
}
export function appendTaskToFileWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, text: string) {
	const eofPosition = document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end;
	edit.insert(document.uri, eofPosition, `\n${text}`);
}
export function toggleCommentAtLineWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, lineNumber: number) {
	const line = document.lineAt(lineNumber);
	if (line.text.startsWith('# ')) {
		edit.delete(document.uri, new Range(lineNumber, 0, lineNumber, 2));
	} else {
		edit.insert(document.uri, new Position(lineNumber, 0), '# ');
	}
}
export function editTaskWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, task: TheTask) {
	const newTaskAsText = taskToString(task);
	const line = document.lineAt(task.lineNumber);
	edit.replace(document.uri, line.range, newTaskAsText);
}
/**
 * Increment/Decrement a priority. Create it if the task doesn't have one.
 */
export function incrementOrDecrementPriorityWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, lineNumber: number, type: 'decrement' | 'increment') {
	const task = getTaskAtLineExtension(lineNumber);
	if (!task ||
			type === 'increment' && task.priority === 'A' ||
			type === 'decrement' && task.priority === 'Z') {
		return;
	}
	const newPriority = type === 'increment' ? String.fromCharCode(task.priority.charCodeAt(0) - 1) : String.fromCharCode(task.priority.charCodeAt(0) + 1);
	if (task.priorityRange) {
		// Task has a priority
		edit.replace(document.uri, task.priorityRange, `(${newPriority})`);
	} else {
		// No priority, create one
		edit.insert(document.uri, new Position(lineNumber, 0), `(${newPriority}) `);
	}
}
/**
 * Toggle favorite special tag `{f}`.
 */
export function toggleFavoriteWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, lineNumber: number) {
	const line = document.lineAt(lineNumber);
	const task = getTaskAtLineExtension(lineNumber);
	if (!task) {
		return;
	}
	if (task.favoriteRange) {
		deleteEdit(edit, document, task.favoriteRange);
	} else {
		insertEditAtTheEndOfLine(edit, document, line.range.end, helpCreateSpecialTag(SpecialTagName.Favorite));
	}
}
/**
 * Start time tracking (task duration). Triggered manually by user.
 */
export function startTaskAtLineWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, lineNumber: number) {
	const line = document.lineAt(lineNumber);
	const task = getTaskAtLineExtension(lineNumber);
	if (!task) {
		return;
	}
	const newStartDate = helpCreateSpecialTag(SpecialTagName.Started, getDateInISOFormat(undefined, true));
	if (task.startRange) {
		edit.replace(document.uri, task.startRange, newStartDate);
	} else {
		insertEditAtTheEndOfLine(edit, document, line.range.end, newStartDate);
	}
}
export function setDueDateWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, lineNumber: number, newDueDate: string) {
	const dueDate = helpCreateSpecialTag(SpecialTagName.Due, newDueDate);
	const task = getTaskAtLineExtension(lineNumber);
	if (task?.overdueRange) {
		deleteEdit(edit, document, task.overdueRange);
	}
	if (task?.dueRange) {
		edit.replace(document.uri, task.dueRange, dueDate);
	} else {
		const line = document.lineAt(lineNumber);
		insertEditAtTheEndOfLine(edit, document, line.range.end, dueDate);
	}
}
function incrementCountForTaskWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, task: TheTask): void {
	if (!task.count) {
		return;
	}
	let newValue = 0;
	if (task.count.current !== task.count.needed) {
		newValue = task.count.current + 1;
		if (newValue === task.count.needed) {
			toggleDoneAtLineWorkspaceEdit(edit, document, task);
		}
		setCountCurrentValueWorkspaceEdit(edit, document.uri, task.count, String(newValue));
	} else {
		setCountCurrentValueWorkspaceEdit(edit, document.uri, task.count, '0');
		removeCompletionDateWorkspaceEdit(edit, document, task);
	}
}
function toggleDoneAtLineWorkspaceEdit(activeFileEdit: WorkspaceEdit, document: TextDocument, task: TheTask): void {
	if (task.overdue) {
		removeOverdueWorkspaceEdit(activeFileEdit, document, task);
		if ($config.autoBumpRecurringOverdueDate && !task.done && task.due?.type === 'recurringWithDate') {
			replaceRecurringDateWithTodayWorkspaceEdit(activeFileEdit, document, document.uri, task);
		}
	}
	const line = document.lineAt(task.lineNumber);
	if (task.done) {
		removeCompletionDateWorkspaceEdit(activeFileEdit, document, task);
		removeDurationWorkspaceEdit(activeFileEdit, document, task);
		removeStartWorkspaceEdit(activeFileEdit, document, task);
	} else {
		insertCompletionDateWorkspaceEdit(activeFileEdit, document, line, task);
	}
}

/**
 * Delete range from the line.
 * Also delete whitespace before the range (if present).
 */
function deleteEdit(edit: WorkspaceEdit, document: TextDocument, range: Range): void {
	const charBeforePosition = new Position(range.start.line, range.start.character - (range.start.character > 0 ? 1 : 0));
	const charBefore = document.getText(new Range(charBeforePosition, range.start));
	if (charBefore === ' ') {
		range = range.with(charBeforePosition);
	}
	edit.delete(document.uri, range);
}
/**
 * Insert text at the end of the line.
 * Only add whitespace when needed.
 */
function insertEditAtTheEndOfLine(edit: WorkspaceEdit, document: TextDocument, position: Position, text: string): void {
	const charBeforePosition = position.with(position.line, position.character - (position.character > 0 ? 1 : 0));
	const charBefore = document.getText(new Range(charBeforePosition, position));
	edit.insert(document.uri, position, charBefore !== ' ' && charBefore !== '' ? ` ${text}` : text);
}
