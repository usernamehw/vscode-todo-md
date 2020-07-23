import dayjs from 'dayjs';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { commands, Range, TextDocument, TextEditor, TextLine, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { extensionConfig, getDocumentForDefaultFile, LAST_VISIT_STORAGE_KEY, state, updateState } from './extension';
import { Count, parseDocument, TheTask } from './parse';
import { SortProperty, sortTasks } from './sort';
import { DATE_FORMAT, getDateInISOFormat } from './timeUtils';
import { TaskTreeItem } from './treeViewProviders/taskProvider';
import { updateAllTreeViews, updateArchivedTasksTreeView, updateTasksTreeView } from './treeViewProviders/treeViews';
import { DueState } from './types';
import { appendTaskToFile, fancyNumber, getRandomInt } from './utils';
import { followLink, getFullRangeFromLines, openFileInEditor, setContext } from './vscodeUtils';
import { createAgendaWebview } from './webview/agenda';

const FILTER_ACTIVE_CONTEXT_KEY = 'todomd:filterActive';

class QPItem implements vscode.QuickPickItem {
	constructor(public label: string) {
		this.label = label;
	}
}

export function registerCommands() {
	commands.registerCommand('todomd.toggleDone', async (treeItem?: TaskTreeItem) => {
		const editor = window.activeTextEditor;
		let document;
		let ln;
		if (treeItem) {
			ln = treeItem.task.ln;
			document = await updateState();
		} else {
			if (!editor) {
				return;
			}
			ln = editor.selection.active.line;
			document = editor.document;
		}

		const task = getTaskAtLine(ln);
		if (!task) {
			return;
		}
		if (task.specialTags.count) {
			await incrementCountForTask(document, ln, task);
		} else {
			await toggleTaskAtLine(ln, document);
		}

		await updateState();
		updateAllTreeViews();
	});
	commands.registerTextEditorCommand('todomd.archiveCompletedTasks', editor => {
		if (!extensionConfig.defaultArchiveFile) {
			noArchiveFileMessage();
			return;
		}
		const completedTasks = state.tasks.filter(t => t.done);
		if (!completedTasks.length) {
			return;
		}
		const wEdit = new WorkspaceEdit();
		for (const task of completedTasks) {
			const line = editor.document.lineAt(task.ln);
			archiveTask(wEdit, editor.document.uri, line, !task.due?.isRecurring);
		}
		workspace.applyEdit(wEdit);
	});
	commands.registerTextEditorCommand('todomd.archiveSelectedCompletedTasks', editor => {
		if (!extensionConfig.defaultArchiveFile) {
			noArchiveFileMessage();
			return;
		}
		const selection = editor.selection;
		const wEdit = new WorkspaceEdit();
		for (let i = selection.start.line; i <= selection.end.line; i++) {
			const task = getTaskAtLine(i);
			if (!task || !task.done) {
				continue;
			}
			const line = editor.document.lineAt(i);
			archiveTask(wEdit, editor.document.uri, line, !task.due?.isRecurring);
		}
		workspace.applyEdit(wEdit);
	});
	commands.registerTextEditorCommand('todomd.sortByPriority', (editor, edit) => {
		const selection = editor.selection;
		if (selection.isEmpty) {
			vscode.window.showInformationMessage('Select tasks to sort');
			return;
		}
		const lineStart = selection.start.line;
		const lineEnd = selection.end.line;
		const tasks: any[] = [];
		for (let i = lineStart; i <= lineEnd; i++) {
			const task: any = getTaskAtLine(i);
			if (task) {
				task.line = editor.document.lineAt(i).text;
				tasks.push(task);
			}
		}
		const sortedTasks: any[] = sortTasks(tasks, SortProperty.priority);
		const result = sortedTasks.map(t => t.line).join('\n');
		edit.replace(getFullRangeFromLines(editor.document, lineStart, lineEnd), result);
	});
	commands.registerTextEditorCommand('todomd.createSimilarTask', async editor => {
		const selection = editor.selection;
		const task = getTaskAtLine(selection.start.line);
		if (!task) {
			return;
		}
		const line = editor.document.lineAt(task.ln);
		const wEdit = new WorkspaceEdit();
		const tagsAsString = task.tags.map(tag => ` #${tag}`).join('');
		const projectsAsString = task.projects.map(project => `+${project}`).join(' ');
		const contextsAsString = task.contexts.map(context => `@${context}`).join(' ');
		let newTaskAsString = tagsAsString;
		newTaskAsString += projectsAsString ? ` ${projectsAsString}` : '';
		newTaskAsString += contextsAsString ? ` ${contextsAsString}` : '';
		wEdit.insert(editor.document.uri, new vscode.Position(line.rangeIncludingLineBreak.end.line, line.rangeIncludingLineBreak.end.character), `${newTaskAsString}\n`);
		await workspace.applyEdit(wEdit);
		await editor.document.save();
		editor.selection = new vscode.Selection(line.lineNumber + 1, 0, line.lineNumber + 1, 0);
	});
	commands.registerCommand('todomd.getNextTask', async () => {
		const document = await updateState();
		let tasks = state.tasks.filter(t => !t.done);
		if (!tasks.length) {
			vscode.window.showInformationMessage('No tasks');
			return;
		}
		const dueTasks = tasks.filter(t => t.due?.isDue);
		if (dueTasks.length) {
			tasks = dueTasks;
		} else {
			tasks = tasks.filter(t => !t.due);
		}

		const sortedTasks = sortTasks(tasks, SortProperty.priority);
		const task = sortedTasks[0];
		if (task.specialTags.link) {
			const buttonName = 'Follow link';
			const shouldFollow = await vscode.window.showInformationMessage(task.title, buttonName);
			if (shouldFollow === buttonName) {
				followLink(task.specialTags.link);
			}
		} else {
			vscode.window.showInformationMessage(formatTask(task));
		}
	});
	commands.registerCommand('todomd.getFewNextTasks', async () => {
		await updateState();
		let tasks = state.tasks.filter(t => !t.done);
		if (!tasks.length) {
			vscode.window.showInformationMessage('No tasks');
			return;
		}
		const overdueTasks = tasks.filter(t => t.due?.isDue === DueState.overdue);
		const dueTasks = tasks.filter(t => t.due?.isDue === DueState.due);
		const notDueTasks = tasks.filter(t => !t.due?.isDue && !t.due);
		const sortedOverdueTasks = sortTasks(overdueTasks, SortProperty.priority);
		const sortedDueTasks = sortTasks(dueTasks, SortProperty.priority);
		const sortedNotDueTasks = sortTasks(notDueTasks, SortProperty.priority);
		tasks = [...sortedOverdueTasks, ...sortedDueTasks, ...sortedNotDueTasks].slice(0, extensionConfig.getNextNumberOfTasks);

		vscode.window.showInformationMessage(tasks.map((task, i) => `${fancyNumber(i + 1)} ${formatTask(task)}`).join('\n'), {
			modal: true,
		});
	});
	commands.registerCommand('todomd.getRandomTask', () => {
		const document = updateState();
		let tasks = state.tasks.filter(t => !t.done);
		if (!tasks.length) {
			vscode.window.showInformationMessage('No tasks');
			return;
		}
		const dueTasks = tasks.filter(t => t.due?.isDue);
		let resultTask;
		if (dueTasks.length) {
			resultTask = dueTasks[getRandomInt(0, dueTasks.length - 1)];
		} else {
			tasks = tasks.filter(t => !t.due);
			resultTask = tasks[getRandomInt(0, tasks.length - 1)];
		}
		vscode.window.showInformationMessage(resultTask.title);
	});
	commands.registerCommand('todomd.addTask', async () => {
		const creationDate = extensionConfig.addCreationDate ? `{cr:${getDateInISOFormat(new Date(), extensionConfig.creationDateIncludeTime)}} ` : '';
		if (state.theRightFileOpened) {
			const editor = window.activeTextEditor!;
			const text = await window.showInputBox();
			if (!text) {
				return;
			}
			const line = editor.document.lineAt(editor.selection.active.line);
			const wEdit = new WorkspaceEdit();
			wEdit.insert(editor.document.uri, line.rangeIncludingLineBreak.start, creationDate + text);
			workspace.applyEdit(wEdit);
			editor.document.save();
		} else {
			const isOk = await checkDefaultFileAndNotify();
			if (!isOk) {
				return;
			}
			const text = await window.showInputBox();
			if (!text) {
				return;
			}
			await appendTaskToFile(creationDate + text, extensionConfig.defaultFile);
		}
	});
	commands.registerTextEditorCommand('todomd.setDueDate', async editor => {
		const text = await window.showInputBox();
		if (!text) {
			return;
		}
		const line = editor.selection.active.line;
		const task = getTaskAtLine(line);
		const dayShiftMatch = /(\+|-)\d+?$/.exec(text);
		if (dayShiftMatch) {
			let dueDateToInsert = '';
			const match = dayShiftMatch[0];
			if (match[0] === '+') {
				dueDateToInsert = dayjs().add(Number(match.slice(1)), 'day').format(DATE_FORMAT);
			} else if (match[0] === '-') {
				dueDateToInsert = dayjs().subtract(Number(match.slice(1)), 'day').format(DATE_FORMAT);
			}
			const dueDate = `{due:${dueDateToInsert}}`;
			const wEdit = new WorkspaceEdit();
			if (task?.due?.range) {
				wEdit.replace(editor.document.uri, task.due.range, dueDate);
			} else {
				wEdit.insert(editor.document.uri, editor.selection.active, ` ${dueDate}`);
			}
			workspace.applyEdit(wEdit);
			editor.document.save();
		}
	});
	commands.registerCommand('todomd.openDefaultArvhiveFile', async () => {
		const isOk = await checkArchiveFileAndNotify();
		if (!isOk) {
			return;
		}
		openFileInEditor(extensionConfig.defaultArchiveFile);
	});
	commands.registerCommand('todomd.completeTask', async () => {
		const document = await updateState();
		const array = [];
		for (const task of state.tasks) {
			if (task.done) {
				continue;
			}
			array.push(formatTask(task));
		}
		const result = await window.showQuickPick(array);
		if (!result) {
			return;
		}
		const task = state.tasks.find(t => formatTask(t) === result);
		if (!task) {
			return;
		}
		if (task.specialTags.count) {
			await incrementCountForTask(document, task.ln, task);
		} else {
			await toggleTaskAtLine(task.ln, document);
		}
		await updateState();
		updateAllTreeViews();
	});
	commands.registerTextEditorCommand('todomd.filter', editor => {
		const qp = window.createQuickPick();
		qp.items = extensionConfig.savedFilters.map(filter => new QPItem(filter.title));
		let value: string | undefined;
		let selected: string | undefined;
		qp.onDidChangeValue(e => {
			value = e;
		});
		qp.onDidChangeSelection(e => {
			selected = e[0].label;
		});
		qp.show();
		qp.onDidAccept(() => {
			let filterStr;
			if (selected) {
				filterStr = extensionConfig.savedFilters.find(filter => filter.title === selected)?.filter;
			} else {
				filterStr = value;
			}
			qp.hide();
			qp.dispose();
			if (!filterStr || !filterStr.length) {
				return;
			}
			setContext(FILTER_ACTIVE_CONTEXT_KEY, true);
			state.taskTreeViewFilterValue = filterStr;
			updateTasksTreeView();
		});
	});
	commands.registerCommand('todomd.clearFilter', editor => {
		setContext(FILTER_ACTIVE_CONTEXT_KEY, false);
		state.taskTreeViewFilterValue = '';
		updateTasksTreeView();
	});
	commands.registerCommand('todomd.clearGlobalState', () => {
	// @ts-ignore No API
		state.extensionContext.globalState._value = {};
		state.extensionContext.globalState.update('hack', 'toClear');// TODO: is this required to clear state?
	});
	commands.registerCommand('todomd.goToLine', async (lineNumber: number) => {
		const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
		let editor;
		if (!state.theRightFileOpened) {
			const isOk = await checkDefaultFileAndNotify();
			if (!isOk) {
				return;
			}
			const document = await getDocumentForDefaultFile();
			editor = await window.showTextDocument(document);
		} else {
			const { activeTextEditor } = window;
			if (!activeTextEditor) {
				return;
			}
			vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
			editor = activeTextEditor;
		}
		editor.selection = new vscode.Selection(range.start, range.end);
		editor.revealRange(range, vscode.TextEditorRevealType.Default);
	});
	commands.registerTextEditorCommand('todomd.resetAllRecurringTasks', editor => {
		resetAllRecurringTasks(editor);
	});
	commands.registerCommand('todomd.followLink', (treeItem: TaskTreeItem) => {
		const link = treeItem.task.specialTags.link;
		if (link) {
			followLink(link);
		}
	});
	commands.registerCommand('todomd.setLastVisitYesterday', () => {
		state.extensionContext.globalState.update(LAST_VISIT_STORAGE_KEY, dayjs().subtract(1, 'day').toDate());
	});
	commands.registerCommand('todomd.agenda', () => {
		createAgendaWebview();
	});
	commands.registerCommand('todomd.calendar', () => {
		// createCalendarWebview();
	});
	commands.registerCommand('todomd.setDate', (date: string, position: vscode.Position) => {
	});
}

function archiveTask(wEdit: WorkspaceEdit, uri: Uri, line: vscode.TextLine, shouldDelete: boolean) {
	appendTaskToFile(line.text, extensionConfig.defaultArchiveFile);
	if (shouldDelete) {
		wEdit.delete(uri, line.rangeIncludingLineBreak);
	}
	updateArchivedTasks();
}
function noArchiveFileMessage() {
	vscode.window.showWarningMessage('No default archive file specified');
}

export async function resetAllRecurringTasks(editor?: TextEditor): Promise<void> {
	const wEdit = new WorkspaceEdit();
	let document;
	if (editor && state.theRightFileOpened) {
		document = editor.document;
	} else {
		document = await getDocumentForDefaultFile();
	}
	for (const task of state.tasks) {
		if (task.due?.isRecurring && task.done) {
			const line = document.lineAt(task.ln);
			removeDoneSymbol(wEdit, document.uri, line);
			removeCompletionDate(wEdit, document.uri, line);
			const count = task.specialTags.count;
			if (count) {
				setCountCurrentValue(wEdit, document.uri, count, '0');
			}
		}
	}
	await workspace.applyEdit(wEdit);
	document.save();
}
async function incrementCountForTask(document: vscode.TextDocument, ln: number, task: TheTask) {
	const line = document.lineAt(ln);
	const wEdit = new WorkspaceEdit();
	const count = task.specialTags.count;
	if (!count) {
		return;
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
		removeCompletionDate(wEdit, document.uri, line);
	}
	await vscode.workspace.applyEdit(wEdit);
	document.save();
}
export async function toggleTaskAtLine(ln: number, document: TextDocument): Promise<void> {
	const firstNonWhitespaceCharacterIndex = document.lineAt(ln).firstNonWhitespaceCharacterIndex;
	const task = getTaskAtLine(ln);
	if (!task) {
		return;
	}
	const line = document.lineAt(ln);
	const workspaceEdit = new WorkspaceEdit();
	if (task.done) {
		if (!extensionConfig.addCompletionDate) {
			if (line.text.trim().startsWith(extensionConfig.doneSymbol)) {
				workspaceEdit.delete(document.uri, new vscode.Range(ln, firstNonWhitespaceCharacterIndex, ln, firstNonWhitespaceCharacterIndex + extensionConfig.doneSymbol.length));
			}
		} else {
			removeCompletionDate(workspaceEdit, document.uri, line);
		}
	} else {
		if (extensionConfig.addCompletionDate) {
			insertCompletionDate(workspaceEdit, document.uri, line);
		} else {
			workspaceEdit.insert(document.uri, new vscode.Position(ln, firstNonWhitespaceCharacterIndex), extensionConfig.doneSymbol);
		}
	}
	await workspace.applyEdit(workspaceEdit);
	document.save();

	if (extensionConfig.autoArchiveTasks) {
		const secondWorkspaceEdit = new WorkspaceEdit();
		archiveTask(secondWorkspaceEdit, document.uri, line, !task.due?.isRecurring);
		await workspace.applyEdit(secondWorkspaceEdit);// Not possible to apply conflicting ranges with just one edit
		document.save();
	}
}
async function checkDefaultFileAndNotify(): Promise<boolean> {
	const specify = 'Specify';
	if (!extensionConfig.defaultFile) {
		const shouldSpecify = await window.showWarningMessage('Default file is not specified.', specify);
		if (shouldSpecify === specify) {
			specifyDefaultFile();
		}
		return false;
	} else {
		const exists = fs.existsSync(extensionConfig.defaultFile);
		if (!exists) {
			const shouldSpecify = await window.showErrorMessage('Default file does not exist.', specify);
			if (shouldSpecify === specify) {
				specifyDefaultFile();
			}
			return false;
		} else {
			return true;
		}
	}
}
async function checkArchiveFileAndNotify(): Promise<boolean> {
	const specify = 'Specify';
	if (!extensionConfig.defaultArchiveFile) {
		const shouldSpecify = await window.showWarningMessage('Default archive file is not specified.', specify);
		if (shouldSpecify === specify) {
			specifyDefaultArchiveFile();
		}
		return false;
	} else {
		const exists = fs.existsSync(extensionConfig.defaultArchiveFile);
		if (!exists) {
			const shouldSpecify = await window.showErrorMessage('Specified default archive file does not exist.', specify);
			if (shouldSpecify === specify) {
				specifyDefaultArchiveFile();
			}
			return false;
		} else {
			return true;
		}
	}
}
function specifyDefaultFile() {
	vscode.commands.executeCommand('workbench.action.openSettings', 'todomd.defaultFile');
}
function specifyDefaultArchiveFile() {
	vscode.commands.executeCommand('workbench.action.openSettings', 'todomd.defaultArchiveFile');
}
function insertCompletionDate(wEdit: WorkspaceEdit, uri: Uri, line: TextLine) {
	wEdit.insert(uri, new vscode.Position(line.lineNumber, line.range.end.character), ` {cm:${getDateInISOFormat(new Date(), extensionConfig.completionDateIncludeTime)}}`);
}
function removeDoneSymbol(wEdit: WorkspaceEdit, uri: Uri, line: vscode.TextLine) {
	if (line.text.trim().startsWith(extensionConfig.doneSymbol)) {
		wEdit.delete(uri, new Range(line.lineNumber, line.firstNonWhitespaceCharacterIndex, line.lineNumber, line.firstNonWhitespaceCharacterIndex + extensionConfig.doneSymbol.length));
	}
}
function removeCompletionDate(wEdit: WorkspaceEdit, uri: Uri, line: TextLine) {
	const completionDateRegex = /\s{cm:\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?}\s?/;
	const match = completionDateRegex.exec(line.text);
	if (match) {
		wEdit.delete(uri, new Range(line.lineNumber, match.index, line.lineNumber, match.index + match[0].length));
	}
}
function setCountCurrentValue(wEdit: WorkspaceEdit, uri: Uri, count: Count, value: string) {
	const charIndexWithOffset = count.range.start.character + 'count:'.length + 1;
	const currentRange = new vscode.Range(count.range.start.line, charIndexWithOffset, count.range.start.line, charIndexWithOffset + String(count.current).length);
	wEdit.replace(uri, currentRange, String(value));
}
export function getTaskAtLine(lineNumber: number): TheTask | undefined {
	for (const line of state.tasks) {
		if (line.ln === lineNumber) {
			return line;
		}
	}
	return undefined;
}

export function formatTask(task: TheTask): string {
	return task.title + (task.specialTags.count ? ` ${task.specialTags.count.current}/${task.specialTags.count.needed}` : '');
}

export async function updateArchivedTasks() {
	if (!extensionConfig.defaultArchiveFile) {
		return;
	}
	const document = await workspace.openTextDocument(vscode.Uri.file(extensionConfig.defaultArchiveFile));
	const parsedArchiveTasks = parseDocument(document);
	state.archivedTasks = parsedArchiveTasks.tasks;
	updateArchivedTasksTreeView();
}
