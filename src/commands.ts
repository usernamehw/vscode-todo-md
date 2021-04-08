import dayjs from 'dayjs';
import sample from 'lodash/sample';
import vscode, { commands, TextDocument, TextEditor, TextEditorEdit, ThemeIcon, window, WorkspaceEdit } from 'vscode';
import { appendTaskToFile, archiveTasks, hideTask, incrementCountForTask, incrementOrDecrementPriority, removeOverdueWorkspaceEdit, resetAllRecurringTasks, revealTask, setDueDate, startTask, toggleCommentAtLineWorkspaceEdit, toggleDoneAtLine, toggleDoneOrIncrementCount, toggleTaskCollapseWorkspaceEdit, tryToDeleteTask } from './documentActions';
import { DueDate } from './dueDate';
import { updateEverything } from './events';
import { extensionConfig, extensionState, Global, LAST_VISIT_BY_FILE_STORAGE_KEY, updateLastVisitGlobalState, updateState } from './extension';
import { defaultSortTasks, SortProperty, sortTasks } from './sort';
import { TheTask } from './TheTask';
import { helpCreateDueDate } from './time/setDueDateHelper';
import { getDateInISOFormat } from './time/timeUtils';
import { TaskTreeItem } from './treeViewProviders/taskProvider';
import { tasksView, updateAllTreeViews, updateTasksTreeView } from './treeViewProviders/treeViews';
import { ExtensionState, VscodeContext } from './types';
import { applyEdit, checkArchiveFileAndNotify, checkDefaultFileAndNotify, getActiveOrDefaultDocument, specifyDefaultFile } from './utils/extensionUtils';
import { forEachTask, getTaskAtLineExtension } from './utils/taskUtils';
import { fancyNumber } from './utils/utils';
import { followLink, followLinks, getFullRangeFromLines, inputOffset, openFileInEditor, openSettingGuiAt, setContext, updateSetting } from './utils/vscodeUtils';
/**
 * Register all commands. Names should match **"commands"** in `package.json`
 */
