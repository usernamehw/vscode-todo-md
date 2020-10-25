import dayjs from 'dayjs';
import vscode, { TextDocument, WorkspaceEdit } from 'vscode';
import { applyEdit, getTaskAtLine, insertCompletionDate, removeDoneSymbol, setCountCurrentValue, updateArchivedTasks } from './commands';
import { DueDate } from './dueDate';
import { extensionConfig, state } from './extension';
import { parseDocument } from './parse';
import { TheTask } from './TheTask';
import { DATE_FORMAT } from './time/timeUtils';
import { DueState } from './types';

export function hideTask(document: vscode.TextDocument, lineNumber: number) {
	const wEdit = new WorkspaceEdit();
	const line = document.lineAt(lineNumber);
	wEdit.insert(document.uri, new vscode.Position(lineNumber, line.range.end.character), ' {h}');
	applyEdit(wEdit, document);
}

export async function setDueDate(document: vscode.TextDocument, lineNumber: number, newDueDate: dayjs.Dayjs) {
	const dueDate = `{due:${newDueDate.format(DATE_FORMAT)}}`;
	const wEdit = new WorkspaceEdit();
	const task = getTaskAtLine(lineNumber);
	if (task?.dueRange) {
		wEdit.replace(document.uri, task.dueRange, dueDate);
	} else {
		wEdit.insert(document.uri, new vscode.Position(lineNumber, 0), ` ${dueDate} `);
	}
	return await applyEdit(wEdit, document);
}

export function deleteTask(document: vscode.TextDocument, lineNumber: number) {
	const wEdit = new WorkspaceEdit();
	wEdit.delete(document.uri, document.lineAt(lineNumber).rangeIncludingLineBreak);
	applyEdit(wEdit, document);
}
/**
 * Either toggle done or increment count
 */
export async function toggleDoneOrIncrementCount(document: vscode.TextDocument, lineNumber: number) {
	const task = getTaskAtLine(lineNumber);
	if (!task) {
		return undefined;
	}
	if (task.specialTags.count) {
		return await incrementCountForTask(document, lineNumber, task);
	} else {
		return await toggleDoneAtLine(document, lineNumber);
	}
}
export async function incrementCountForTask(document: vscode.TextDocument, lineNumber: number, task: TheTask) {
	const line = document.lineAt(lineNumber);
	const wEdit = new WorkspaceEdit();
	const count = task.specialTags.count;
	if (!count) {
		return Promise.resolve(undefined);
	}
	let newValue = 0;
	if (count.current !== count.needed) {
		newValue = count.current + 1;
		if (newValue === count.needed) {
			insertCompletionDate(wEdit, document.uri, line);
		}
		setCountCurrentValue(wEdit, document.uri, count, String(newValue));
	} else {
		setCountCurrentValue(wEdit, document.uri, count, '0');
		removeCompletionDateWorkspaceEdit(wEdit, document.uri, line);
	}
	return applyEdit(wEdit, document);
}
export async function decrementCountForTask(document: vscode.TextDocument, lineNumber: number, task: TheTask) {
	const line = document.lineAt(lineNumber);
	const wEdit = new WorkspaceEdit();
	const count = task.specialTags.count;
	if (!count) {
		return Promise.resolve(undefined);
	}
	if (count.current === 0) {
		return Promise.resolve(undefined);
	} else if (count.current === count.needed) {
		removeCompletionDateWorkspaceEdit(wEdit, document.uri, line);
	}
	setCountCurrentValue(wEdit, document.uri, count, String(count.current - 1));
	return applyEdit(wEdit, document);
}
export async function incrementOrDecrementPriority(document: TextDocument, lineNumber: number, type: 'increment' | 'decrement') {
	const task = getTaskAtLine(lineNumber);
	if (!task ||
			type === 'increment' && task.priority === 'A' ||
			type === 'decrement' && task.priority === 'Z') {
		return undefined;
	}
	const newPriority = type === 'increment' ? String.fromCharCode(task.priority.charCodeAt(0) - 1) : String.fromCharCode(task.priority.charCodeAt(0) + 1);
	const wEdit = new WorkspaceEdit();
	if (task.priorityRange) {
		// Task has priority
		wEdit.replace(document.uri, task.priorityRange, `(${newPriority})`);
	} else {
		// No priority, create one
		wEdit.insert(document.uri, new vscode.Position(lineNumber, 0), `(${newPriority}) `);
	}
	return applyEdit(wEdit, document);
}
async function removeOverdueFromLine(document: vscode.TextDocument, task: TheTask) {
	const wEdit = new WorkspaceEdit();
	wEdit.replace(document.uri, task.overdueRange ?? new vscode.Range(0, 0, 0, 0), '');
	return applyEdit(wEdit, document);
}
export async function toggleDoneAtLine(document: TextDocument, lineNumber: number): Promise<void> {
	const { firstNonWhitespaceCharacterIndex } = document.lineAt(lineNumber);
	const task = getTaskAtLine(lineNumber);
	if (!task) {
		return;
	}
	if (task.specialTags.overdue) {
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
			removeCompletionDateWorkspaceEdit(wEdit, document.uri, line);
		}
	} else {
		if (extensionConfig.addCompletionDate) {
			insertCompletionDate(wEdit, document.uri, line);
		} else {
			wEdit.insert(document.uri, new vscode.Position(lineNumber, firstNonWhitespaceCharacterIndex), extensionConfig.doneSymbol);
		}
	}
	await applyEdit(wEdit, document);

	if (extensionConfig.autoArchiveTasks) {
		const secondWorkspaceEdit = new WorkspaceEdit();
		archiveTaskWorkspaceEdit(secondWorkspaceEdit, document.uri, line, !task.due?.isRecurring);
		await applyEdit(secondWorkspaceEdit, document);// Not possible to apply conflicting ranges with just one edit
	}
}
export function removeCompletionDateWorkspaceEdit(wEdit: WorkspaceEdit, uri: vscode.Uri, line: vscode.TextLine) {
	const completionDateRegex = /\s{cm:\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?}\s?/;
	const match = completionDateRegex.exec(line.text);
	if (match) {
		wEdit.delete(uri, new vscode.Range(line.lineNumber, match.index, line.lineNumber, match.index + match[0].length));
	}
}
export function archiveTaskWorkspaceEdit(wEdit: WorkspaceEdit, uri: vscode.Uri, line: vscode.TextLine, shouldDelete: boolean) {
	appendTaskToFile(line.text, extensionConfig.defaultArchiveFile);
	if (shouldDelete) {
		wEdit.delete(uri, line.rangeIncludingLineBreak);
	}
	updateArchivedTasks();
}
function addOverdueSpecialTagWorkspaceEdit(wEdit: WorkspaceEdit, uri: vscode.Uri, line: vscode.TextLine, overdueDateString: string) {
	wEdit.insert(uri, new vscode.Position(line.lineNumber, line.range.end.character), ` {overdue:${overdueDateString}}`);
}

