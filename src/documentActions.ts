import dayjs from 'dayjs';
import vscode, { TextDocument, TextLine, Uri, WorkspaceEdit } from 'vscode';
import { DueDate } from './dueDate';
import { extensionConfig } from './extension';
import { parseDocument } from './parse';
import { Count, TheTask } from './TheTask';
import { DATE_FORMAT, getDateInISOFormat } from './time/timeUtils';
import { updateArchivedTasks } from './treeViewProviders/treeViews';
import { DueState } from './types';
import { applyEdit, checkArchiveFileAndNotify, getActiveDocument } from './utils/extensionUtils';
import { findTaskAtLineExtension } from './utils/taskUtils';

// This file contains 2 types of functions
// 1) Performs an action on the document and returns a Promise
// 2) Has a `WorkspaceEdit` suffix that accepts an edit and returns it without applying

/**
 * Add `{h}` special tag
 *
 * TODO: only add if the task is not already hidden
 */
export async function hideTask(document: vscode.TextDocument, lineNumber: number) {
	const wEdit = new WorkspaceEdit();
	const line = document.lineAt(lineNumber);
	wEdit.insert(document.uri, line.range.end, ' {h}');
	return applyEdit(wEdit, document);
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
 * Insert/Replace due date
 */
export async function setDueDate(document: vscode.TextDocument, lineNumber: number, newDueDate: string) {
	const dueDate = `{due:${newDueDate}}`;
	const wEdit = new WorkspaceEdit();
	const task = findTaskAtLineExtension(lineNumber);
	if (task?.overdueRange) {
		wEdit.delete(document.uri, task.overdueRange);
	}
	if (task?.dueRange) {
		wEdit.replace(document.uri, task.dueRange, dueDate);
	} else {
		const line = document.lineAt(lineNumber);
		const isLineEndsWithWhitespace = line.text.endsWith(' ');
		wEdit.insert(document.uri, line.range.end, `${isLineEndsWithWhitespace ? '' : ' '}${dueDate}`);
	}
	return await applyEdit(wEdit, document);
}
/**
 * Delete the task. Show confirmation dialog if necessary. Modal dialog shows all the tasks that will be deleted.
 */
export async function tryToDeleteTask(document: vscode.TextDocument, lineNumber: number) {
	const task = findTaskAtLineExtension(lineNumber);
	if (!task) {
		return undefined;
	}
	const edit = new WorkspaceEdit();

	let numberOfTasksToBeDeleted = '';
	let deletedTasksAsText = '';
	let showConfirmationDialog = false;

	const taskLineNumbersToDelete = [lineNumber];
	if (task.subtasks.length) {
		taskLineNumbersToDelete.push(...task.getNestedTasksLineNumbers());
	}

	for (const ln of taskLineNumbersToDelete) {
		const taskAtLine = findTaskAtLineExtension(ln);
		if (!taskAtLine) {
			continue;
		}
		deletedTasksAsText += `${taskAtLine.rawText.replace(/\s\s/g, '┄')}\n`;
	}
	numberOfTasksToBeDeleted = `❗ [ ${taskLineNumbersToDelete.length} ] task${taskLineNumbersToDelete.length > 1 ? 's' : ''} will be deleted.`;

	if (extensionConfig.confirmTaskDelete === 'always') {
		showConfirmationDialog = true;
	} else if (extensionConfig.confirmTaskDelete === 'hasNestedTasks') {
		if (task.subtasks.length) {
			showConfirmationDialog = true;
		}
	}

	if (showConfirmationDialog) {
		const confirmBtnName = 'Delete';
		const button = await vscode.window.showWarningMessage(`${numberOfTasksToBeDeleted}\n${deletedTasksAsText}`, {
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
 * Either toggle done or increment count
 */
export async function toggleDoneOrIncrementCount(document: vscode.TextDocument, lineNumber: number) {
	const task = findTaskAtLineExtension(lineNumber);
	if (!task) {
		return undefined;
	}
	if (task.count) {
		return await incrementCountForTask(document, lineNumber, task);
	} else {
		await toggleDoneAtLine(document, lineNumber);
		return undefined;
	}
}
/**
 * Increment count special tag. If already max `3/3` then set it to `0/3`
 */
export async function incrementCountForTask(document: vscode.TextDocument, lineNumber: number, task: TheTask) {
	const line = document.lineAt(lineNumber);
	const wEdit = new WorkspaceEdit();
	const count = task.count;
	if (!count) {
		return Promise.resolve(undefined);
	}
	let newValue = 0;
	if (count.current !== count.needed) {
		newValue = count.current + 1;
		if (newValue === count.needed) {
			insertCompletionDateWorkspaceEdit(wEdit, document.uri, line);
			removeOverdueWorkspaceEdit(wEdit, document.uri, task);
		}
		setCountCurrentValueWorkspaceEdit(wEdit, document.uri, count, String(newValue));
	} else {
		setCountCurrentValueWorkspaceEdit(wEdit, document.uri, count, '0');
		removeCompletionDateWorkspaceEdit(wEdit, document.uri, task);
	}
	return applyEdit(wEdit, document);
}
/**
 * Decrement count special tag. If alredy min `0/3` then do nothing.
 */
export async function decrementCountForTask(document: vscode.TextDocument, lineNumber: number, task: TheTask) {
	const wEdit = new WorkspaceEdit();
	const count = task.count;
	if (!count) {
		return undefined;
	}
	if (count.current === 0) {
		return undefined;
	} else if (count.current === count.needed) {
		removeCompletionDateWorkspaceEdit(wEdit, document.uri, task);
	}
	setCountCurrentValueWorkspaceEdit(wEdit, document.uri, count, String(count.current - 1));
	return applyEdit(wEdit, document);
}
/**
 * Increment/Decrement a priority. Create it if the task doesn't have one.
 */
export async function incrementOrDecrementPriority(document: TextDocument, lineNumber: number, type: 'decrement' | 'increment') {
	const task = findTaskAtLineExtension(lineNumber);
	if (!task ||
			type === 'increment' && task.priority === 'A' ||
			type === 'decrement' && task.priority === 'Z') {
		return undefined;
	}
	const newPriority = type === 'increment' ? String.fromCharCode(task.priority.charCodeAt(0) - 1) : String.fromCharCode(task.priority.charCodeAt(0) + 1);
	const wEdit = new WorkspaceEdit();
	if (task.priorityRange) {
		// Task has a priority
		wEdit.replace(document.uri, task.priorityRange, `(${newPriority})`);
	} else {
		// No priority, create one
		wEdit.insert(document.uri, new vscode.Position(lineNumber, 0), `(${newPriority}) `);
	}
	return applyEdit(wEdit, document);
}
/**
 * Remove overdue special tag
 */
async function removeOverdueFromLine(document: vscode.TextDocument, task: TheTask) {
	const edit = new WorkspaceEdit();
	removeOverdueWorkspaceEdit(edit, document.uri, task);
	return applyEdit(edit, document);
}
/**
 * Toggle task completion. Handle what to insert/delete.
 */
export async function toggleDoneAtLine(document: TextDocument, lineNumber: number) {
	const { firstNonWhitespaceCharacterIndex } = document.lineAt(lineNumber);
	const task = findTaskAtLineExtension(lineNumber);
	if (!task) {
		return;
	}
	if (task.overdue) {
		await removeOverdueFromLine(document, task);
	}
	const line = document.lineAt(lineNumber);
	const wEdit = new WorkspaceEdit();
	if (task.done) {
		if (!extensionConfig.addCompletionDate) {
			if (line.text.trim().startsWith(extensionConfig.doneSymbol)) {
				wEdit.delete(document.uri, new vscode.Range(lineNumber, firstNonWhitespaceCharacterIndex, lineNumber, firstNonWhitespaceCharacterIndex + extensionConfig.doneSymbol.length));
			}
		} else {
			removeCompletionDateWorkspaceEdit(wEdit, document.uri, task);
		}
	} else {
		if (extensionConfig.addCompletionDate) {
			insertCompletionDateWorkspaceEdit(wEdit, document.uri, line);
		} else {
			wEdit.insert(document.uri, new vscode.Position(lineNumber, firstNonWhitespaceCharacterIndex), extensionConfig.doneSymbol);
		}
	}
	await applyEdit(wEdit, document);

	if (extensionConfig.autoArchiveTasks) {
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
	const archiveFileUri = vscode.Uri.file(extensionConfig.defaultArchiveFile);
	const archiveDocument = await vscode.workspace.openTextDocument(archiveFileUri);
	let taskLineNumbersToArchive = [];

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
			taskLineNumbersToArchive.push(...task.getNestedTasksLineNumbers());
		}
	}

	taskLineNumbersToArchive = Array.from(new Set(taskLineNumbersToArchive));
	for (const lineNumber of taskLineNumbersToArchive) {
		const task = findTaskAtLineExtension(lineNumber);
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
export async function goToTask(lineNumber: number) {
	const document = await getActiveDocument();
	const editor = await vscode.window.showTextDocument(document);
	const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
	editor.selection = new vscode.Selection(range.start, range.end);
	editor.revealRange(range, vscode.TextEditorRevealType.Default);
	// Highlight for a short time revealed range
	const lineHighlightDecorationType = vscode.window.createTextEditorDecorationType({
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
export async function resetAllRecurringTasks(document: vscode.TextDocument, lastVisit: Date | string = new Date()) {
	if (typeof lastVisit === 'string') {
		lastVisit = new Date(lastVisit);
	}
	const wEdit = new WorkspaceEdit();
	const tasks = (await parseDocument(document)).tasks;
	const now = new Date();
	const nowWithoutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	for (const task of tasks) {
		if (task.due?.isRecurring) {
			const line = document.lineAt(task.lineNumber);
			if (task.done) {
				removeDoneSymbolWorkspaceEdit(wEdit, document.uri, line);
				removeCompletionDateWorkspaceEdit(wEdit, document.uri, task);
			} else {
				if (!task.overdue && !dayjs().isSame(lastVisit, 'day')) {
					const lastVisitWithoutTime = new Date(lastVisit.getFullYear(), lastVisit.getMonth(), lastVisit.getDate());
					const daysSinceLastVisit = dayjs(nowWithoutTime).diff(lastVisitWithoutTime, 'day');
					for (let i = daysSinceLastVisit; i > 0; i--) {
						const date = dayjs().subtract(i, 'day');
						const res = new DueDate(task.due.raw, {
							targetDate: date.toDate(),
						});
						if (res.isDue === DueState.due || res.isDue === DueState.overdue) {
							addOverdueSpecialTagWorkspaceEdit(wEdit, document.uri, line, date.format(DATE_FORMAT));
							break;
						}
					}
				}
			}

			const count = task.count;
			if (count) {
				setCountCurrentValueWorkspaceEdit(wEdit, document.uri, count, '0');
			}
		}
	}
	return applyEdit(wEdit, document);
}
/**
 * Insert line break `\n` and some text to the file
 */
export async function appendTaskToFile(text: string, filePath: string) {
	const uri = vscode.Uri.file(filePath);
	const document = await vscode.workspace.openTextDocument(uri);
	const wEdit = new WorkspaceEdit();
	const eofPosition = document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end;
	wEdit.insert(uri, eofPosition, `\n${text}`);
	return applyEdit(wEdit, document);
}

// ──────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────
export function toggleTaskCollapseWorkspaceEdit(edit: WorkspaceEdit, document: vscode.TextDocument, lineNumber: number) {
	const line = document.lineAt(lineNumber);
	const task = findTaskAtLineExtension(lineNumber);
	if (task?.collapseRange) {
		edit.delete(document.uri, task.collapseRange);
	} else {
		edit.insert(document.uri, line.range.end, ' {c}');
	}
}
export function deleteTaskWorkspaceEdit(wEdit: WorkspaceEdit, document: vscode.TextDocument, lineNumber: number) {
	wEdit.delete(document.uri, document.lineAt(lineNumber).rangeIncludingLineBreak);
}
export function removeOverdueWorkspaceEdit(edit: WorkspaceEdit, uri: Uri, task: TheTask) {
	if (task.overdueRange) {
		edit.delete(uri, task.overdueRange);
	}
}
export function insertCompletionDateWorkspaceEdit(wEdit: WorkspaceEdit, uri: Uri, line: TextLine) {
	wEdit.insert(uri, new vscode.Position(line.lineNumber, line.range.end.character), ` {cm:${getDateInISOFormat(new Date(), extensionConfig.completionDateIncludeTime)}}`);
}
export function removeDoneSymbolWorkspaceEdit(wEdit: WorkspaceEdit, uri: Uri, line: vscode.TextLine) {
	if (line.text.trim().startsWith(extensionConfig.doneSymbol)) {
		wEdit.delete(uri, new vscode.Range(line.lineNumber, line.firstNonWhitespaceCharacterIndex, line.lineNumber, line.firstNonWhitespaceCharacterIndex + extensionConfig.doneSymbol.length));
	}
}
export function removeCompletionDateWorkspaceEdit(edit: WorkspaceEdit, uri: vscode.Uri, task: TheTask) {
	if (task.completionDateRange) {
		edit.delete(uri, task.completionDateRange);
	}
}
export function archiveTaskWorkspaceEdit(edit: WorkspaceEdit, archiveFileEdit: WorkspaceEdit, archiveDocument: TextDocument, uri: vscode.Uri, line: vscode.TextLine, shouldDelete: boolean) {
	appendTaskToFileWorkspaceEdit(archiveFileEdit, archiveDocument, line.text);// Add task to archive file
	if (shouldDelete) {
		edit.delete(uri, line.rangeIncludingLineBreak);// Delete task from active file
	}
}
function addOverdueSpecialTagWorkspaceEdit(wEdit: WorkspaceEdit, uri: vscode.Uri, line: vscode.TextLine, overdueDateString: string) {
	wEdit.insert(uri, new vscode.Position(line.lineNumber, line.range.end.character), ` {overdue:${overdueDateString}}`);
}
export function setCountCurrentValueWorkspaceEdit(wEdit: WorkspaceEdit, uri: Uri, count: Count, value: string) {
	const charIndexWithOffset = count.range.start.character + 'count:'.length + 1;
	const currentRange = new vscode.Range(count.range.start.line, charIndexWithOffset, count.range.start.line, charIndexWithOffset + String(count.current).length);
	wEdit.replace(uri, currentRange, String(value));
}
function appendTaskToFileWorkspaceEdit(edit: WorkspaceEdit, document: TextDocument, text: string) {
	const eofPosition = document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end;
	edit.insert(document.uri, eofPosition, `\n${text}`);
}
export function toggleCommentAtLineWorkspaceEdit(wEdit: WorkspaceEdit, document: TextDocument, lineNumber: number) {
	const line = document.lineAt(lineNumber);
	if (line.text.startsWith('# ')) {
		wEdit.delete(document.uri, new vscode.Range(lineNumber, 0, lineNumber, 2));
	} else {
		wEdit.insert(document.uri, new vscode.Position(lineNumber, 0), '# ');
	}
}
