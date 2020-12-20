import dayjs from 'dayjs';
import fs from 'fs';
import vscode, { commands, TextDocument, ThemeIcon, window, workspace, WorkspaceEdit } from 'vscode';
import { appendTaskToFile, archiveTaskWorkspaceEdit, getActiveDocument, goToTask, hideTask, incrementCountForTask, incrementOrDecrementPriority, resetAllRecurringTasks, setDueDate, toggleCommentAtLineWorkspaceEdit, toggleDoneAtLine, toggleDoneOrIncrementCount, tryToDeleteTask } from './documentActions';
import { DueDate } from './dueDate';
import { extensionConfig, LAST_VISIT_BY_FILE_STORAGE_KEY, state, updateLastVisitGlobalState, updateState } from './extension';
import { parseDocument } from './parse';
import { defaultSortTasks, SortProperty, sortTasks } from './sort';
import { findTaskAtLineExtension } from './taskUtils';
import { TheTask } from './TheTask';
import { helpCreateDueDate } from './time/setDueDateHelper';
import { getDateInISOFormat } from './time/timeUtils';
import { TaskTreeItem } from './treeViewProviders/taskProvider';
import { tasksView, updateAllTreeViews, updateArchivedTasksTreeView, updateTasksTreeView } from './treeViewProviders/treeViews';
import { State, VscodeContext } from './types';
import { fancyNumber, getRandomInt } from './utils';
import { followLink, followLinks, getFullRangeFromLines, inputOffset, openFileInEditor, openSettingGuiAt, setContext } from './vscodeUtils';

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
			document = await getActiveDocument();
		} else {
			if (!editor) {
				return;
			}
			lineNumber = editor.selection.active.line;
			document = editor.document;
		}

		await toggleDoneOrIncrementCount(document, lineNumber);

		await updateState();
		updateAllTreeViews();
	});
	commands.registerCommand('todomd.hideTask', async (treeItem?: TaskTreeItem) => {
		if (!treeItem) {
			return;
		}
		const lineNumber = treeItem.task.lineNumber;
		const document = await getActiveDocument();

		hideTask(document, lineNumber);

		await updateState();
		updateAllTreeViews();
	});
	commands.registerCommand('todomd.deleteTask', async (treeItem?: TaskTreeItem) => {
		if (!treeItem) {
			return;
		}
		const lineNumber = treeItem.task.lineNumber;
		const document = await getActiveDocument();

		await tryToDeleteTask(document, lineNumber);

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
			archiveTaskWorkspaceEdit(wEdit, editor.document.uri, line, !task.due?.isRecurring);
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
			const task = findTaskAtLineExtension(i);
			if (!task || !task.done) {
				continue;
			}
			const line = editor.document.lineAt(i);
			archiveTaskWorkspaceEdit(wEdit, editor.document.uri, line, !task.due?.isRecurring);
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
			const task = findTaskAtLineExtension(i);
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
		const task = findTaskAtLineExtension(selection.start.line);
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
		const tasks = state.tasks.filter(t => !t.done);
		if (!tasks.length) {
			vscode.window.showInformationMessage('No tasks');
			return;
		}
		const sortedTasks = defaultSortTasks(tasks);
		const task = sortedTasks[0];

		if (task.links.length) {
			const buttonName = 'Follow link';
			const shouldFollow = await vscode.window.showInformationMessage(TheTask.formatTask(task), buttonName);
			if (shouldFollow === buttonName) {
				followLinks(task.links);
			}
		} else {
			vscode.window.showInformationMessage(TheTask.formatTask(task));
		}
	});
	commands.registerCommand('todomd.getFewNextTasks', async () => {
		await updateState();
		const tasks = state.tasks.filter(t => !t.done);
		if (!tasks.length) {
			vscode.window.showInformationMessage('No tasks');
			return;
		}
		const sortedTasks = defaultSortTasks(tasks)
			.slice(0, extensionConfig.getNextNumberOfTasks);

		vscode.window.showInformationMessage(sortedTasks.map((task, i) => `${fancyNumber(i + 1)} ${TheTask.formatTask(task)}`).join('\n'), {
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
		vscode.window.showInformationMessage(TheTask.formatTask(resultTask));
	});
	commands.registerCommand('todomd.addTaskToDefaultFile', async () => {
		const isDefaultFileSpecified = await checkDefaultFileAndNotify();
		if (!isDefaultFileSpecified) {
			return;
		}
		const text = await window.showInputBox({
			prompt: 'Add a task to default file',
		});
		if (!text) {
			return;
		}
		await addTaskToFile(text, extensionConfig.defaultFile);
		await updateState();
		updateAllTreeViews();
	});
	commands.registerCommand('todomd.addTaskToActiveFile', async () => {
		const activeFilePath = state.activeDocument?.uri.fsPath;
		if (!activeFilePath) {
			return;
		}
		const text = await window.showInputBox({
			prompt: 'Add a task to active file',
		});
		if (!text) {
			return;
		}
		addTaskToFile(text, activeFilePath);
		await updateState();
		updateAllTreeViews();
	});
	async function addTaskToFile(text: string, filePath: string) {
		const creationDate = extensionConfig.addCreationDate ? `{cr:${getDateInISOFormat(new Date(), extensionConfig.creationDateIncludeTime)}} ` : '';
		return await appendTaskToFile(`${creationDate}${text}`, filePath);
	}
	commands.registerTextEditorCommand('todomd.setDueDate', editor => {
		const line = editor.selection.active.line;
		const inputBox = window.createInputBox();
		let value: string | undefined = '+0';
		inputBox.value = value;
		inputBox.title = 'Set due date';
		const docsButtonName = 'Documentation';
		inputBox.onDidTriggerButton(e => {
			if (e.tooltip === docsButtonName) {
				followLink('https://github.com/usernamehw/vscode-todo-md/blob/master/docs/docs.md#set-due-date-helper-function-todomdsetduedate');
			}
		});
		inputBox.buttons = [{
			iconPath: new ThemeIcon('question'),
			tooltip: docsButtonName,
		}];
		inputBox.prompt = inputOffset(new DueDate(helpCreateDueDate(value)!).closestDueDateInTheFuture);
		inputBox.show();

		inputBox.onDidChangeValue((e: string) => {
			value = e;
			const newDueDate = helpCreateDueDate(value);
			if (!newDueDate) {
				inputBox.prompt = inputOffset('❌');
				return;
			}
			inputBox.prompt = inputOffset(new DueDate(newDueDate).closestDueDateInTheFuture);
		});

		inputBox.onDidAccept(() => {
			if (!value) {
				return;
			}
			const newDueDate = helpCreateDueDate(value);

			if (newDueDate) {
				setDueDate(editor.document, line, newDueDate);
				inputBox.hide();
				inputBox.dispose();
			}
		});
	});
	commands.registerCommand('todomd.setDueDateWithArgs', async (document: TextDocument, wordRange: vscode.Range, dueDate: string) => {
		const lineNumber = wordRange.start.line;
		const wEdit = new WorkspaceEdit();
		wEdit.delete(document.uri, wordRange);
		await applyEdit(wEdit, document);
		setDueDate(document, lineNumber, dueDate);
	});
	commands.registerCommand('todomd.openDefaultArvhiveFile', async () => {
		const isDefaultFileSpecified = await checkArchiveFileAndNotify();
		if (!isDefaultFileSpecified) {
			return;
		}
		openFileInEditor(extensionConfig.defaultArchiveFile);
	});
	commands.registerCommand('todomd.openDefaultFile', async () => {
		const isDefaultFileSpecified = await checkDefaultFileAndNotify();
		if (!isDefaultFileSpecified) {
			return;
		}
		openFileInEditor(extensionConfig.defaultFile);
	});
	commands.registerCommand('todomd.specifyDefaultFile', specifyDefaultFile);
	commands.registerCommand('todomd.completeTask', async () => {
		// Show Quick Pick to complete a task
		const document = await getActiveDocument();
		const notCompletedTasks = state.tasks.filter(task => !task.done).map(task => TheTask.formatTask(task));
		const pickedTask = await window.showQuickPick(notCompletedTasks, {
			placeHolder: 'Choose a task to complete',
		});
		if (!pickedTask) {
			return;
		}
		const task = state.tasks.find(t => TheTask.formatTask(t) === pickedTask);
		if (!task) {
			return;
		}
		if (task.count) {
			await incrementCountForTask(document, task.lineNumber, task);
		} else {
			await toggleDoneAtLine(document, task.lineNumber);
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
			tasksView.description = filterStr;
			setContext(VscodeContext.filterActive, true);
			state.taskTreeViewFilterValue = filterStr;
			updateTasksTreeView();
		});
	});
	commands.registerCommand('todomd.clearFilter', editor => {
		tasksView.description = undefined;
		setContext(VscodeContext.filterActive, false);
		state.taskTreeViewFilterValue = '';
		updateTasksTreeView();
	});
	commands.registerCommand('todomd.clearGlobalState', () => {
	// @ts-ignore No API
		state.extensionContext.globalState._value = {};
		state.extensionContext.globalState.update('hack', 'toClear');// Is this required to clear state?
	});
	commands.registerCommand('todomd.showGlobalState', () => {
		// @ts-ignore
		const lastVisitByFile: State['lastVisitByFile'] = state.extensionContext.globalState.get(LAST_VISIT_BY_FILE_STORAGE_KEY);
		for (const key in lastVisitByFile) {
			console.log(key, new Date(lastVisitByFile[key]), dayjs().to(lastVisitByFile[key]));
		}
	});
	commands.registerCommand('todomd.goToLine', (lineNumber: number) => {
		goToTask(lineNumber);
	});
	commands.registerTextEditorCommand('todomd.resetAllRecurringTasks', editor => {
		const lastVisit = state.lastVisitByFile[editor.document.uri.toString()];
		resetAllRecurringTasks(editor.document, lastVisit);
	});
	commands.registerCommand('todomd.followLink', (treeItem: TaskTreeItem) => {
		followLinks(treeItem.task.links);
	});
	commands.registerTextEditorCommand('todomd.setLastVisit', async editor => {
		const numberOfHours = Number(await vscode.window.showInputBox({
			prompt: 'Number of Hours ago',
		}));
		if (!numberOfHours) {
			return;
		}
		updateLastVisitGlobalState(editor.document.uri.toString(), dayjs().subtract(numberOfHours, 'hour').toDate());
	});
	commands.registerTextEditorCommand('todomd.incrementPriority', editor => {
		const lineNumber = editor.selection.active.line;
		incrementOrDecrementPriority(editor.document, lineNumber, 'increment');
	});
	commands.registerTextEditorCommand('todomd.decrementPriority', editor => {
		const lineNumber = editor.selection.active.line;
		incrementOrDecrementPriority(editor.document, lineNumber, 'decrement');
	});
	commands.registerCommand('todomd.showWebviewSettings', (treeItem: TaskTreeItem) => {
		openSettingGuiAt('todomd.webview');
	});
	commands.registerTextEditorCommand('todomd.toggleComment', editor => {
		const wEdit = new WorkspaceEdit();
		const selections = editor.selections;
		for (const selection of selections) {
			const start = selection.start.line;
			const end = selection.end.line;
			for (let i = start; i <= end; i++) {
				toggleCommentAtLineWorkspaceEdit(wEdit, editor.document, i);
			}
		}
		applyEdit(wEdit, editor.document);
	});
}

function noArchiveFileMessage() {
	vscode.window.showWarningMessage('No default archive file specified');
}

export async function checkDefaultFileAndNotify(): Promise<boolean> {
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
/**
 * Updates state for archived tasks
 */
export async function updateArchivedTasks() {
	if (!extensionConfig.defaultArchiveFile) {
		return;
	}
	const document = await workspace.openTextDocument(vscode.Uri.file(extensionConfig.defaultArchiveFile));
	const parsedArchiveTasks = await parseDocument(document);
	state.archivedTasks = parsedArchiveTasks.tasks;
	updateArchivedTasksTreeView();
}
/**
 * vscode `WorkspaceEdit` allowes changing files that are not even opened.
 *
 * `document.save()` is needed to prevent opening those files after applying the edit.
 */
export async function applyEdit(wEdit: WorkspaceEdit, document: vscode.TextDocument) {
	await workspace.applyEdit(wEdit);
	return await document.save();
}