export function registerAllCommands() {
	commands.registerCommand('todomd.toggleDone', async (treeItem?: TaskTreeItem) => {
		const editor = window.activeTextEditor;
		let document: vscode.TextDocument;
		let lineNumbers: number[] = [];
		if (treeItem) {
			lineNumbers.push(treeItem.task.lineNumber);
			document = await getActiveOrDefaultDocument();
		} else {
			if (!editor) {
				return;
			}
			for (const selection of editor.selections) {
				for (let i = selection.start.line; i <= selection.end.line; i++) {
					lineNumbers.push(i);
				}
			}
			lineNumbers = Array.from(new Set(lineNumbers));// leave only unique line numbers
			document = editor.document;
		}

		for (const ln of lineNumbers) {
			await toggleDoneOrIncrementCount(document, ln);
		}

		await updateState();
		updateAllTreeViews();
	});
	commands.registerCommand('todomd.hideTask', async (treeItem?: TaskTreeItem) => {
		if (!treeItem) {
			return;
		}
		const lineNumber = treeItem.task.lineNumber;
		const document = await getActiveOrDefaultDocument();

		hideTask(document, lineNumber);

		await updateState();
		updateAllTreeViews();
	});
	commands.registerCommand('todomd.collapseAllNestedTasks', async () => {
		const edit = new WorkspaceEdit();
		const activeDocument = await getActiveOrDefaultDocument();
		forEachTask(task => {
			if (TheTask.hasNestedTasks(task) && !task.isCollapsed) {
				toggleTaskCollapseWorkspaceEdit(edit, activeDocument, task.lineNumber);
			}
		});
		await applyEdit(edit, activeDocument);
		updateEverything();
	});
	commands.registerCommand('todomd.expandAllTasks', async () => {
		const edit = new WorkspaceEdit();
		const activeDocument = await getActiveOrDefaultDocument();
		forEachTask(task => {
			if (TheTask.hasNestedTasks(task) && task.isCollapsed) {
				toggleTaskCollapseWorkspaceEdit(edit, activeDocument, task.lineNumber);
			}
		});
		await applyEdit(edit, activeDocument);
		updateEverything();
	});
	commands.registerCommand('todomd.focusTasksWebviewAndInput', async () => {
		await commands.executeCommand('todomd.webviewTasks.focus');
		Global.webviewProvider.focusFilterInput();
	});
	commands.registerCommand('todomd.deleteTask', async (treeItem?: TaskTreeItem) => {
		if (!treeItem) {
			return;
		}
		const lineNumber = treeItem.task.lineNumber;
		const document = await getActiveOrDefaultDocument();

		await tryToDeleteTask(document, lineNumber);

		await updateState();
		updateAllTreeViews();
	});
	commands.registerTextEditorCommand('todomd.archiveCompletedTasks', editor => {
		const completedTasks = extensionState.tasks.filter(t => t.done);
		archiveTasks(completedTasks, editor.document);
	});
	commands.registerTextEditorCommand('todomd.archiveSelectedCompletedTasks', editor => {
		const selection = editor.selection;
		const selectedCompletedTasks = [];

		for (let i = selection.start.line; i <= selection.end.line; i++) {
			const task = getTaskAtLineExtension(i);
			if (task && task.done) {
				selectedCompletedTasks.push(task);
			}
		}
		archiveTasks(selectedCompletedTasks, editor.document);
	});
	commands.registerCommand('todomd.startTask', async (taskTreeItem?: TaskTreeItem) => {
		let lineNumber: number;
		let document: TextDocument;
		if (taskTreeItem) {
			lineNumber = taskTreeItem.task.lineNumber;
			document = await getActiveOrDefaultDocument();
		} else {
			const editor = window.activeTextEditor;
			if (!editor) {
				return;
			}
			lineNumber = editor.selection.start.line;
			document = editor.document;
		}
		startTask(document, lineNumber);
	});
	commands.registerTextEditorCommand('todomd.sortByPriority', (editor, edit) => {
		sortTasksInEditor(editor, edit, 'priority');
	});
	commands.registerTextEditorCommand('todomd.sortByDefault', (editor, edit) => {
		sortTasksInEditor(editor, edit, 'default');
	});
	commands.registerTextEditorCommand('todomd.createSimilarTask', async editor => {
		// Create a task with all the tags, projects and contexts of another task
		const selection = editor.selection;
		const task = getTaskAtLineExtension(selection.start.line);
		if (!task) {
			return;
		}
		const line = editor.document.lineAt(task.lineNumber);
		const edit = new WorkspaceEdit();

		const tagsAsString = task.tags.map(tag => ` #${tag}`).join('');
		const projectsAsString = task.projects.map(project => `+${project}`).join(' ');
		const contextsAsString = task.contexts.map(context => `@${context}`).join(' ');
		let newTaskAsString = tagsAsString;
		newTaskAsString += projectsAsString ? ` ${projectsAsString}` : '';
		newTaskAsString += contextsAsString ? ` ${contextsAsString}` : '';
		edit.insert(editor.document.uri, new vscode.Position(line.rangeIncludingLineBreak.end.line, line.rangeIncludingLineBreak.end.character), `${newTaskAsString}\n`);

		await applyEdit(edit, editor.document);

		editor.selection = new vscode.Selection(line.lineNumber + 1, 0, line.lineNumber + 1, 0);
	});
	commands.registerCommand('todomd.getNextTask', async () => {
		await updateState();
		const tasks = extensionState.tasks.filter(t => !t.done);
		if (!tasks.length) {
			vscode.window.showInformationMessage('No tasks');
			return;
		}
		const sortedTasks = defaultSortTasks(tasks);
		const task = sortedTasks[0];
		showTaskInNotification(task);
	});
	commands.registerCommand('todomd.getFewNextTasks', async () => {
		await updateState();
		const tasks = extensionState.tasks.filter(t => !t.done);
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
		const tasks = extensionState.tasks.filter(t => !t.done);
		if (!tasks.length) {
			vscode.window.showInformationMessage('No tasks');
			return;
		}
		const randomTask = sample(tasks)!;
		showTaskInNotification(randomTask);
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
		const activeFilePath = extensionState.activeDocument?.uri.fsPath;
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
	/**
	 * Append task to the file.
	 *
	 * Optionally adds creation date if user configured `addCreationDate`.
	 */
	async function addTaskToFile(text: string, filePath: string) {
		const creationDate = extensionConfig.addCreationDate ? `{cr:${getDateInISOFormat(new Date(), extensionConfig.creationDateIncludeTime)}} ` : '';
		return await appendTaskToFile(`${creationDate}${text}`, filePath);
	}
	commands.registerTextEditorCommand('todomd.setDueDate', editor => {
		openSetDueDateInputbox(editor.document, editor.selection.active.line);
	});
	commands.registerCommand('todomd.setDueDateWithArgs', async (document: TextDocument, wordRange: vscode.Range, dueDate: string) => {
		const lineNumber = wordRange.start.line;
		const edit = new WorkspaceEdit();
		edit.delete(document.uri, wordRange);
		await applyEdit(edit, document);
		setDueDate(document, lineNumber, dueDate);
	});
	commands.registerCommand('todomd.openDefaultArvhiveFile', async () => {
		const isDefaultArchiveFileSpecified = await checkArchiveFileAndNotify();
		if (!isDefaultArchiveFileSpecified) {
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
		const document = await getActiveOrDefaultDocument();
		const notCompletedTasks = defaultSortTasks(extensionState.tasks.filter(task => !task.done)).map(task => TheTask.formatTask(task));
		const pickedTask = await window.showQuickPick(notCompletedTasks, {
			placeHolder: 'Choose a task to complete',
		});
		if (!pickedTask) {
			return;
		}
		const task = extensionState.tasks.find(t => TheTask.formatTask(t) === pickedTask);
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
		quickPick.items = extensionConfig.savedFilters.map(filter => ({
			label: filter.title,
		}) as vscode.QuickPickItem);
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
			extensionState.taskTreeViewFilterValue = filterStr;
			updateTasksTreeView();
		});
	});
	commands.registerCommand('todomd.clearFilter', editor => {
		tasksView.description = undefined;
		setContext(VscodeContext.filterActive, false);
		extensionState.taskTreeViewFilterValue = '';
		updateTasksTreeView();
	});
	commands.registerCommand('todomd.clearGlobalState', () => {
	// @ts-ignore No API
		extensionState.extensionContext.globalState._value = {};
		extensionState.extensionContext.globalState.update('hack', 'toClear');// Is this required to clear state?
	});
	commands.registerCommand('todomd.showGlobalState', () => {
		// @ts-ignore
		const lastVisitByFile: ExtensionState['lastVisitByFile'] = extensionState.extensionContext.globalState.get(LAST_VISIT_BY_FILE_STORAGE_KEY);
		for (const key in lastVisitByFile) {
			console.log(key, new Date(lastVisitByFile[key]), dayjs().to(lastVisitByFile[key]));// TODO: show in output / untitled
		}
	});
	commands.registerCommand('todomd.removeAllOverdue', async () => {
		const activeDocument = await getActiveOrDefaultDocument();
		if (!activeDocument) {
			return;
		}
		const edit = new WorkspaceEdit();
		forEachTask(task => {
			if (task.overdueRange) {
				removeOverdueWorkspaceEdit(edit, activeDocument.uri, task);
			}
		});
		applyEdit(edit, activeDocument);
	});
	commands.registerCommand('todomd.goToLine', (lineNumber: number) => {
		revealTask(lineNumber);
	});
	commands.registerTextEditorCommand('todomd.resetAllRecurringTasks', editor => {
		const lastVisit = extensionState.lastVisitByFile[editor.document.uri.toString()];
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
	commands.registerCommand('todomd.webview.toggleShowRecurringUpcoming', () => {
		updateSetting('todomd.webview.showRecurringUpcoming', !extensionConfig.webview.showRecurringUpcoming);
	});
	commands.registerTextEditorCommand('todomd.toggleComment', editor => {
		const edit = new WorkspaceEdit();
		const selections = editor.selections;
		for (const selection of selections) {
			const start = selection.start.line;
			const end = selection.end.line;
			for (let i = start; i <= end; i++) {
				toggleCommentAtLineWorkspaceEdit(edit, editor.document, i);
			}
		}
		applyEdit(edit, editor.document);
	});
}
/**
 * Show formatted task in notification. Also show button to Follow link if links are present in this task.
 */
async function showTaskInNotification(task: TheTask) {
	const formattedTask = TheTask.formatTask(task);
	if (task.links.length) {
		const buttonFollowLink = 'Follow link';
		const shouldFollow = await vscode.window.showInformationMessage(formattedTask, buttonFollowLink);
		if (shouldFollow === buttonFollowLink) {
			followLinks(task.links);
		}
	} else {
		vscode.window.showInformationMessage(formattedTask);
	}
}
/**
 * Sort tasks in editor. Default sort is by due date. Same due date sorted by priority.
 */
function sortTasksInEditor(editor: TextEditor, edit: TextEditorEdit, sortProperty: 'default' | 'priority') {
	const selection = editor.selection;
	if (selection.isEmpty) {
		vscode.window.showInformationMessage('Select tasks to sort');
		return;
	}
	const lineStart = selection.start.line;
	const lineEnd = selection.end.line;
	const tasks: TheTask[] = [];
	for (let i = lineStart; i <= lineEnd; i++) {
		const task = getTaskAtLineExtension(i);
		if (task) {
			tasks.push(task);
		}
	}
	let sortedTasks: TheTask[];
	if (sortProperty === 'priority') {
		sortedTasks = sortTasks(tasks, SortProperty.priority);
	} else {
		sortedTasks = defaultSortTasks(tasks);
	}
	const result = sortedTasks.map(t => t.rawText).join('\n');
	edit.replace(getFullRangeFromLines(editor.document, lineStart, lineEnd), result);
}

export function openSetDueDateInputbox(document: vscode.TextDocument, lineNumber: number) {
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

	inputBox.onDidAccept(async () => {
		if (!value) {
			return;
		}
		const newDueDate = helpCreateDueDate(value);

		if (newDueDate) {
			await setDueDate(document, lineNumber, newDueDate);
			inputBox.hide();
			inputBox.dispose();
			updateEverything();
		}
	});
}
