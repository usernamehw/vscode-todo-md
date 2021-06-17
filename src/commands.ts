import dayjs from 'dayjs';
import sample from 'lodash/sample';
import { commands, Position, QuickPickItem, Range, Selection, TextDocument, TextEditor, TextEditorEdit, ThemeIcon, window, WorkspaceEdit } from 'vscode';
import { appendTaskToFile, archiveTasks, editTaskWorkspaceEdit, hideTask, incrementCountForTask, incrementOrDecrementPriority, removeOverdueWorkspaceEdit, resetAllRecurringTasks, revealTask, setDueDate, startTask, toggleCommentAtLineWorkspaceEdit, toggleDoneAtLine, toggleDoneOrIncrementCount, toggleTaskCollapseWorkspaceEdit, tryToDeleteTask } from './documentActions';
import { DueDate } from './dueDate';
import { updateEverything } from './events';
import { Constants, extensionConfig, extensionState, Global, updateLastVisitGlobalState, updateState } from './extension';
import { defaultSortTasks, SortProperty, sortTasks } from './sort';
import { TheTask } from './TheTask';
import { helpCreateDueDate } from './time/setDueDateHelper';
import { getDateInISOFormat } from './time/timeUtils';
import { TaskTreeItem } from './treeViewProviders/taskProvider';
import { getArchivedDocument, tasksView, updateAllTreeViews, updateTasksTreeView } from './treeViewProviders/treeViews';
import { CommandIds, ExtensionState, TreeItemSortType, VscodeContext } from './types';
import { applyEdit, checkArchiveFileAndNotify, checkDefaultFileAndNotify, getActiveOrDefaultDocument, specifyDefaultFile } from './utils/extensionUtils';
import { forEachTask, getTaskAtLineExtension } from './utils/taskUtils';
import { fancyNumber } from './utils/utils';
import { followLink, followLinks, getFullRangeFromLines, inputOffset, openFileInEditor, openInUntitled, openSettingGuiAt, setContext, toggleGlobalSetting, updateSetting } from './utils/vscodeUtils';
/**
 * Register all commands. Names should match **"commands"** in `package.json`
 */