export async function goToTask(lineNumber: number) {
	const document = getActiveDocument();
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

export async function resetAllRecurringTasks(document: vscode.TextDocument, lastVisit: Date | string = new Date()) {
	if (typeof lastVisit === 'string') {
		lastVisit = new Date(lastVisit);
	}
	const wEdit = new WorkspaceEdit();
	const tasks = (await parseDocument(document)).tasks;
	for (const task of tasks) {
		if (task.due?.isRecurring) {
			const line = document.lineAt(task.lineNumber);
			if (task.done) {
				removeDoneSymbol(wEdit, document.uri, line);
				removeCompletionDateWorkspaceEdit(wEdit, document.uri, line);
			} else {
				if (!task.specialTags.overdue && !dayjs().isSame(lastVisit, 'day')) {
					const lastVisitWithoutTime = new Date(lastVisit.getFullYear(), lastVisit.getMonth(), lastVisit.getDate());
					const now = new Date();
					const nowWithoutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

			const count = task.specialTags.count;
			if (count) {
				setCountCurrentValue(wEdit, document.uri, count, '0');
			}
		}
	}
	return applyEdit(wEdit, document);
}

export function getActiveDocument() {
	if (state.activeDocument === undefined) {
		vscode.window.showErrorMessage('No active document');
		throw new Error('No active document');
	}
	if (state.activeDocument.isClosed) {
		vscode.workspace.openTextDocument(state.activeDocument.uri);
	}
	return state.activeDocument;
}

export async function getDocumentForDefaultFile() {
	if (!extensionConfig.defaultFile) {
		return undefined;
	}
	return await vscode.workspace.openTextDocument(vscode.Uri.file(extensionConfig.defaultFile));
}
export async function appendTaskToFile(text: string, filePath: string) {
	const uri = vscode.Uri.file(filePath);
	const document = await vscode.workspace.openTextDocument(uri);
	const wEdit = new WorkspaceEdit();
	const eofPosition = document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end;
	wEdit.insert(uri, eofPosition, `\n${text}`);
	return applyEdit(wEdit, document);
}
export function toggleCommentAtLineWorkspaceEdit(wEdit: WorkspaceEdit, document: TextDocument, lineNumber: number) {
	const line = document.lineAt(lineNumber);
	if (line.text.startsWith('# ')) {
		wEdit.delete(document.uri, new vscode.Range(lineNumber, 0, lineNumber, 2));
	} else {
		wEdit.insert(document.uri, new vscode.Position(lineNumber, 0), '# ');
	}
}
