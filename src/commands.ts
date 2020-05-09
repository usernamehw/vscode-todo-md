import { commands, window, workspace, Range, TextEditor, TextDocument, TextLine, WorkspaceEdit, Uri } from 'vscode';
import * as vscode from 'vscode';
import * as fs from 'fs';

import { state, updateState, globalState } from './extension';
import { config } from './extension';
import { appendTaskToFile, getRandomInt, prominentNumber } from './utils';
import { sortTasks, SortProperty } from './sort';
import { getFullRangeFromLines, openFileInEditor, insertSnippet, setContext, followLink } from './vscodeUtils';
import { getDateInISOFormat } from './timeUtils';
import { updateTasksTreeView, updateAllTreeViews } from './treeViewProviders/treeViews';
import { TheTask, Count } from './parse';
import { TaskTreeItem } from './treeViewProviders/taskProvider';

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
			updateAllTreeViews();
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
			incrementCountForTask(document, ln, task);
		} else {
			toggleTaskAtLine(ln, document);
		}
	});
	commands.registerTextEditorCommand('todomd.archiveCompletedTasks', editor => {
		if (!config.defaultArchiveFile) {
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
			archiveTask(wEdit, editor.document.uri, line, !task.isRecurring);
		}
		workspace.applyEdit(wEdit);
	});
	commands.registerTextEditorCommand('todomd.archiveSelectedCompletedTasks', editor => {
		if (!config.defaultArchiveFile) {
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
			archiveTask(wEdit, editor.document.uri, line, !task.isRecurring);
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
		const dueTasks = tasks.filter(t => t.isDue);
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
			vscode.window.showInformationMessage(task.title);
		}
	});
	commands.registerCommand('todomd.getFewNextTasks', async () => {
		const document = await updateState();
		let tasks = state.tasks.filter(t => !t.done);
		if (!tasks.length) {
			vscode.window.showInformationMessage('No tasks');
			return;
		}
		const dueTasks = tasks.filter(t => t.isDue);
		const notDueTasks = tasks.filter(t => !t.isDue && !t.due);
		const sortedDueTasks = sortTasks(dueTasks, SortProperty.priority);
		const sortedNotDueTasks = sortTasks(notDueTasks, SortProperty.priority);
		tasks = [...sortedDueTasks, ...sortedNotDueTasks].slice(0, config.getNextNumberOfTasks);

		vscode.window.showInformationMessage(tasks.map((task, i) => `${prominentNumber(i + 1)} ${task.title}`).join('\n'), {
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
		const dueTasks = tasks.filter(t => t.isDue);
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
		const creationDate = config.addCreationDate ? `{cr:${getDateInISOFormat(new Date(), config.creationDateIncludeTime)}} ` : '';
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
			await appendTaskToFile(creationDate + text, config.defaultFile);
		}
	});
	commands.registerCommand('todomd.openDefaultArvhiveFile', async () => {
		const isOk = await checkArchiveFileAndNotify();
		if (!isOk) {
			return;
		}
		openFileInEditor(config.defaultArchiveFile);
	});
	commands.registerCommand('todomd.completeTask', async () => {
		const document = await updateState();
		const array = [];
		for (const task of state.tasks) {
			if (task.done) {
				continue;
			}
			array.push(task.title);
		}
		const result = await window.showQuickPick(array);
		if (!result) {
			return;
		}
		const task = state.tasks.find(t => t.title === result);
		if (!task) {
			return;
		}
		if (task.specialTags.count) {
			incrementCountForTask(document, task.ln, task);
		} else {
			toggleTaskAtLine(task.ln, document);
		}
	});
	commands.registerTextEditorCommand('todomd.filter', editor => {
		const qp = window.createQuickPick();
		qp.items = config.savedFilters.map(filter => new QPItem(filter.title));
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
				filterStr = config.savedFilters.find(filter => filter.title === selected)?.filter;
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
	commands.registerCommand('todomd.insertTodayDate', editor => {
		insertSnippet(getDateInISOFormat(new Date()));
	});
	commands.registerCommand('todomd.clearGlobalState', () => {
	// @ts-ignore No API
		globalState._value = {};
		globalState.update('hack', 'toClear');// TODO: is this required to clear state?
	});
	commands.registerCommand('todomd.goToLine', (lineNumber: number) => {
		const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
		const { activeTextEditor } = window;
		if (!activeTextEditor) {
			return;
		}
		vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
		activeTextEditor.selection = new vscode.Selection(range.start, range.end);
		activeTextEditor.revealRange(range, vscode.TextEditorRevealType.Default);
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
}
function archiveTask(wEdit: WorkspaceEdit, uri: Uri, line: vscode.TextLine, shouldDelete: boolean) {
	appendTaskToFile(line.text, config.defaultArchiveFile);
	if (shouldDelete) {
		wEdit.delete(uri, line.rangeIncludingLineBreak);
	}
}
function noArchiveFileMessage() {
	vscode.window.showWarningMessage('No default archive file specified');
}

export async function resetAllRecurringTasks(editor: TextEditor): Promise<void> {
	const wEdit = new WorkspaceEdit();
	for (const task of state.tasks) {
		if (task.isRecurring && task.done) {
			const line = editor.document.lineAt(task.ln);
			removeDoneSymbol(wEdit, editor.document.uri, line);
			removeCompletionDate(wEdit, editor.document.uri, line);
			const count = task.specialTags.count;
			if (count) {
				setCountCurrentValue(wEdit, editor.document.uri, count, '0');
			}
		}
	}
	await workspace.applyEdit(wEdit);
	editor.document.save();
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
		if (!config.addCompletionDate) {
			if (line.text.trim().startsWith(config.doneSymbol)) {
				workspaceEdit.delete(document.uri, new vscode.Range(ln, firstNonWhitespaceCharacterIndex, ln, firstNonWhitespaceCharacterIndex + config.doneSymbol.length));
			}
		} else {
			removeCompletionDate(workspaceEdit, document.uri, line);
		}
	} else {
		if (config.addCompletionDate) {
			insertCompletionDate(workspaceEdit, document.uri, line);
		} else {
			workspaceEdit.insert(document.uri, new vscode.Position(ln, firstNonWhitespaceCharacterIndex), config.doneSymbol);
		}
	}
	await workspace.applyEdit(workspaceEdit);
	document.save();

	if (config.autoArchiveTasks) {
		const secondWorkspaceEdit = new WorkspaceEdit();
		archiveTask(secondWorkspaceEdit, document.uri, line, !task.isRecurring);
		await workspace.applyEdit(secondWorkspaceEdit);// Not possible to apply conflicting ranges with just one edit
		document.save();
	}
}
async function checkDefaultFileAndNotify(): Promise<boolean> {
	const specify = 'Specify';
	if (!config.defaultFile) {
		const shouldSpecify = await window.showWarningMessage('Default file is not specified.', specify);
		if (shouldSpecify === specify) {
			specifyDefaultFile();
		}
		return false;
	} else {
		const exists = fs.existsSync(config.defaultFile);
		if (!exists) {
			const shouldSpecify = await window.showErrorMessage('Specified default file does not exist.', specify);
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
	if (!config.defaultArchiveFile) {
		const shouldSpecify = await window.showWarningMessage('Default archive file is not specified.', specify);
		if (shouldSpecify === specify) {
			specifyDefaultArchiveFile();
		}
		return false;
	} else {
		const exists = fs.existsSync(config.defaultArchiveFile);
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
	wEdit.insert(uri, new vscode.Position(line.lineNumber, line.range.end.character), ` {cm:${getDateInISOFormat(new Date(), config.completionDateIncludeTime)}}`);
}
function removeDoneSymbol(wEdit: WorkspaceEdit, uri: Uri, line: vscode.TextLine) {
	if (line.text.trim().startsWith(config.doneSymbol)) {
		wEdit.delete(uri, new Range(line.lineNumber, line.firstNonWhitespaceCharacterIndex, line.lineNumber, line.firstNonWhitespaceCharacterIndex + config.doneSymbol.length));
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