export function registerAllCommands() {
	commands.registerCommand(CommandIds.toggleDone, async (treeItem?: TaskTreeItem) => {
		const editor = window.activeTextEditor;
		let document: TextDocument;
		let lineNumbers: number[] = [];
		if (treeItem) {
			lineNumbers.push(treeItem.task.lineNumber);
			document = await getActiveOrDefaultDocument();
		} else {
			if (!editor) {
				return;
			}
			lineNumbers = getSelectedLineNumbers(editor);
			document = editor.document;
		}

		for (const ln of lineNumbers) {
			await toggleDoneOrIncrementCount(document, ln);
		}

		await updateState();
		updateAllTreeViews();
	});
	commands.registerCommand(CommandIds.hideTask, async (treeItem?: TaskTreeItem) => {
		if (!treeItem) {
			return;
		}
		const lineNumber = treeItem.task.lineNumber;
		const document = await getActiveOrDefaultDocument();

		hideTask(document, lineNumber);

		await updateState();
		updateAllTreeViews();
	});
	commands.registerCommand(CommandIds.collapseAllNestedTasks, async () => {
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
	commands.registerCommand(CommandIds.expandAllTasks, async () => {
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
	commands.registerCommand(CommandIds.focusTasksWebviewAndInput, async () => {
		await commands.executeCommand('todomd.webviewTasks.focus');
		Global.webviewProvider.focusFilterInput();
	});
	commands.registerCommand(CommandIds.deleteTask, async (treeItem?: TaskTreeItem) => {
		if (!treeItem) {
			return;
		}
		const lineNumber = treeItem.task.lineNumber;
		const document = await getActiveOrDefaultDocument();

		await tryToDeleteTask(document, lineNumber);

		await updateState();
		updateAllTreeViews();
	});
	commands.registerTextEditorCommand(CommandIds.archiveCompletedTasks, editor => {
		const selection = editor.selection;
		if (selection.isEmpty) {
			// Archive all completed tasks
			const completedTasks = extensionState.tasks.filter(t => t.done);
			archiveTasks(completedTasks, editor.document);
		} else {
			// Archive only selected completed tasks
			const selectedCompletedTasks = [];
			for (let i = selection.start.line; i <= selection.end.line; i++) {
				const task = getTaskAtLineExtension(i);
				if (task && task.done) {
					selectedCompletedTasks.push(task);
				}
			}
			archiveTasks(selectedCompletedTasks, editor.document);
		}
	});
	commands.registerCommand(CommandIds.startTask, async (taskTreeItem?: TaskTreeItem) => {
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
	commands.registerTextEditorCommand(CommandIds.sortByPriority, (editor, edit) => {
		sortTasksInEditor(editor, edit, 'priority');
	});
	commands.registerTextEditorCommand(CommandIds.sortByDefault, (editor, edit) => {
		sortTasksInEditor(editor, edit, 'default');
	});
	commands.registerTextEditorCommand(CommandIds.createSimilarTask, async editor => {
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
		edit.insert(editor.document.uri, new Position(line.rangeIncludingLineBreak.end.line, line.rangeIncludingLineBreak.end.character), `${newTaskAsString}\n`);

		await applyEdit(edit, editor.document);

		editor.selection = new Selection(line.lineNumber + 1, 0, line.lineNumber + 1, 0);
	});
	commands.registerCommand(CommandIds.getNextTask, async () => {
		await updateState();
		const tasks = extensionState.tasks.filter(t => !t.done);
		if (!tasks.length) {
			window.showInformationMessage('No tasks');
			return;
		}
		const sortedTasks = defaultSortTasks(tasks);
		const task = sortedTasks[0];
		showTaskInNotification(task);
	});
	commands.registerCommand(CommandIds.getFewNextTasks, async () => {
		await updateState();
		const tasks = extensionState.tasks.filter(t => !t.done);
		if (!tasks.length) {
			window.showInformationMessage('No tasks');
			return;
		}
		const sortedTasks = defaultSortTasks(tasks)
			.slice(0, extensionConfig.getNextNumberOfTasks);

		window.showInformationMessage(sortedTasks.map((task, i) => `${fancyNumber(i + 1)} ${TheTask.formatTask(task)}`).join('\n'), {
			modal: true,
		});
	});
	commands.registerCommand(CommandIds.getRandomTask, async () => {
		await updateState();
		const tasks = extensionState.tasks.filter(t => !t.done);
		if (!tasks.length) {
			window.showInformationMessage('No tasks');
			return;
		}
		const randomTask = sample(tasks)!;
		showTaskInNotification(randomTask);
	});
	commands.registerCommand(CommandIds.addTaskToDefaultFile, async () => {
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
	commands.registerCommand(CommandIds.addTaskToActiveFile, async () => {
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
	commands.registerTextEditorCommand(CommandIds.setDueDate, editor => {
		openSetDueDateInputbox(editor.document, editor.selection.active.line);
	});
	commands.registerCommand(CommandIds.setDueDateWithArgs, async (document: TextDocument, wordRange: Range, dueDate: string) => {
		const lineNumber = wordRange.start.line;
		const edit = new WorkspaceEdit();
		edit.delete(document.uri, wordRange);
		await applyEdit(edit, document);
		setDueDate(document, lineNumber, dueDate);
	});
	commands.registerCommand(CommandIds.openDefaultArchiveFile, async () => {
		const isDefaultArchiveFileSpecified = await checkArchiveFileAndNotify();
		if (!isDefaultArchiveFileSpecified) {
			return;
		}
		openFileInEditor(extensionConfig.defaultArchiveFile);
	});
	commands.registerCommand(CommandIds.openDefaultFile, async () => {
		const isDefaultFileSpecified = await checkDefaultFileAndNotify();
		if (!isDefaultFileSpecified) {
			return;
		}
		openFileInEditor(extensionConfig.defaultFile);
	});
	commands.registerCommand(CommandIds.specifyDefaultFile, specifyDefaultFile);
	commands.registerCommand(CommandIds.completeTask, async () => {
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
	commands.registerTextEditorCommand(CommandIds.filter, editor => {
		const quickPick = window.createQuickPick();
		quickPick.items = extensionConfig.savedFilters.map(filter => ({
			label: filter.title,
		}) as QuickPickItem);
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
	commands.registerCommand(CommandIds.clearFilter, editor => {
		tasksView.description = undefined;
		setContext(VscodeContext.filterActive, false);
		extensionState.taskTreeViewFilterValue = '';
		updateTasksTreeView();
	});
	commands.registerCommand(CommandIds.clearGlobalState, () => {
		(extensionState.extensionContext.globalState as any)._value = {};
		extensionState.extensionContext.globalState.update('hack', 'toClear');// Required to clear state
	});
	commands.registerCommand(CommandIds.showGlobalState, () => {
		const lastVisitByFile = extensionState.extensionContext.globalState.get(Constants.LAST_VISIT_BY_FILE_STORAGE_KEY) as ExtensionState['lastVisitByFile'];
		let str = '';
		for (const key in lastVisitByFile) {
			str += `${new Date(lastVisitByFile[key])} | ${dayjs().to(lastVisitByFile[key])} | ${key}\n` ;
		}
		openInUntitled(str);
	});
	commands.registerCommand(CommandIds.removeAllOverdue, async () => {
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
	commands.registerCommand(CommandIds.goToLine, (lineNumber: number) => {
		revealTask(lineNumber);
	});
	commands.registerCommand(CommandIds.goToLineInArchived, async (lineNumber: number) => {
		revealTask(lineNumber, await getArchivedDocument());
	});
	commands.registerTextEditorCommand(CommandIds.resetAllRecurringTasks, editor => {
		const lastVisit = extensionState.lastVisitByFile[editor.document.uri.toString()];
		resetAllRecurringTasks(editor.document, lastVisit);
	});
	commands.registerCommand(CommandIds.followLink, (treeItem: TaskTreeItem) => {
		followLinks(treeItem.task.links);
	});
	commands.registerTextEditorCommand(CommandIds.setLastVisit, async editor => {
		const numberOfHours = Number(await window.showInputBox({
			prompt: 'Number of Hours ago',
		}));
		if (!numberOfHours) {
			return;
		}
		updateLastVisitGlobalState(editor.document.uri.toString(), dayjs().subtract(numberOfHours, 'hour').toDate());
	});
	commands.registerTextEditorCommand(CommandIds.incrementPriority, editor => {
		const lineNumber = editor.selection.active.line;
		incrementOrDecrementPriority(editor.document, lineNumber, 'increment');
	});
	commands.registerTextEditorCommand(CommandIds.decrementPriority, editor => {
		const lineNumber = editor.selection.active.line;
		incrementOrDecrementPriority(editor.document, lineNumber, 'decrement');
	});
	commands.registerCommand(CommandIds.showWebviewSettings, (treeItem: TaskTreeItem) => {
		openSettingGuiAt('todomd.webview');
	});
	commands.registerCommand(CommandIds.webviewToggleShowRecurringUpcoming, () => {
		updateSetting('todomd.webview.showRecurringUpcoming', !extensionConfig.webview.showRecurringUpcoming);
	});
	commands.registerTextEditorCommand(CommandIds.toggleComment, editor => {
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
	commands.registerCommand(CommandIds.toggleTagsTreeViewSorting, () => {
		toggleGlobalSetting('todomd.sortTagsView', [TreeItemSortType.alphabetic, TreeItemSortType.count]);
	});
	commands.registerCommand(CommandIds.toggleProjectsTreeViewSorting, () => {
		toggleGlobalSetting('todomd.sortProjectsView', [TreeItemSortType.alphabetic, TreeItemSortType.count]);
	});
	commands.registerCommand(CommandIds.toggleContextsTreeViewSorting, () => {
		toggleGlobalSetting('todomd.sortContextsView', [TreeItemSortType.alphabetic, TreeItemSortType.count]);
	});
	// ──── Dev ─────────────────────────────────────────────────────────────
	commands.registerTextEditorCommand(CommandIds.replaceWithToday, editor => {
		const wordRange = editor.document.getWordRangeAtPosition(editor.selection.active, /\d{4}-\d{2}-\d{2}/);
		if (!wordRange) {
			return;
		}
		editor.edit(builder => {
			builder.replace(wordRange, getDateInISOFormat());
		});
	});
	// ──────────────────────────────────────────────────────────────────────
	commands.registerTextEditorCommand(CommandIds.sortTaskParts, async editor => {
		const lineNumbers = getSelectedLineNumbers(editor);
		const edit = new WorkspaceEdit();
		for (const ln of lineNumbers) {
			const task = getTaskAtLineExtension(ln);
			if (!task) {
				continue;
			}
			editTaskWorkspaceEdit(edit, editor.document, task);
		}
		await applyEdit(edit, editor.document);
	});
	// ────────────────────────────────────────────────────────────
}
/**
 * Append task to the file.
 *
 * Optionally adds creation date if user configured `addCreationDate`.
 */
async function addTaskToFile(text: string, filePath: string) {
	const creationDate = extensionConfig.addCreationDate ? `{cr:${getDateInISOFormat(new Date(), extensionConfig.creationDateIncludeTime)}} ` : '';
	return await appendTaskToFile(`${creationDate}${text}`, filePath);
}
/**
 * Show formatted task in notification. Also show button to Follow link if links are present in this task.
 */
async function showTaskInNotification(task: TheTask) {
	const formattedTask = TheTask.formatTask(task);
	if (task.links.length) {
		const buttonFollowLink = 'Follow link';
		const shouldFollow = await window.showInformationMessage(formattedTask, buttonFollowLink);
		if (shouldFollow === buttonFollowLink) {
			followLinks(task.links);
		}
	} else {
		window.showInformationMessage(formattedTask);
	}
}
function getSelectedLineNumbers(editor: TextEditor): number[] {
	const lineNumbers: number[] = [];
	for (const selection of editor.selections) {
		for (let i = selection.start.line; i <= selection.end.line; i++) {
			lineNumbers.push(i);
		}
	}
	return Array.from(new Set(lineNumbers));// leave only unique line numbers
}
/**
 * Sort tasks in editor. Default sort is by due date. Same due date sorted by priority.
 */
function sortTasksInEditor(editor: TextEditor, edit: TextEditorEdit, sortProperty: 'default' | 'priority') {
	const selection = editor.selection;
	let lineStart = selection.start.line;
	let lineEnd = selection.end.line;
	if (selection.isEmpty) {
		lineStart = 0;
		lineEnd = editor.document.lineCount - 1;
	}
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

export function openSetDueDateInputbox(document: TextDocument, lineNumber: number) {
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
