import dayjs from 'dayjs';
import * as fs from 'fs';
import vscode, { commands, Range, TextDocument, TextEditor, TextLine, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { extensionConfig, getDocumentForDefaultFile, LAST_VISIT_STORAGE_KEY, state, updateState } from './extension';
import { Count, parseDocument, TheTask } from './parse';
import { SortProperty, sortTasks } from './sort';
import { DATE_FORMAT, getDateInISOFormat } from './timeUtils';
import { TaskTreeItem } from './treeViewProviders/taskProvider';
import { updateAllTreeViews, updateArchivedTasksTreeView, updateTasksTreeView } from './treeViewProviders/treeViews';
import { DueState } from './types';
import { appendTaskToFile, fancyNumber, getRandomInt } from './utils';
import { followLink, getFullRangeFromLines, openFileInEditor, openSettingGuiAt, setContext } from './vscodeUtils';

const FILTER_ACTIVE_CONTEXT_KEY = 'todomd:filterActive';

class QuickPickItem implements vscode.QuickPickItem {
	label: string;
	description?: string;

	constructor(label: string, description?: string) {
		this.label = label;
		this.description = description;
	}
}

export function registerAllCommands() {
	commands.registerCommand('todomd.toggleDone', async (treeItem?: TaskTreeItem) => {
		const editor = window.activeTextEditor;
		let document: vscode.TextDocument;
		let lineNumber: number;
		if (treeItem) {
			lineNumber = treeItem.task.lineNumber;
			document = await updateState();
		} else {
			if (!editor) {
				return;
			}
			lineNumber = editor.selection.active.line;
			document = editor.document;
		}

		const task = getTaskAtLine(lineNumber);
		if (!task) {
			return;
		}
		if (task.specialTags.count) {
			await incrementCountForTask(document, lineNumber, task);
		} else {
			await toggleTaskCompletionAtLine(lineNumber, document);
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
			const line = editor.document.lineAt(task.lineNumber);
			archiveTask(wEdit, editor.document.uri, line, !task.due?.isRecurring);
		}
		applyEdit(wEdit, editor.document);
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
		applyEdit(wEdit, editor.document);
	});
	commands.registerTextEditorCommand('todomd.sortByPriority', (editor, edit) => {
		const selection = editor.selection;
		if (selection.isEmpty) {
			vscode.window.showInformationMessage('Select tasks to sort');
			return;
		}
		const lineStart = selection.start.line;
		const lineEnd = selection.end.line;
		const tasks: TheTask[] = [];
		for (let i = lineStart; i <= lineEnd; i++) {
			const task = getTaskAtLine(i);
			if (task) {
				tasks.push(task);
			}
		}
		const sortedTasks = sortTasks(tasks, SortProperty.priority);
		const result = sortedTasks.map(t => t.rawText).join('\n');
		edit.replace(getFullRangeFromLines(editor.document, lineStart, lineEnd), result);
	});
	commands.registerTextEditorCommand('todomd.createSimilarTask', async editor => {
		// Create a task with all the tags, projects and contexts of another task
		const selection = editor.selection;
		const task = getTaskAtLine(selection.start.line);
		if (!task) {
			return;
		}
		const line = editor.document.lineAt(task.lineNumber);
		const wEdit = new WorkspaceEdit();

		const tagsAsString = task.tags.map(tag => ` #${tag}`).join('');
		const projectsAsString = task.projects.map(project => `+${project}`).join(' ');
		const contextsAsString = task.contexts.map(context => `@${context}`).join(' ');
		let newTaskAsString = tagsAsString;
		newTaskAsString += projectsAsString ? ` ${projectsAsString}` : '';
		newTaskAsString += contextsAsString ? ` ${contextsAsString}` : '';
		wEdit.insert(editor.document.uri, new vscode.Position(line.rangeIncludingLineBreak.end.line, line.rangeIncludingLineBreak.end.character), `${newTaskAsString}\n`);

		await applyEdit(wEdit, editor.document);

		editor.selection = new vscode.Selection(line.lineNumber + 1, 0, line.lineNumber + 1, 0);
	});
	commands.registerCommand('todomd.getNextTask', async () => {
		await updateState();
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
			const shouldFollow = await vscode.window.showInformationMessage(formatTask(task), buttonName);
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
	commands.registerCommand('todomd.getRandomTask', async () => {
		await updateState();
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
		vscode.window.showInformationMessage(formatTask(resultTask));
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
			applyEdit(wEdit, editor.document);
		} else {
			const isDefaultFileSpecified = await checkDefaultFileAndNotify();
			if (!isDefaultFileSpecified) {
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
		const line = editor.selection.active.line;
		const task = getTaskAtLine(line);
		const inputBox = window.createInputBox();
		let value: string | undefined;
		inputBox.show();

		inputBox.onDidChangeValue((e: string) => {
			value = e;
			// TODO: refactor: remove duplicate code
			const dayShiftMatch = /(\+|-)\d+?$/.exec(value);
			if (dayShiftMatch) {
				let dueDateToInsert = '';
				const match = dayShiftMatch[0];
				if (match[0] === '+') {
					dueDateToInsert = dayjs().add(Number(match.slice(1)), 'day').toString();
				} else if (match[0] === '-') {
					dueDateToInsert = dayjs().subtract(Number(match.slice(1)), 'day').toString();
				}
				inputBox.prompt = `${dueDateToInsert}        `;
			} else {
				inputBox.prompt = '❌        ';
			}
		});

		inputBox.onDidAccept(() => {
			if (!value) {
				return;
			}
			const dayShiftMatch = /(\+|-)\d+?$/.exec(value);
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
				if (task?.dueRange) {
					wEdit.replace(editor.document.uri, task.dueRange, dueDate);
				} else {
					wEdit.insert(editor.document.uri, editor.selection.active, ` ${dueDate}`);
				}
				applyEdit(wEdit, editor.document);
			}
			inputBox.hide();
			inputBox.dispose();
		});
	});
	commands.registerCommand('todomd.openDefaultArvhiveFile', async () => {
		const isDefaultFileSpecified = await checkArchiveFileAndNotify();
		if (!isDefaultFileSpecified) {
			return;
		}
		openFileInEditor(extensionConfig.defaultArchiveFile);
	});
	commands.registerCommand('todomd.completeTask', async () => {
		// Show Quick Pick to complete a task
		const document = await updateState();
		const notCompletedTasks = state.tasks.filter(task => !task.done).map(task => formatTask(task));
		const pickedTask = await window.showQuickPick(notCompletedTasks);
		if (!pickedTask) {
			return;
		}
		const task = state.tasks.find(t => formatTask(t) === pickedTask);
		if (!task) {
			return;
		}
		if (task.specialTags.count) {
			await incrementCountForTask(document, task.lineNumber, task);
		} else {
			await toggleTaskCompletionAtLine(task.lineNumber, document);
		}
		await updateState();
		updateAllTreeViews();
	});
	commands.registerTextEditorCommand('todomd.filter', editor => {
		const quickPick = window.createQuickPick();
		quickPick.items = extensionConfig.savedFilters.map(filter => new QuickPickItem(filter.title));
		let value: string | undefined;
		let selected: string | undefined;
		quickPick.onDidChangeValue(e => {
			value = e;
		});
		quickPick.onDidChangeSelection(e => {
			selected = e[0].label;
		});
		quickPick.show();
		quickPick.onDidAccept(() => {
			let filterStr;
			if (selected) {
				filterStr = extensionConfig.savedFilters.find(filter => filter.title === selected)?.filter;
			} else {
				filterStr = value;
			}
			quickPick.hide();
			quickPick.dispose();
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
		state.extensionContext.globalState.update('hack', 'toClear');// Is this required to clear state?
	});
	commands.registerCommand('todomd.goToLine', async (lineNumber: number) => {
		const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
		let editor;
		if (!state.theRightFileOpened) {
			const isDefaultFileSpecified = await checkDefaultFileAndNotify();
			if (!isDefaultFileSpecified) {
				return;
			}
			const document = await getDocumentForDefaultFile();
			editor = await window.showTextDocument(document);
		} else {
			const { activeTextEditor } = window;
			if (!activeTextEditor) {
				return;
			}
			await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
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
	let document: vscode.TextDocument;
	if (editor && state.theRightFileOpened) {
		document = editor.document;
	} else {
		document = await getDocumentForDefaultFile();
	}
	for (const task of state.tasks) {
		if (task.due?.isRecurring && task.done) {
			const line = document.lineAt(task.lineNumber);
			removeDoneSymbol(wEdit, document.uri, line);
			removeCompletionDate(wEdit, document.uri, line);
			const count = task.specialTags.count;
			if (count) {
				setCountCurrentValue(wEdit, document.uri, count, '0');
			}
		}
	}
	applyEdit(wEdit, document);
}
async function incrementCountForTask(document: vscode.TextDocument, lineNumber: number, task: TheTask) {
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
		removeCompletionDate(wEdit, document.uri, line);
	}
	return applyEdit(wEdit, document);
}
export async function toggleTaskCompletionAtLine(lineNumber: number, document: TextDocument): Promise<void> {
	const { firstNonWhitespaceCharacterIndex } = document.lineAt(lineNumber);
	const task = getTaskAtLine(lineNumber);
	if (!task) {
		return;
	}
	const line = document.lineAt(lineNumber);
	const wEdit = new WorkspaceEdit();
	if (task.done) {
		if (!extensionConfig.addCompletionDate) {
			if (line.text.trim().startsWith(extensionConfig.doneSymbol)) {
				wEdit.delete(document.uri, new vscode.Range(lineNumber, firstNonWhitespaceCharacterIndex, lineNumber, firstNonWhitespaceCharacterIndex + extensionConfig.doneSymbol.length));
			}
		} else {
			removeCompletionDate(wEdit, document.uri, line);
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
		archiveTask(secondWorkspaceEdit, document.uri, line, !task.due?.isRecurring);
		await applyEdit(secondWorkspaceEdit, document);// Not possible to apply conflicting ranges with just one edit
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
	openSettingGuiAt('todomd.defaultFile');
}
function specifyDefaultArchiveFile() {
	openSettingGuiAt('todomd.defaultArchiveFile');
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
		if (line.lineNumber === lineNumber) {
			return line;
		}
	}
	return undefined;
}
/**
 * TODO: move to TheTask class
 */
export function formatTask(task: TheTask): string {
	return task.title + (task.specialTags.count ? ` ${task.specialTags.count.current}/${task.specialTags.count.needed}` : '');
}
/**
 * Updates state for archived tasks
 */
export async function updateArchivedTasks() {
	if (!extensionConfig.defaultArchiveFile) {
		return;
	}
	const document = await workspace.openTextDocument(vscode.Uri.file(extensionConfig.defaultArchiveFile));
	const parsedArchiveTasks = parseDocument(document);
	state.archivedTasks = parsedArchiveTasks.tasks;
	updateArchivedTasksTreeView();
}
/**
 * vscode WorkspaceEdit allowes changing files that are not even opened.
 * document.save() is needed to prevent opening those files after applying the edit.
 */
export async function applyEdit(wEdit: WorkspaceEdit, document: vscode.TextDocument) {
	await workspace.applyEdit(wEdit);
	return await document.save();
}
